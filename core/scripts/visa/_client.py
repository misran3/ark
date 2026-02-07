"""
Shared Visa VTC API client with proven X-Pay-Token auth.

Signing rules (confirmed working via visa_vtc_debug.py):
  - Strip the first path segment before HMAC  (e.g. /vctc/... → customerrules/...)
  - Query param: apikey=<key>   (lowercase 'k')
  - Body: compact JSON  separators=(",",":")
  - Send the EXACT bytes you signed  (use `data=`, not `json=`)

Every pipeline imports `vtc_request` from here.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import sys
import time
from datetime import UTC, datetime
from typing import Any

import requests

from _constants import API_KEY, SHARED_SECRET, VISA_BASE

# ---------------------------------------------------------------------------
# Logging setup — shared by all pipelines
# ---------------------------------------------------------------------------
LOG_FMT = "%(asctime)s  %(levelname)-5s  %(message)s"
LOG_DATE = "%H:%M:%S"

_root_configured = False


def setup_logging(name: str = "visa", level: int = logging.DEBUG) -> logging.Logger:
    """Return a logger with coloured console output (safe to call multiple times)."""
    global _root_configured
    logger = logging.getLogger(name)
    if not _root_configured:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(LOG_FMT, datefmt=LOG_DATE))
        logging.root.addHandler(handler)
        logging.root.setLevel(level)
        _root_configured = True
    return logger


log = setup_logging()

# ---------------------------------------------------------------------------
# X-Pay-Token helpers
# ---------------------------------------------------------------------------


def _now_epoch() -> str:
    return str(int(datetime.now(UTC).timestamp()))


def _compact_json(payload: dict[str, Any]) -> str:
    """Compact JSON — must match the signed bytes exactly."""
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)


def _sign_resource_path(request_path: str) -> str:
    """
    Strip the first path segment before signing.
      /vctc/customerrules/v1/... → customerrules/v1/...
      /vdp/helloworld           → helloworld
    """
    p = request_path.lstrip("/")
    parts = p.split("/")
    return "/".join(parts[1:]) if len(parts) > 1 else p


def _x_pay_token(timestamp: str, resource_path: str, query_string: str, body: str) -> str:
    msg = f"{timestamp}{resource_path}{query_string}{body}"
    digest = hmac.new(
        SHARED_SECRET.encode("utf-8"),
        msg.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"xv2:{timestamp}:{digest}"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


class VTCResponse:
    """Thin wrapper around a VTC API response for ergonomic access."""

    def __init__(self, status: int, body: dict[str, Any], elapsed_ms: float, raw: requests.Response):
        self.status = status
        self.body = body
        self.elapsed_ms = elapsed_ms
        self.raw = raw

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


def vtc_request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
    *,
    label: str = "",
) -> VTCResponse:
    """
    Make an authenticated request to the Visa VTC sandbox.

    Args:
        method:  HTTP verb — GET, POST, PUT, DELETE
        path:    Full API path, e.g. "/vctc/customerrules/v1/consumertransactioncontrols"
        payload: JSON body (omit for GET/DELETE without body)
        label:   Human-readable label for log output (e.g. "Enroll card")

    Returns:
        VTCResponse with .status, .body, .ok, .resource helpers.
    """
    query_string = f"apikey={API_KEY}"
    body_str = _compact_json(payload) if payload else ""
    resource_path = _sign_resource_path(path)
    ts = _now_epoch()
    token = _x_pay_token(ts, resource_path, query_string, body_str)

    url = f"{VISA_BASE}{path}?{query_string}"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-pay-token": token,
    }

    tag = f"[{label}]" if label else ""

    log.debug(f"{tag}  -> {method} {path}")
    log.debug(f"{tag}     signed_path={resource_path}")

    t0 = time.perf_counter()
    resp = requests.request(
        method,
        url,
        headers=headers,
        data=body_str.encode("utf-8") if body_str else None,
        timeout=30,
    )
    elapsed = (time.perf_counter() - t0) * 1000

    # Parse body
    try:
        body = resp.json() if resp.text else {}
    except ValueError:
        body = {"_raw": resp.text}

    result = VTCResponse(status=resp.status_code, body=body, elapsed_ms=elapsed, raw=resp)

    # Log result
    status_icon = "PASS" if result.ok or result.conflict else "FAIL"
    log.info(f"{tag}  <- {resp.status_code} ({elapsed:.0f}ms)  [{status_icon}]")

    # On failure, dump the body for debugging
    if not result.ok and not result.conflict:
        log.warning(f"{tag}     body: {json.dumps(body, indent=2)[:500]}")

    return result


def pretty(data: Any, indent: int = 2) -> str:
    """Pretty-print a dict/list for log output."""
    return json.dumps(data, indent=indent, default=str)
