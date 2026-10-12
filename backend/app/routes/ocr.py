"""OCR API routes."""
import os
from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models import Inspection, OcrResult, CorrectedField
from app.services.ocr_service import run_ocr
from app.utils.audit import log_event

ocr_bp = Blueprint("ocr", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp", "tiff"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@ocr_bp.route("/extract", methods=["POST"])
def extract():
    """Accept image upload, run OCR, and save OcrResult rows.

    Expects multipart form with:
    - file: image file
    - inspection_id (optional): existing inspection to attach results to
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file or not _allowed_file(file.filename):
        return jsonify({"error": "Invalid or unsupported file type"}), 400

    # Save uploaded file
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    filename = secure_filename(file.filename)
    image_path = os.path.join(upload_folder, filename)
    file.save(image_path)

    # Run OCR
    result = run_ocr(image_path)

    # If OCR had a hard error, still return partial data
    inspection_id = request.form.get("inspection_id")

    if inspection_id:
        inspection = Inspection.query.filter_by(id=inspection_id).first()
    else:
        # Create a new inspection
        inspection = Inspection(image_path=image_path, status="pending")
        db.session.add(inspection)
        db.session.flush()  # get id before commit
        inspection_id = inspection.id
        log_event(inspection_id, "inspection_created")

    if inspection:
        inspection.image_path = image_path

    # Save OcrResult rows for each field
    fields = result.get("fields", {})
    saved_fields = {}
    for field_name, raw_value in fields.items():
        # Check if an OcrResult already exists for this field
        existing = OcrResult.query.filter_by(
            inspection_id=inspection_id, field_name=field_name
        ).first()
        if not existing:
            ocr_row = OcrResult(
                inspection_id=inspection_id,
                field_name=field_name,
                raw_value=raw_value,
            )
            db.session.add(ocr_row)
        saved_fields[field_name] = raw_value

    # Update product name if not set
    if inspection and not inspection.product_name and fields.get("product_name"):
        inspection.product_name = fields["product_name"]

    db.session.commit()

    return jsonify({
        "inspection_id": inspection_id,
        "fields": saved_fields,
        "raw_text": result.get("raw_text", ""),
        "error": result.get("error"),
        "message": result.get("message"),
    }), 200 if not result.get("error") else 206


@ocr_bp.route("/correct", methods=["POST"])
def correct_field():
    """Save a user correction for an extracted field.

    Expects JSON body:
    - inspection_id: UUID
    - field_name: str
    - corrected_value: str
    - actor (optional): str
    """
    data = request.get_json(silent=True) or {}
    inspection_id = data.get("inspection_id")
    field_name = data.get("field_name")
    corrected_value = data.get("corrected_value", "")
    actor = data.get("actor", "anonymous")

    if not inspection_id or not field_name:
        return jsonify({"error": "inspection_id and field_name are required"}), 400

    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404

    # Get original OCR result
    ocr_result = OcrResult.query.filter_by(
        inspection_id=inspection_id, field_name=field_name
    ).first()

    # Record previous corrected value for audit
    previous = CorrectedField.query.filter_by(
        inspection_id=inspection_id, field_name=field_name
    ).order_by(CorrectedField.corrected_at.desc()).first()

    correction = CorrectedField(
        ocr_result_id=ocr_result.id if ocr_result else None,
        inspection_id=inspection_id,
        field_name=field_name,
        corrected_value=corrected_value,
        actor=actor,
    )
    db.session.add(correction)

    log_event(
        inspection_id,
        "field_corrected",
        before_value=previous.corrected_value if previous else (ocr_result.raw_value if ocr_result else None),
        after_value=corrected_value,
        actor=actor,
    )

    db.session.commit()
    return jsonify(correction.to_dict()), 201
