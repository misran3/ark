"""
Visa VTC debug script — tests multiple signing modes to verify which
combination of (path-signing-rule, query-param-casing, json-format)
produces a valid X-Pay token.

Confirmed results:
  - skip_first_segment + apikey (lowercase) + compact JSON  → 200
  - skip_first_segment + apiKey (camelCase) + compact JSON  → 200
  - full_path + apikey + compact JSON                       → 401 (9159)
  - last_segment + apikey + compact JSON                    → 401 (9159)

Usage:
    cd core/scripts/visa
    python -m test.visa_vtc_debug [--debug] [--card-id PAN]
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import requests

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _constants import API_KEY, SHARED_SECRET, VISA_BASE, DEMO_PAN


@dataclass(frozen=True)
class XPayMode:
    name: str
    mode: str  # "skip_first_segment" | "full_path" | "last_segment"
    query_param_name: str
    compact_json: bool


def now_epoch_seconds() -> str:
    return str(int(datetime.now(UTC).timestamp()))


def canonical_json(payload: dict[str, Any], compact: bool) -> str:
    if compact:
        return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    return json.dumps(payload, indent=2, ensure_ascii=False)


def compute_resource_path_to_sign(request_path: str, mode: str) -> str:
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
    headers = {"Accept": "application/json", "Content-Type": "application/json", "x-pay-token": token}

    if debug:
        print("  request_path:        ", request_path)
        print("  resource_path_to_sign:", resource_path_to_sign)
        print("  query_string:        ", query_string)
        print("  body_sha256:         ", hashlib.sha256(body_str.encode("utf-8")).hexdigest())
        print("  x-pay-token (prefix):", token.split(":")[0], token.split(":")[1], "<hash>")

    return requests.post(url, headers=headers, data=body_str.encode("utf-8"), timeout=30)


def visa_enroll_card(base: str, api_key: str, shared_secret: str, card_id: str) -> requests.Response:
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
            {"contactType": "Email", "contactValue": "alexmiller@example.com", "isVerified": True, "preferredEmailFormat": "Html", "status": "Active"}
        ],
    }
    body_str = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    resource_path_to_sign = "customerrules/v1/consumertransactioncontrols"
    ts = now_epoch_seconds()
    token = x_pay_token(shared_secret, ts, resource_path_to_sign, query_string, body_str)
    url = f"{base}{path}?{query_string}"
    headers = {"Accept": "application/json", "Content-Type": "application/json", "x-pay-token": token}
    print(f"\n--- Testing Enrollment for PAN: {card_id} ---")
    print(f"  userIdentifier: {user_id}")
    print(f"  payload keys: {list(payload.keys())}")
    return requests.post(url, headers=headers, data=body_str.encode("utf-8"), timeout=30)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--visa-base", default=VISA_BASE)
    parser.add_argument("--api-key", default=API_KEY)
    parser.add_argument("--shared-secret", default=SHARED_SECRET)
    parser.add_argument("--card-id", default=DEMO_PAN)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

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
    elif enroll_resp.status_code == 409:
        print("\nCard already enrolled (409). That's fine.")
    else:
        print("\nEnrollment failed.")

    vtc_payload = {
        "primaryAccountNumber": args.card_id,
        "countryCode": "USA",
        "firstName": "Alex",
        "lastName": "Miller",
        "preferredLanguage": "en-us",
        "userIdentifier": str(uuid.uuid4()),
        "defaultAlertsPreferences": [
            {"contactType": "Email", "contactValue": "alexmiller@example.com", "isVerified": True, "preferredEmailFormat": "Html", "status": "Active"}
        ],
        "globalControls": [
            {"isControlEnabled": True, "shouldDeclineAll": False, "shouldAlertOnDecline": True, "alertThreshold": 50.0, "declineThreshold": 1000.0}
        ],
        "transactionControls": [
            {"controlType": "TCT_E_COMMERCE", "isControlEnabled": True, "shouldDeclineAll": False, "shouldAlertOnDecline": True}
        ],
    }

    print("\n=== 1) Direct VISA VTC: reproduce 9159 vs non-9159 ===")
    modes: list[XPayMode] = [
        XPayMode(name="PROD_FIX: skip_first_segment + apikey + compact_json", mode="skip_first_segment", query_param_name="apikey", compact_json=True),
        XPayMode(name="skip_first_segment + apiKey + compact_json", mode="skip_first_segment", query_param_name="apiKey", compact_json=True),
        XPayMode(name="full_path + apikey + compact_json (expect 9159)", mode="full_path", query_param_name="apikey", compact_json=True),
        XPayMode(name="last_segment + apikey + compact_json (expect 9159)", mode="last_segment", query_param_name="apikey", compact_json=True),
    ]
    for m in modes:
        print(f"\n--- Mode: {m.name} ---")
        rr = visa_post_vtc(args.visa_base, args.api_key, args.shared_secret, m, vtc_payload, debug=args.debug)
        print("HTTP:", rr.status_code)
        print("Body:", rr.text)


if __name__ == "__main__":
    main()
