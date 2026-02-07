"""
Async Visa VTC API client with proven X-Pay-Token auth.

Signing rules (confirmed working via core/scripts/visa pipelines):
  - Strip the first path segment before HMAC  (e.g. /vctc/... → customerrules/...)
  - Query param: apikey=<key>   (lowercase 'k')
  - Body: compact JSON  separators=(",",":")
  - Send the EXACT bytes you signed  (use `content=`, not `json=`)
"""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import UTC, datetime
from typing import Any

import httpx
from aws_lambda_powertools import Logger

from .constants import API_KEY, SHARED_SECRET, VISA_BASE

logger = Logger(service="VTCClient")


class VTCResponse:
    """Wrapper for VTC API responses."""

    def __init__(self, status: int, body: dict[str, Any], elapsed_ms: float):
        self.status = status
        self.body = body
        self.elapsed_ms = elapsed_ms

    @property
    def ok(self) -> bool:
        return 200 <= self.status < 300

    @property
    def conflict(self) -> bool:
        """409 — resource already exists (idempotent success for enroll)."""
        return self.status == 409

    @property
    def resource(self) -> dict[str, Any]:
        return self.body.get("resource", {})

    def __repr__(self) -> str:
        return f"VTCResponse(status={self.status}, elapsed={self.elapsed_ms:.0f}ms)"


class VTCClient:
    """Async client for Visa Transaction Controls API."""

    def __init__(self, api_key: str = API_KEY, shared_secret: str = SHARED_SECRET):
        self._api_key = api_key
        self._shared_secret = shared_secret
        self._client = httpx.AsyncClient(base_url=VISA_BASE, timeout=30.0)

    @staticmethod
    def _sign_resource_path(request_path: str) -> str:
        """
        Strip the first path segment before signing.
          /vctc/customerrules/v1/... → customerrules/v1/...
          /vdp/helloworld           → helloworld
        """
        p = request_path.lstrip("/")
        parts = p.split("/")
        return "/".join(parts[1:]) if len(parts) > 1 else p

    def _x_pay_token(self, timestamp: str, resource_path: str, query_string: str, body: str) -> str:
        """Generate X-Pay-Token header."""
        msg = f"{timestamp}{resource_path}{query_string}{body}"
        digest = hmac.new(
            self._shared_secret.encode("utf-8"),
            msg.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return f"xv2:{timestamp}:{digest}"

    async def request(
        self, method: str, path: str, payload: dict[str, Any] | None = None
    ) -> VTCResponse:
        """Make authenticated VTC API request."""
        query_string = f"apikey={self._api_key}"  # LOWERCASE k (proven working)
        body_str = json.dumps(payload, separators=(",", ":"), ensure_ascii=False) if payload else ""
        resource_path = self._sign_resource_path(path)
        ts = str(int(datetime.now(UTC).timestamp()))
        token = self._x_pay_token(ts, resource_path, query_string, body_str)

        url = f"{path}?{query_string}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-pay-token": token,
        }

        logger.debug(f"VTC request: {method} {path}", signed_path=resource_path)

        # Use content= not json= to send exact signed bytes
        response = await self._client.request(
            method, url, headers=headers, content=body_str.encode("utf-8") if body_str else None
        )

        body = response.json() if response.text else {}
        elapsed_ms = response.elapsed.total_seconds() * 1000

        result = VTCResponse(response.status_code, body, elapsed_ms)
        logger.info(f"VTC response: {response.status_code}", elapsed_ms=f"{elapsed_ms:.0f}ms")

        if not result.ok and not result.conflict:
            logger.warning("VTC API error", status=response.status_code, body=body)

        return result

    async def get_rules(self, doc_id: str) -> VTCResponse:
        """Get all rules for a VTC document."""
        return await self.request(
            "GET", f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"
        )

    async def put_rules(self, doc_id: str, payload: dict[str, Any]) -> VTCResponse:
        """Replace all rules for a VTC document."""
        return await self.request(
            "PUT", f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules", payload
        )

    async def delete_rules(self, doc_id: str) -> VTCResponse:
        """Delete all rules for a VTC document."""
        return await self.request(
            "DELETE", f"/vctc/customerrules/v1/consumertransactioncontrols/{doc_id}/rules"
        )

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()
