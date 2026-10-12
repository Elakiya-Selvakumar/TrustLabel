"""Reports (PDF) API routes."""
import os
from flask import Blueprint, jsonify, request, send_file, current_app
from app import db
from app.models import Inspection, ReportVersion
from app.services.pdf_service import generate_pdf
from app.utils.audit import log_event

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/generate/<inspection_id>", methods=["POST"])
def generate_report(inspection_id: str):
    """Generate a new PDF report from the saved inspection record."""
    inspection = Inspection.query.filter_by(id=inspection_id).first()
    if not inspection:
        return jsonify({"error": "Inspection not found"}), 404

    # Mark all previous versions as non-current
    ReportVersion.query.filter_by(inspection_id=inspection_id).update({"is_current": False})

    # Determine next version number
    last = (
        ReportVersion.query
        .filter_by(inspection_id=inspection_id)
        .order_by(ReportVersion.version_number.desc())
        .first()
    )
    version_number = (last.version_number + 1) if last else 1

    # Build output path
    reports_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "reports")
    os.makedirs(reports_dir, exist_ok=True)
    filename = f"report_{inspection_id}_v{version_number}.pdf"
    output_path = os.path.join(reports_dir, filename)

    # Generate PDF from saved inspection data
    inspection_data = inspection.to_dict(include_relations=True)
    success = generate_pdf(inspection_data, output_path)

    if not success:
        # Inspection data is preserved; only PDF generation failed
        return jsonify({
            "error": "pdf_generation_failed",
            "message": "PDF generation failed. The inspection record is intact. Please retry.",
            "inspection_id": inspection_id,
        }), 500

    # Save report version record
    report = ReportVersion(
        inspection_id=inspection_id,
        version_number=version_number,
        file_path=output_path,
        is_current=True,
    )
    db.session.add(report)
    log_event(inspection_id, "report_generated", after_value=f"v{version_number}")
    db.session.commit()

    return jsonify({
        "report_id": report.id,
        "inspection_id": inspection_id,
        "version_number": version_number,
        "generated_at": report.generated_at.isoformat(),
        "is_current": True,
    }), 201


@reports_bp.route("/list/<inspection_id>", methods=["GET"])
def list_reports(inspection_id: str):
    """List all report versions for an inspection."""
    reports = (
        ReportVersion.query
        .filter_by(inspection_id=inspection_id)
        .order_by(ReportVersion.version_number.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in reports])


@reports_bp.route("/download/<report_id>", methods=["GET"])
def download_report(report_id: str):
    """Download a specific report version as PDF."""
    report = ReportVersion.query.filter_by(id=report_id).first()
    if not report:
        return jsonify({"error": "Report not found"}), 404

    if not os.path.exists(report.file_path):
        return jsonify({
            "error": "pdf_file_missing",
            "message": "PDF file not found on disk. Please regenerate the report.",
        }), 404

    return send_file(
        report.file_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"trustlabel_report_v{report.version_number}.pdf",
    )
