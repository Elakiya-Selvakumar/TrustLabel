"""OCR service for TrustLabel — Tesseract-based field extraction."""
import os
import re
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Field extraction regex patterns
PATTERNS = {
    "mrp": re.compile(
        r"(?:MRP|M\.R\.P\.?|Maximum Retail Price)[^\d₹Rs]*[₹Rs]?\s*(\d+(?:\.\d{1,2})?)",
        re.IGNORECASE,
    ),
    "fssai_license": re.compile(r"\b(\d{14})\b"),
    "net_quantity": re.compile(
        r"(?:Net\s*(?:Quantity|Wt\.?|Weight|Content)[^\d]*)?(\d+(?:\.\d+)?)\s*"
        r"(kg|g|gm|grams?|ml|l|litre|liter|units?)\b",
        re.IGNORECASE,
    ),
    "best_before": re.compile(
        r"(?:Best\s*Before|Expiry|Use\s*By|BB)[:\s]*"
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{4})",
        re.IGNORECASE,
    ),
    "country_of_origin": re.compile(
        r"(?:Country\s*of\s*Origin|Manufactured\s*in|Made\s*in)[:\s]*([A-Za-z\s]+?)(?:\n|$)",
        re.IGNORECASE,
    ),
}

NUTRIENT_KEYWORDS = [
    "energy", "protein", "carbohydrate", "fat", "fibre", "sodium",
    "calcium", "iron", "vitamin", "calories", "kcal", "kj",
]


def _get_tesseract_cmd() -> str:
    """Return Tesseract executable path from environment or default."""
    return os.environ.get("TESSERACT_CMD", "tesseract")


def preprocess_image(image_path: str):
    """Apply preprocessing to improve OCR accuracy.

    Args:
        image_path: Absolute path to the image file.

    Returns:
        Preprocessed PIL Image, or original if OpenCV unavailable.
    """
    try:
        import cv2
        import numpy as np
        from PIL import Image

        img = cv2.imread(image_path)
        if img is None:
            return Image.open(image_path)

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        # Adaptive threshold for better text extraction
        thresh = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        # Convert numpy array back to PIL Image
        return Image.fromarray(thresh)
    except Exception as exc:
        logger.warning("Image preprocessing failed, using original: %s", exc)
        try:
            from PIL import Image
            return Image.open(image_path)
        except Exception:
            return None


def extract_fields(text: str) -> Dict[str, Optional[str]]:
    """Extract structured fields from raw OCR text using regex patterns.

    Args:
        text: Raw OCR text output.

    Returns:
        Dict mapping field names to extracted values.
    """
    fields: Dict[str, Optional[str]] = {
        "product_name": None,
        "net_quantity": None,
        "mrp": None,
        "manufacturer": None,
        "ingredients": None,
        "nutritional_info": None,
        "fssai_license": None,
        "best_before": None,
        "country_of_origin": None,
    }

    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # Product name: usually first prominent non-trivial line
    for line in lines[:5]:
        if len(line) > 3 and not re.match(r"^\d", line):
            fields["product_name"] = line
            break

    # MRP
    mrp_match = PATTERNS["mrp"].search(text)
    if mrp_match:
        fields["mrp"] = f"₹{mrp_match.group(1)}"

    # Net Quantity
    qty_match = PATTERNS["net_quantity"].search(text)
    if qty_match:
        fields["net_quantity"] = f"{qty_match.group(1)} {qty_match.group(2)}"

    # FSSAI License
    fssai_match = PATTERNS["fssai_license"].search(text)
    if fssai_match:
        fields["fssai_license"] = fssai_match.group(1)

    # Best Before
    bb_match = PATTERNS["best_before"].search(text)
    if bb_match:
        fields["best_before"] = bb_match.group(1).strip()

    # Country of Origin
    country_match = PATTERNS["country_of_origin"].search(text)
    if country_match:
        fields["country_of_origin"] = country_match.group(1).strip()

    # Manufacturer — look for lines containing address keywords
    mfr_keywords = ["manufactured by", "mfg by", "marketed by", "imported by", "ltd", "pvt", "limited"]
    for i, line in enumerate(lines):
        if any(k in line.lower() for k in mfr_keywords):
            # Include next line for address
            manufacturer_lines = [line]
            if i + 1 < len(lines):
                manufacturer_lines.append(lines[i + 1])
            fields["manufacturer"] = " ".join(manufacturer_lines)
            break

    # Ingredients
    ingr_start = text.lower().find("ingredient")
    if ingr_start != -1:
        ingr_text = text[ingr_start:ingr_start + 500]
        ingr_end = ingr_text.lower().find("nutritional")
        if ingr_end == -1:
            ingr_end = 300
        fields["ingredients"] = ingr_text[:ingr_end].strip()

    # Nutritional info
    nutri_start = text.lower().find("nutrition")
    if nutri_start == -1:
        nutri_start = text.lower().find("energy")
    if nutri_start != -1:
        nutri_text = text[nutri_start:nutri_start + 600]
        if any(kw in nutri_text.lower() for kw in NUTRIENT_KEYWORDS):
            fields["nutritional_info"] = nutri_text.strip()

    return fields


def run_ocr(image_path: str) -> Dict:
    """Run Tesseract OCR on an image and extract label fields.

    Args:
        image_path: Absolute path to the uploaded image.

    Returns:
        Dict with keys: raw_text, fields, error (optional).
    """
    try:
        import pytesseract

        tesseract_cmd = _get_tesseract_cmd()
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        image = preprocess_image(image_path)
        if image is None:
            return {
                "raw_text": "",
                "fields": {},
                "error": "image_load_failed",
                "message": "Could not load or preprocess the image.",
            }

        # Run OCR with optimised config for dense text
        custom_config = r"--oem 3 --psm 6"
        raw_text = pytesseract.image_to_string(image, config=custom_config)

        fields = extract_fields(raw_text)
        return {"raw_text": raw_text, "fields": fields, "error": None}

    except Exception as exc:
        error_msg = str(exc)
        if "tesseract" in error_msg.lower() or "not found" in error_msg.lower():
            logger.error("Tesseract not found: %s", error_msg)
            return {
                "raw_text": "",
                "fields": {},
                "error": "tesseract_not_found",
                "message": (
                    "Tesseract OCR is not installed or not in PATH. "
                    "Install it from https://github.com/UB-Mannheim/tesseract/wiki "
                    "and set TESSERACT_CMD in your .env file."
                ),
            }
        logger.error("OCR extraction failed: %s", error_msg)
        return {
            "raw_text": "",
            "fields": {},
            "error": "ocr_failed",
            "message": f"OCR processing failed: {error_msg}",
        }
