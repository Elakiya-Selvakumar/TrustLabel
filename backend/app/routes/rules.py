"""Compliance rules API routes and validation engine."""
import re
from flask import Blueprint, jsonify, request
from app import db
from app.models import Inspection, OcrResult, CorrectedField, ValidationResult
from app.utils.audit import log_event

rules_bp = Blueprint("rules", __name__)

RULE_VERSION = "v1.0"

RULES = [
    {
        "key": "product_name",
        "label": "Product Name",
        "description": "The product must have a clearly declared name on the label.",
        "reference": "FSSAI FSS (Labelling & Display) Regulations 2020 — Reg. 4(1)",
    },
    {
        "key": "net_quantity",
        "label": "Net Quantity",
        "description": "Net quantity must be declared with appropriate unit (g, kg, ml, L).",
        "reference": "FSSAI FSS (Labelling & Display) Regulations 2020 — Reg. 4(3)",
    },
    {
        "key": "mrp",
        "label": "MRP Declaration",
        "description": "Maximum Retail Price must be declared with ₹ symbol.",
        "reference": "Legal Metrology (Packaged Commodities) Rules 2011 — Rule 6(1)(f)",
    },
    {
        "key": "manufacturer",
        "label": "Manufacturer Details",
        "description": "Name and address of manufacturer or importer must be declared.",
        "reference": "FSSAI FSS (Labelling & Display) Regulations 2020 — Reg. 4(5)",
    },
    {
        "key": "ingredients",
        "label": "Ingredients List",
        "description": "Complete list of ingredients must be declared in descending order of weight.",
        "reference": "FSSAI FSS (Labelling & Display) Regulations 2020 — Reg. 4(7)",
    },
    {
        "key": "nutritional_info",
        "label": "Nutritional Information",
        "description": "Nutritional information table must include Energy, Protein, Carbohydrate, Total Fat, and Sodium.",
        "reference": "FSSAI FSS (Labelling & Display) Regulations 2020 — Reg. 4(8)",
    },
    {
        "key": "fssai_license",
        "label": "FSSAI License Number",
        "description": "FSSAI License or Registration number (14 digits) must be displayed.",
        "reference": "FSSAI Act 2006 — Section 31",
    },
    {
        "key": "best_before",
        "label": "Best Before / Expiry Date",
        "description": "Best Before or Use By date must be clearly declared.",
        "reference": "FSSAI FSS (Labelling & Display) Regulations 2020 — Reg. 4(4)",
    },
    {
        "key": "country_of_origin",
        "label": "Country of Origin",
        "description": "Country of origin must be declared for imported products.",
        "reference": "Legal Metrology (Packaged Commodities) Rules 2011 — Rule 6(1)(m)",
    },
]

NUTRIENT_KEYWORDS = ["energy", "protein", "carbohydrate", "fat", "sodium", "calories", "kcal"]


def _get_field_value(inspection_id: str, field_name: str) -> str:
    """Return the effective field value: corrected value if available, else raw OCR."""
    correction = (
        CorrectedField.query
        .filter_by(inspection_id=inspection_id, field_name=field_name)
        .order_by(CorrectedField.corrected_at.desc())
        .first()
    )
    if correction and correction.corrected_value:
        return correction.corrected_value.strip()

    ocr = OcrResult.query.filter_by(inspection_id=inspection_id, field_name=field_name).first()
    return ocr.raw_value.strip() if ocr and ocr.raw_value else ""


def _validate_field(key: str, value: str) -> dict:
    """Run a single rule check and return {status, finding}."""
    if not value:
        return {"status": "fail", "finding": f"{key.replace('_', ' ').title()} is missing or not detected."}

    if key == "net_quantity":
        pattern = re.compile(r"\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l|litre|liter|units?)", re.IGNORECASE)
        if not pattern.search(value):
            return {"status": "fail", "finding": f"Net quantity '{value}' does not contain a recognisable value with unit."}
        return {"status": "pass", "finding": f"Net quantity declared: {value}"}

    if key == "mrp":
        if not re.search(r"[₹Rs]\s*\d+", value, re.IGNORECASE):
            return {"status": "fail", "finding": f"MRP '{value}' does not include ₹ symbol and amount."}
        return {"status": "pass", "finding": f"MRP declared: {value}"}

    if key == "fssai_license":
        if not re.fullmatch(r"\d{14}", value.replace(" ", "")):
            return {"status": "fail", "finding": f"FSSAI License '{value}' is not a valid 14-digit number."}
        return {"status": "pass", "finding": f"FSSAI License Number: {value}"}

    if key == "best_before":
        date_pattern = re.compile(
            r"\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{4}",
            re.IGNORECASE,
        )
        if not date_pattern.search(value):
            return {"status": "warn", "finding": f"Best Before date '{value}' could not be parsed as a recognisable date format."}
        return {"status": "pass", "finding": f"Best Before declared: {value}"}

    if key == "manufacturer":
        if len(value) < 10:
            return {"status": "fail", "finding": "Manufacturer details are too short — name and address required."}
        return {"status": "pass", "finding": "Manufacturer details declared."}

    if key == "nutritional_info":
        found = [kw for kw in NUTRIENT_KEYWORDS if kw in value.lower()]
        if not found:
            return {"status": "fail", "finding": "Nutritional information table not found or does not contain expected nutrients."}
        if len(found) < 3:
            return {"status": "warn", "finding": f"Nutritional info present but incomplete. Found: {', '.join(found)}"}
        return {"status": "pass", "finding": f"Nutritional information present. Nutrients found: {', '.join(found)}"}

    if key == "country_of_origin":
        return {"status": "pass", "finding": f"Country of origin declared: {value}"}

    # Default: field is non-empty
    return {"status": "pass", "finding": f"{key.replace('_', ' ').title()} is present."}


@rules_bp.route("/", methods=["GET"])
def get_rules():
    """Return all FSSAI compliance rules."""
    return jsonify({"version": RULE_VERSION, "rules": RULES})


@rules_bp.route("/validate/<inspection_id>", methods=["POST"])
def validate_inspection(inspection_id: str):
    """Run all 9 FSSAI compliance checks against a saved inspection.

    Deletes previous validation results for this inspection and creates new ones.
    """
    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404

    # Remove previous validation results
    ValidationResult.query.filter_by(inspection_id=inspection_id).delete()

    results = []
    pass_count = 0
    fail_count = 0
    warn_count = 0

    for rule in RULES:
        field_value = _get_field_value(inspection_id, rule["key"])
        check = _validate_field(rule["key"], field_value)

        vr = ValidationResult(
            inspection_id=inspection_id,
            rule_key=rule["key"],
            rule_version=RULE_VERSION,
            status=check["status"],
            finding=check["finding"],
        )
        db.session.add(vr)

        results.append({
            "rule_key": rule["key"],
            "label": rule["label"],
            "status": check["status"],
            "finding": check["finding"],
            "reference": rule["reference"],
        })

        if check["status"] == "pass":
            pass_count += 1
        elif check["status"] == "fail":
            fail_count += 1
        elif check["status"] == "warn":
            warn_count += 1

    # Determine overall inspection status
    if fail_count == 0 and warn_count == 0:
        new_status = "pass"
    elif fail_count > 0:
        new_status = "fail"
    else:
        new_status = "review"

    old_status = inspection.status
    inspection.status = new_status
    log_event(inspection_id, "validated", before_value=old_status, after_value=new_status)

    db.session.commit()

    return jsonify({
        "inspection_id": inspection_id,
        "rule_version": RULE_VERSION,
        "overall_status": new_status,
        "summary": {"pass": pass_count, "fail": fail_count, "warn": warn_count},
        "results": results,
    })
