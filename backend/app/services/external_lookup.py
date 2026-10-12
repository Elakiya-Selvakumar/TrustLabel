"""External product lookup service with timeout and graceful fallback."""
import logging
import os
from typing import Dict

import requests

logger = logging.getLogger(__name__)


def lookup_product(qr_data: str) -> Dict:
    """Look up a product in the configured external database.

    Args:
        qr_data: Decoded QR code string.

    Returns:
        Dict with status: found | not_found | unavailable | not_configured | error
    """
    lookup_url = os.environ.get("EXTERNAL_LOOKUP_URL", "").strip()
    timeout = int(os.environ.get("EXTERNAL_LOOKUP_TIMEOUT", "5"))

    if not lookup_url:
        return {
            "status": "not_configured",
            "message": "External product database is not configured. "
                       "Set EXTERNAL_LOOKUP_URL in your .env file.",
        }

    try:
        response = requests.get(
            lookup_url,
            params={"q": qr_data},
            timeout=timeout,
            headers={"Accept": "application/json"},
        )

        if response.status_code == 200:
            return {"status": "found", "data": response.json()}

        if response.status_code == 404:
            return {
                "status": "not_found",
                "message": "No matching product record found in external database. "
                           "This does not confirm or deny product validity.",
            }

        return {
            "status": "unavailable",
            "message": f"External service returned HTTP {response.status_code}. "
                       "Retry later.",
        }

    except requests.Timeout:
        logger.warning("External lookup timed out after %ds for query.", timeout)
        return {
            "status": "unavailable",
            "message": f"External service did not respond within {timeout}s. "
                       "Local checks are complete. Retry when the service is available.",
        }

    except requests.ConnectionError:
        logger.warning("External lookup connection error.")
        return {
            "status": "unavailable",
            "message": "Cannot connect to external product database. "
                       "Check your network connection or retry later.",
        }

    except Exception as exc:
        # Log error safely — never expose credentials or full URL
        logger.error("External lookup unexpected error: %s", type(exc).__name__)
        return {
            "status": "error",
            "message": "An unexpected error occurred during external lookup. "
                       "Local checks remain valid.",
        }
