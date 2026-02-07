from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import requests


@dataclass(frozen=True)
class XPayMode:
    name: str
    # how to compute resource_path_to_sign from request path
    mode: str  # "skip_first_segment" | "full_path" | "last_segment"
    query_param_name: str  # "apikey" vs "apiKey"
    compact_json: bool


def now_epoch_seconds() -> str:
    return str(int(datetime.now(UTC).timestamp()))


def canonical_json(payload: dict[str, Any], compact: bool) -> str:
    if compact:
        return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    return json.dumps(payload, indent=2, ensure_ascii=False)


def compute_resource_path_to_sign(request_path: str, mode: str) -> str:
    """
    request_path: like "/vdp/helloworld" or "/vctc/customerrules/v1/consumertransactioncontrols"
    """
    p = request_path.lstrip("/")

    if mode == "last_segment":
        return p.split("/")[-1]

    if mode == "full_path":
        return p

    if mode == "skip_first_segment":
        parts = p.split("/")
        return "/".join(parts[1:]) if len(parts) > 1 else p

    raise ValueError(f"Unknown mode: {mode}")


def x_pay_token(shared_secret: str, timestamp: str, resource_path: str, query_string: str, body: str) -> str:
    msg = f"{timestamp}{resource_path}{query_string}{body}"
    digest = hmac.new(shared_secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"xv2:{timestamp}:{digest}"


def visa_get_helloworld(base: str, api_key: str, shared_secret: str) -> requests.Response:
    # VISA special case: sign "helloworld" (skip /vdp/)
    request_path = "/vdp/helloworld"
    resource_path_to_sign = "helloworld"
    query_string = f"apiKey={api_key}"
    ts = now_epoch_seconds()
    token = x_pay_token(shared_secret, ts, resource_path_to_sign, query_string, body="")
    url = f"{base}{request_path}?{query_string}"
    headers = {"Accept": "application/json", "x-pay-token": token}
    return requests.get(url, headers=headers, timeout=20)


def visa_post_vtc(base: str, api_key: str, shared_secret: str, mode: XPayMode, payload: dict[str, Any], debug: bool) -> requests.Response:
    request_path = "/vctc/customerrules/v1/consumertransactioncontrols"
    query_string = f"{mode.query_param_name}={api_key}"

    body_str = canonical_json(payload, compact=mode.compact_json)
    resource_path_to_sign = compute_resource_path_to_sign(request_path, mode.mode)

    ts = now_epoch_seconds()
    token = x_pay_token(shared_secret, ts, resource_path_to_sign, query_string, body_str)

    url = f"{base}{request_path}?{query_string}"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-pay-token": token,
    }

    if debug:
        print("  request_path:        ", request_path)
        print("  resource_path_to_sign:", resource_path_to_sign)
        print("  query_string:        ", query_string)
        print("  body_sha256:         ", hashlib.sha256(body_str.encode("utf-8")).hexdigest())
        print("  x-pay-token (prefix):", token.split(":")[0], token.split(":")[1], "<hash>")

    # IMPORTANT: send EXACT bytes you signed
    return requests.post(url, headers=headers, data=body_str.encode("utf-8"), timeout=30)

def visa_enroll_card(base: str, api_key: str, shared_secret: str, card_id: str) -> requests.Response:
    """
    Enroll a card in VTC: POST /vctc/customerrules/v1/consumertransactioncontrols

    Required fields per API spec:
      - countryCode, defaultAlertsPreferences, firstName, lastName,
        preferredLanguage, userIdentifier
    Plus at least one of: primaryAccountNumber or paymentToken
    """
    path = "/vctc/customerrules/v1/consumertransactioncontrols"
    query_string = f"apikey={api_key}"

    user_id = str(uuid.uuid4())

    payload = {
        "primaryAccountNumber": card_id,
        "countryCode": "USA",
        "firstName": "Alex",
        "lastName": "Miller",
        "preferredLanguage": "en-us",
        "userIdentifier": user_id,
        "defaultAlertsPreferences": [
            {
                "contactType": "Email",
                "contactValue": "alexmiller@example.com",
                "isVerified": True,
                "preferredEmailFormat": "Html",
                "status": "Active",
            }
        ],
    }

    body_str = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)

    # Use the 'skip first segment' rule (strips "vctc/")
    resource_path_to_sign = "customerrules/v1/consumertransactioncontrols"

    ts = now_epoch_seconds()
    token = x_pay_token(shared_secret, ts, resource_path_to_sign, query_string, body_str)

    url = f"{base}{path}?{query_string}"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-pay-token": token,
    }

    print(f"\n--- Testing Enrollment for PAN: {card_id} ---")
    print(f"  userIdentifier: {user_id}")
    print(f"  payload keys: {list(payload.keys())}")
    return requests.post(url, headers=headers, data=body_str.encode("utf-8"), timeout=30)



def call_your_api_gateway(api_base: str, payload: dict[str, Any]) -> requests.Response:
    url = f"{api_base.rstrip('/')}/api/visa/controls"
    return requests.post(url, json=payload, timeout=30)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--visa-base", default="https://sandbox.api.visa.com")
    parser.add_argument("--api-gw-base", default=os.getenv("NEXT_PUBLIC_API_BASE_URL", "").rstrip("/"))
    parser.add_argument(
    "--api-key",
    default="F9ZNQD7PJ5GKEO59K38Q21wGYQNCvqLPxGXE12eyLHIoprCw0",
)

    parser.add_argument(
        "--shared-secret",
        default="gp+FtNKV5n4TZe3Y{0HCeSVaFh2RL9UE/}}H9/d7",
    )
    parser.add_argument("--card-id", default="4514170000000001")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    if not args.api_key or not args.shared_secret:
        raise SystemExit("Missing --api-key/--shared-secret (or VISA_USER_ID/VISA_PASSWORD env vars).")

    print("\n=== 0) Sanity: Visa HelloWorld (X-Pay) ===")
    r = visa_get_helloworld(args.visa_base, args.api_key, args.shared_secret)
    print("Status:", r.status_code)
    print("Body:", r.text)

    enroll_resp = visa_enroll_card(args.visa_base, args.api_key, args.shared_secret, args.card_id)
    print("Enroll Status:", enroll_resp.status_code)
    print("Enroll Body:", enroll_resp.text)
    
    if enroll_resp.status_code == 200:
        doc_id = enroll_resp.json().get("resource", {}).get("documentID")
        print(f"\nSUCCESS! Card enrolled. Document ID: {doc_id}")
        print("You can now use this ID to set spending limits.")
    else:
        print("\nEnrollment failed. If 409, the card might already be enrolled.")

    # VTC payload that matches the actual API schema for enrollment + controls
    vtc_payload = {
        "primaryAccountNumber": args.card_id,
        "countryCode": "USA",
        "firstName": "Alex",
        "lastName": "Miller",
        "preferredLanguage": "en-us",
        "userIdentifier": str(uuid.uuid4()),
        "defaultAlertsPreferences": [
            {
                "contactType": "Email",
                "contactValue": "alexmiller@example.com",
                "isVerified": True,
                "preferredEmailFormat": "Html",
                "status": "Active",
            }
        ],
        "globalControls": [
            {
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "shouldAlertOnDecline": True,
                "alertThreshold": 50.0,
                "declineThreshold": 1000.0,
            }
        ],
        "transactionControls": [
            {
                "controlType": "TCT_E_COMMERCE",
                "isControlEnabled": True,
                "shouldDeclineAll": False,
                "shouldAlertOnDecline": True,
            }
        ],
    }

    print("\n=== 1) Direct VISA VTC: reproduce 9159 vs non-9159 ===")

    modes: list[XPayMode] = [
        # THIS is the “production fix” for token validation:
        XPayMode(
            name="PROD_FIX: skip_first_segment + apikey + compact_json",
            mode="skip_first_segment",
            query_param_name="apikey",
            compact_json=True,
        ),
        # Alternate query casing (still must match URL exactly)
        XPayMode(
            name="skip_first_segment + apiKey + compact_json",
            mode="skip_first_segment",
            query_param_name="apiKey",
            compact_json=True,
        ),
        # These should produce 9159 (bad signature)
        XPayMode(
            name="full_path + apikey + compact_json (expect 9159)",
            mode="full_path",
            query_param_name="apikey",
            compact_json=True,
        ),
        XPayMode(
            name="last_segment + apikey + compact_json (expect 9159)",
            mode="last_segment",
            query_param_name="apikey",
            compact_json=True,
        ),
    ]

    for m in modes:
        print(f"\n--- Mode: {m.name} ---")
        rr = visa_post_vtc(args.visa_base, args.api_key, args.shared_secret, m, vtc_payload, debug=args.debug)
        print("HTTP:", rr.status_code)
        print("Body:", rr.text)

    if args.api_gw_base:
        print("\n=== 2) End-to-end via YOUR API Gateway (visa-lambda) ===")
        rgw = call_your_api_gateway(args.api_gw_base, {
            "rule_id": f"test_{int(datetime.now(UTC).timestamp())}",
            "card_id": args.card_id,
            "control_type": "spending_limit",
            "threshold": 50.0,
            "is_active": True,
            "created_by": "user",
        })
        print("HTTP:", rgw.status_code)
        print("Body:", rgw.text)
    else:
        print("\n(skipping API Gateway test: set --api-gw-base or NEXT_PUBLIC_API_BASE_URL)")


if __name__ == "__main__":
    main()