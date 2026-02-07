"""
VTC (Visa Transaction Controls) integration module.

Provides client, mapping, and enforcement functions to apply spending rules
based on Captain Nova's specialist analysis outputs.
"""

from .client import VTCClient, VTCResponse
from .enforcement import assemble_vtc_rules, enforce_on_cold_boot

__all__ = ["VTCClient", "VTCResponse", "assemble_vtc_rules", "enforce_on_cold_boot"]
