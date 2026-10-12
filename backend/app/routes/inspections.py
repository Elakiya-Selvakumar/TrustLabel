"""Inspections API routes."""
from datetime import datetime
from flask import Blueprint, jsonify, request
from app import db
from app.models import Inspection, AuditEvent
from app.utils.audit import log_event

inspections_bp = Blueprint("inspections", __name__)


@inspections_bp.route("/", methods=["GET"])
def list_inspections():
    """Return all non-deleted inspections."""
    inspections = (
        Inspection.query
        .filter(Inspection.deleted_at.is_(None))
        .order_by(Inspection.created_at.desc())
        .all()
    )
    return jsonify([i.to_dict() for i in inspections])


@inspections_bp.route("/stats", methods=["GET"])
def get_stats():
    """Return inspection count statistics."""
    base = Inspection.query.filter(Inspection.deleted_at.is_(None))
    total = base.count()
    passed = base.filter(Inspection.status == "pass").count()
    failed = base.filter(Inspection.status == "fail").count()
    review = base.filter(Inspection.status == "review").count()
    pending = base.filter(Inspection.status == "pending").count()
    return jsonify({
        "total": total,
        "passed": passed,
        "failed": failed,
        "review": review,
        "pending": pending,
    })


@inspections_bp.route("/<inspection_id>", methods=["GET"])
def get_inspection(inspection_id: str):
    """Return full inspection detail including all relations."""
    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404
    return jsonify(inspection.to_dict(include_relations=True))


@inspections_bp.route("/", methods=["POST"])
def create_inspection():
    """Create a new inspection record."""
    data = request.get_json(silent=True) or {}
    inspection = Inspection(
        product_name=data.get("product_name"),
        status="pending",
        rule_version=data.get("rule_version", "v1.0"),
    )
    db.session.add(inspection)
    db.session.commit()
    log_event(
        inspection.id,
        "inspection_created",
        after_value=inspection.product_name or "unnamed",
    )
    return jsonify(inspection.to_dict()), 201


@inspections_bp.route("/<inspection_id>", methods=["PATCH"])
def update_inspection(inspection_id: str):
    """Update inspection metadata."""
    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404

    data = request.get_json(silent=True) or {}

    if "product_name" in data:
        old_name = inspection.product_name
        inspection.product_name = data["product_name"]
        log_event(inspection.id, "field_corrected", before_value=old_name, after_value=data["product_name"])

    if "status" in data:
        old_status = inspection.status
        inspection.status = data["status"]
        log_event(inspection.id, "status_changed", before_value=old_status, after_value=data["status"])

    inspection.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(inspection.to_dict())


@inspections_bp.route("/<inspection_id>", methods=["DELETE"])
def delete_inspection(inspection_id: str):
    """Soft-delete an inspection."""
    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404
    inspection.deleted_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Inspection deleted"}), 200


@inspections_bp.route("/<inspection_id>/notes", methods=["POST"])
def add_note(inspection_id: str):
    """Add a reviewer note to an inspection."""
    from app.models import ReviewerNote
    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404

    data = request.get_json(silent=True) or {}
    note_text = data.get("note_text", "").strip()
    if not note_text:
        return jsonify({"error": "note_text is required"}), 400

    note = ReviewerNote(
        inspection_id=inspection_id,
        note_text=note_text,
        status_decision=data.get("status_decision"),
        actor=data.get("actor", "anonymous"),
    )
    db.session.add(note)

    if data.get("status_decision"):
        old_status = inspection.status
        inspection.status = "review"
        log_event(inspection.id, "status_changed", before_value=old_status, after_value="review")

    log_event(inspection.id, "note_added", after_value=note_text[:100])
    db.session.commit()
    return jsonify(note.to_dict()), 201
