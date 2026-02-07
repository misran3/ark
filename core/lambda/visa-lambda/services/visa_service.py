"""
VISA Transaction Controls (VTC) Service.

Handles mTLS authentication with VISA Sandbox and provides methods to:
- Create spending controls (limits, category blocks)
- Retrieve active controls
- Delete controls

Certificates are fetched from S3 on cold start and cached in /tmp.
"""

import os
import boto3
import httpx
from aws_lambda_powertools import Logger
from shared.models import VisaControlRule

logger = Logger(service="visa-service")


class VisaService:
    """Service for interacting with VISA Transaction Controls API."""

    def __init__(self):
        self.s3 = boto3.client("s3")
        self.bucket = "synesthesia-pay-artifacts"

        # Local paths in Lambda's writable /tmp directory
        self.cert_path = "/tmp/visa-cert.pem"
        self.key_path = "/tmp/visa-pvtkey.pem"
        self.ca_path = "/tmp/visa-sbx.pem"

        self._ensure_certs()

        # Initialize mTLS client with credentials from env vars
        self.client = httpx.Client(
            base_url="https://sandbox.api.visa.com",
            cert=(self.cert_path, self.key_path),
            verify=self.ca_path,
            auth=(os.getenv("VISA_USER_ID", ""), os.getenv("VISA_PASSWORD", "")),
            timeout=30.0,
        )

    def _ensure_certs(self):
        """Download certificates from S3 if they don't exist in /tmp."""
        certs = {
            "visa/visa-cert.pem": self.cert_path,
            "visa/visa-pvtkey.pem": self.key_path,
            "visa/visa-sbx.pem": self.ca_path,
        }
        for s3_key, local_path in certs.items():
            if not os.path.exists(local_path):
                logger.info(f"Downloading {s3_key} from S3 to {local_path}")
                try:
                    self.s3.download_file(self.bucket, s3_key, local_path)
                    logger.info(f"Successfully downloaded {s3_key}")
                except Exception as e:
                    logger.error(f"Failed to download {s3_key}: {e}")
                    raise

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
            response = self.client.post(
                "/vctc/customerrules/v1/consumertransactioncontrols", json=payload
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
            response = self.client.get(
                f"/vctc/customerrules/v1/consumertransactioncontrols/{document_id}"
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
            response = self.client.delete(
                f"/vctc/customerrules/v1/consumertransactioncontrols/{document_id}"
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
