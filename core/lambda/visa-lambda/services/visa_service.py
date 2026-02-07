"""
VISA Transaction Controls (VTC) Service.

Handles X-Pay-Token authentication (API key + shared secret) with VISA Sandbox and provides methods to:
- Create spending controls (limits, category blocks)
- Retrieve active controls
- Delete controls

Auth is performed by generating an `x-pay-token` header for each request.
"""

import datetime
import hashlib
import hmac
import json
import os
import httpx
from aws_lambda_powertools import Logger
from shared.models import VisaControlRule

logger = Logger(service="visa-service")


class VisaService:
    """Service for interacting with VISA Transaction Controls API."""

    def __init__(self):
        # Note: project convention maps these env vars for VISA:
        # - VISA_USER_ID      -> API key for X-Pay-Token
        # - VISA_PASSWORD     -> shared secret for X-Pay-Token
        self.api_key = os.getenv("VISA_USER_ID", "")
        self.shared_secret = os.getenv("VISA_PASSWORD", "")

        # Initialize HTTP client (TLS uses default trust store)
        self.client = httpx.Client(
            base_url="https://sandbox.api.visa.com",
            timeout=30.0,
        )

    def _generate_x_pay_token(self, resource_path: str, query_string: str, body: str) -> str:
        """
        Generate VISA X-Pay-Token header value.

        Algorithm (matches `core/scripts/visa_auth.py`):
        - timestamp = Unix epoch seconds (UTC)
        - pre_hash = timestamp + resource_path + query_string + body
        - HMAC-SHA256(shared_secret, pre_hash)
        - token = xv2:{timestamp}:{hexdigest}
        """
        # Use timezone-aware UTC timestamp (avoid datetime.utcnow deprecation)
        timestamp = str(int(datetime.datetime.now(datetime.UTC).timestamp()))
        pre_hash_string = f"{timestamp}{resource_path}{query_string}{body}"
        secret = bytes(self.shared_secret, "utf-8")
        digest = hmac.new(secret, bytes(pre_hash_string, "utf-8"), digestmod=hashlib.sha256).hexdigest()
        return f"xv2:{timestamp}:{digest}"

    def _visa_request(self, method: str, path: str, payload: dict | None = None) -> httpx.Response:
        """
        Make an authenticated request to VISA using X-Pay-Token.

        `path` should be the full path portion (e.g. "/vdp/helloworld" or
        "/vctc/customerrules/v1/consumertransactioncontrols").
        """
        if not self.api_key or not self.shared_secret:
            raise ValueError("Missing VISA_USER_ID (apiKey) or VISA_PASSWORD (shared secret) environment variables")

        # Query string required by VISA sample auth (lowercase 'k')
        query_string = f"apikey={self.api_key}"

        # Resource path for token generation - strip first path segment
        # /vctc/customerrules/v1/... -> customerrules/v1/...
        # /vdp/helloworld -> helloworld
        resource_path = path.lstrip("/")
        parts = resource_path.split("/")
        resource_path = "/".join(parts[1:]) if len(parts) > 1 else resource_path

        body = ""
        headers: dict[str, str] = {"Accept": "application/json"}
        if payload is not None:
            body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
            headers["Content-Type"] = "application/json"

        token = self._generate_x_pay_token(resource_path, query_string, body)
        headers["x-pay-token"] = token

        url = f"{path}?{query_string}"

        # Send body exactly as signed (use `content`, not `json=`, to avoid spacing differences)
        response = self.client.request(method, url, headers=headers, content=body if body else None)

        return response

    def create_control(self, rule: VisaControlRule) -> dict:
        """
        Create a new VISA Transaction Control.

        POST /vctc/customerrules/v1/consumertransactioncontrols

        Args:
            rule: VisaControlRule with control_type, threshold, etc.

        Returns:
            dict with status and rule_id
        """
        logger.info(
            f"Creating VISA control: {rule.control_type} for card {rule.card_id}"
        )

        # Build the VTC API payload
        payload = {
            "primaryAccountNumber": rule.card_id,
            "controlType": rule.control_type,
            "isControlEnabled": rule.is_active,
        }

        if rule.threshold:
            payload["globalControls"] = {
                "transactionLimit": {
                    "value": rule.threshold,
                    "currency": "USD",
                }
            }

        if rule.merchant_categories:
            payload["merchantControls"] = {
                "allowedMerchantCategories": rule.merchant_categories
            }

        try:
            response = self._visa_request(
                "POST",
                "/vctc/customerrules/v1/consumertransactioncontrols",
                payload=payload,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"VISA control created successfully: {result}")
            return {
                "status": "success",
                "rule_id": result.get("documentID", rule.rule_id),
                "visa_response": result,
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"VISA API error: {e.response.status_code} - {e.response.text}")
            return {
                "status": "error",
                "error": f"VISA API returned {e.response.status_code}",
                "details": e.response.text,
            }
        except Exception as e:
            logger.error(f"Unexpected error calling VISA API: {e}")
            return {"status": "error", "error": str(e)}

    def get_controls(self, document_id: str) -> dict:
        """
        Retrieve a VISA Transaction Control by document ID.

        GET /vctc/customerrules/v1/consumertransactioncontrols/{documentID}

        Args:
            document_id: The VISA documentID returned when the control was created

        Returns:
            dict with control details
        """
        logger.info(f"Fetching VISA control: {document_id}")

        try:
            response = self._visa_request(
                "GET",
                f"/vctc/customerrules/v1/consumertransactioncontrols/{document_id}",
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"VISA API error: {e.response.status_code} - {e.response.text}")
            return {
                "status": "error",
                "error": f"VISA API returned {e.response.status_code}",
            }
        except Exception as e:
            logger.error(f"Unexpected error calling VISA API: {e}")
            return {"status": "error", "error": str(e)}

    def delete_control(self, document_id: str) -> dict:
        """
        Delete a VISA Transaction Control.

        DELETE /vctc/customerrules/v1/consumertransactioncontrols/{documentID}

        Args:
            document_id: The VISA documentID to delete

        Returns:
            dict with status
        """
        logger.info(f"Deleting VISA control: {document_id}")

        try:
            response = self._visa_request(
                "DELETE",
                f"/vctc/customerrules/v1/consumertransactioncontrols/{document_id}",
            )
            response.raise_for_status()
            return {"status": "success", "message": "Control deleted"}
        except httpx.HTTPStatusError as e:
            logger.error(f"VISA API error: {e.response.status_code} - {e.response.text}")
            return {
                "status": "error",
                "error": f"VISA API returned {e.response.status_code}",
            }
        except Exception as e:
            logger.error(f"Unexpected error calling VISA API: {e}")
            return {"status": "error", "error": str(e)}

    def get_rules(self, document_id: str) -> dict:
        """
        Get all rules for a VTC document.

        GET /vctc/customerrules/v1/consumertransactioncontrols/{documentID}/rules

        Args:
            document_id: The VISA documentID

        Returns:
            dict with rules or error
        """
        logger.info(f"Fetching VTC rules: {document_id}")

        try:
            response = self._visa_request(
                "GET",
                f"/vctc/customerrules/v1/consumertransactioncontrols/{document_id}/rules",
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"VISA API error: {e.response.status_code}")
            return {"status": "error", "error": f"VISA API returned {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Unexpected error calling VISA API: {e}")
            return {"status": "error", "error": str(e)}

    def put_rules(self, document_id: str, rules: dict) -> dict:
        """
        Replace all rules for a VTC document.

        PUT /vctc/customerrules/v1/consumertransactioncontrols/{documentID}/rules

        Args:
            document_id: The VISA documentID
            rules: Complete rules payload (globalControls, merchantControls, transactionControls)

        Returns:
            dict with status and response
        """
        logger.info(f"Updating VTC rules: {document_id}")

        try:
            response = self._visa_request(
                "PUT",
                f"/vctc/customerrules/v1/consumertransactioncontrols/{document_id}/rules",
                payload=rules,
            )
            response.raise_for_status()
            return {"status": "success", "response": response.json()}
        except httpx.HTTPStatusError as e:
            logger.error(f"VISA API error: {e.response.status_code}")
            return {"status": "error", "error": f"VISA API returned {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Unexpected error calling VISA API: {e}")
            return {"status": "error", "error": str(e)}
