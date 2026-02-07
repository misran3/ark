from __future__ import annotations

from datetime import UTC, datetime
import hashlib
import hmac
import json
import os
import requests
from calendar import timegm

# --- YOUR CREDENTIALS ---
# IMPORTANT: do NOT hardcode secrets in this file.
# Use environment variables instead.
#
# Convention (matches CDK env vars):
# - VISA_USER_ID  -> API key (apiKey)
# - VISA_PASSWORD -> shared secret
API_KEY = os.getenv("VISA_USER_ID", "")
SHARED_SECRET = os.getenv("VISA_PASSWORD", "")

def generate_xpay_token(resource_path, query_string, body):
    # Use timezone-aware UTC timestamp (avoid datetime.utcnow deprecation)
    timestamp = str(int(datetime.now(UTC).timestamp()))
    pre_hash_string = timestamp + resource_path + query_string + body
    hash_string = hmac.new(
        bytes(SHARED_SECRET, 'utf-8'),
        bytes(pre_hash_string, 'utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()
    return 'xv2:' + timestamp + ':' + hash_string

def test_visa_connection():
    if not API_KEY or not SHARED_SECRET:
        raise SystemExit("Missing VISA_USER_ID (apiKey) or VISA_PASSWORD (shared secret) in environment.")

    # 1. Setup the Request
    base_url = 'https://sandbox.api.visa.com/vdp/helloworld'
    query_string = f"apiKey={API_KEY}"
    resource_path = "helloworld"
    body = "" # GET requests have empty body
    
    # 2. Generate the Token
    token = generate_xpay_token(resource_path, query_string, body)
    
    # 3. Make the Call
    headers = {
        'x-pay-token': token,
        'Accept': 'application/json'
    }
    
    print(f"Connecting to: {base_url}?{query_string}")
    print(f"Using X-Pay-Token: {token}")
    
    try:
        response = requests.get(
            f"{base_url}?{query_string}",
            headers=headers,
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response Content: {response.text}")
        
        if response.status_code == 200:
            print("\nSUCCESS: You have successfully authenticated with Visa Sandbox!")
        else:
            print("\nFAILED: Check your Shared Secret and API Key.")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_visa_connection()