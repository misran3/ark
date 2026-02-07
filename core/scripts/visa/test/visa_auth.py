"""
Visa X-Pay-Token authentication sanity check.

Calls GET /vdp/helloworld to verify API key + shared secret are valid.
Now uses the shared _client and _constants modules.

Usage:
    cd core/scripts/visa
    python -m test.visa_auth
"""

from __future__ import annotations

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from _client import vtc_request, setup_logging, pretty

log = setup_logging("visa_auth")


def main() -> None:
    log.info("=== Visa HelloWorld — X-Pay Auth Sanity Check ===")

    resp = vtc_request("GET", "/vdp/helloworld", label="HelloWorld")

    if resp.ok:
        log.info(f"SUCCESS — authenticated with Visa Sandbox")
        log.info(f"Response: {pretty(resp.body)}")
    else:
        log.error(f"FAILED — status {resp.status}")
        log.error(f"Body: {pretty(resp.body)}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
