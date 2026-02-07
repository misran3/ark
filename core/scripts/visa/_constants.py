"""
Shared constants for Visa VTC sandbox pipelines.

All demo values, credentials, and mapping tables live here so every
pipeline can import them without duplicating magic strings.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Visa Sandbox
# ---------------------------------------------------------------------------
VISA_BASE = "https://sandbox.api.visa.com"

# ---------------------------------------------------------------------------
# Credentials  (X-Pay-Token HMAC auth — NOT mTLS)
# ---------------------------------------------------------------------------
API_KEY = "F9ZNQD7PJ5GKEO59K38Q21wGYQNCvqLPxGXE12eyLHIoprCw0"
SHARED_SECRET = r"gp+FtNKV5n4TZe3Y{0HCeSVaFh2RL9UE/}}H9/d7"

# ---------------------------------------------------------------------------
# Fixed demo card — one card, one document, one user
# ---------------------------------------------------------------------------
DEMO_PAN = "4514170000000001"
DEMO_DOC_ID = "ctc-vd-93a99072-4c3f-4d5d-b7ba-3d2fc0843afe"
DEMO_USER_ID = "b2d1b9cc-fc3f-4a37-b431-ebf04f20a3e9"

# Cardholder info used during enrollment
DEMO_FIRST_NAME = "Alex"
DEMO_LAST_NAME = "Miller"
DEMO_COUNTRY_CODE = "USA"
DEMO_LANGUAGE = "en-us"
DEMO_EMAIL = "alexmiller@example.com"

# ---------------------------------------------------------------------------
# Nessie / Capital One spending category → VTC Merchant Control Type
# ---------------------------------------------------------------------------
CATEGORY_TO_MCT: dict[str, str] = {
    "dining": "MCT_DINING",
    "groceries": "MCT_GROCERY",
    "grocery": "MCT_GROCERY",
    "gas": "MCT_GAS_AND_PETROLEUM",
    "gas_and_petroleum": "MCT_GAS_AND_PETROLEUM",
    "entertainment": "MCT_SPORT_AND_RECREATION",
    "sport_and_recreation": "MCT_SPORT_AND_RECREATION",
    "shopping": "MCT_APPAREL_AND_ACCESSORIES",
    "apparel": "MCT_APPAREL_AND_ACCESSORIES",
    "electronics": "MCT_ELECTRONICS",
    "hotels": "MCT_HOTEL_AND_LODGING",
    "hotel_and_lodging": "MCT_HOTEL_AND_LODGING",
    "airfare": "MCT_AIRFARE",
    "alcohol": "MCT_ALCOHOL",
    "automotive": "MCT_AUTOMOTIVE",
    "car_rental": "MCT_CAR_RENTAL",
    "personal_care": "MCT_PERSONAL_CARE",
    "gambling": "MCT_GAMBLING",
    "tobacco": "MCT_SMOKE_AND_TOBACCO",
    "household": "MCT_HOUSEHOLD",
    "adult_entertainment": "MCT_ADULT_ENTERTAINMENT",
}

# All valid MCT enum values
ALL_MCT_TYPES: list[str] = [
    "MCT_ADULT_ENTERTAINMENT",
    "MCT_AIRFARE",
    "MCT_ALCOHOL",
    "MCT_APPAREL_AND_ACCESSORIES",
    "MCT_AUTOMOTIVE",
    "MCT_CAR_RENTAL",
    "MCT_DINING",
    "MCT_ELECTRONICS",
    "MCT_GAMBLING",
    "MCT_GAS_AND_PETROLEUM",
    "MCT_GROCERY",
    "MCT_HOTEL_AND_LODGING",
    "MCT_HOUSEHOLD",
    "MCT_PERSONAL_CARE",
    "MCT_SMOKE_AND_TOBACCO",
    "MCT_SPORT_AND_RECREATION",
]

# All valid TCT enum values
ALL_TCT_TYPES: list[str] = [
    "TCT_ATM_WITHDRAW",
    "TCT_AUTO_PAY",
    "TCT_BRICK_AND_MORTAR",
    "TCT_CONTACTLESS",
    "TCT_CROSS_BORDER",
    "TCT_E_COMMERCE",
    "TCT_OCT",
    "TCT_PURCHASE_RETURN",
]

# Spend-limit period types
SPEND_LIMIT_TYPES: list[str] = [
    "LMT_MONTH",
    "LMT_WEEK",
    "LMT_DAY",
    "LMT_DATE_RANGE",
    "LMT_RECURRING",
]
