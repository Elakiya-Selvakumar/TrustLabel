"""SQLAlchemy models for TrustLabel."""
import uuid
from datetime import datetime
from app import db


def generate_uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


class Inspection(db.Model):
    """Primary inspection record."""

    __tablename__ = "inspections"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    product_name = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), nullable=False, default="pending")
    # pending | pass | fail | review | deleted
    rule_version = db.Column(db.String(20), nullable=False, default="v1.0")
    image_path = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    ocr_results = db.relationship("OcrResult", backref="inspection", lazy=True, cascade="all, delete-orphan")
    corrected_fields = db.relationship("CorrectedField", backref="inspection", lazy=True, cascade="all, delete-orphan")
    validation_results = db.relationship("ValidationResult", backref="inspection", lazy=True, cascade="all, delete-orphan")
    audit_events = db.relationship("AuditEvent", backref="inspection", lazy=True, cascade="all, delete-orphan")
    report_versions = db.relationship("ReportVersion", backref="inspection", lazy=True, cascade="all, delete-orphan")
    reviewer_notes = db.relationship("ReviewerNote", backref="inspection", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_relations: bool = False) -> dict:
        """Serialize to dict."""
        data = {
            "id": self.id,
            "product_name": self.product_name,
            "status": self.status,
            "rule_version": self.rule_version,
            "image_path": self.image_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_relations:
            data["ocr_results"] = [r.to_dict() for r in self.ocr_results]
            data["corrected_fields"] = [c.to_dict() for c in self.corrected_fields]
            data["validation_results"] = [v.to_dict() for v in self.validation_results]
            data["audit_events"] = [a.to_dict() for a in self.audit_events]
            data["report_versions"] = [r.to_dict() for r in self.report_versions]
            data["reviewer_notes"] = [n.to_dict() for n in self.reviewer_notes]
        return data


class OcrResult(db.Model):
    """Immutable original OCR extraction result."""

    __tablename__ = "ocr_results"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    inspection_id = db.Column(db.String(36), db.ForeignKey("inspections.id"), nullable=False)
    field_name = db.Column(db.String(100), nullable=False)
    raw_value = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    corrected_fields = db.relationship("CorrectedField", backref="ocr_result", lazy=True)

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "field_name": self.field_name,
            "raw_value": self.raw_value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CorrectedField(db.Model):
    """User correction of an OCR-extracted field."""

    __tablename__ = "corrected_fields"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    ocr_result_id = db.Column(db.String(36), db.ForeignKey("ocr_results.id"), nullable=True)
    inspection_id = db.Column(db.String(36), db.ForeignKey("inspections.id"), nullable=False)
    field_name = db.Column(db.String(100), nullable=False)
    corrected_value = db.Column(db.Text, nullable=True)
    corrected_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    actor = db.Column(db.String(100), nullable=False, default="anonymous")

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "id": self.id,
            "ocr_result_id": self.ocr_result_id,
            "inspection_id": self.inspection_id,
            "field_name": self.field_name,
            "corrected_value": self.corrected_value,
            "corrected_at": self.corrected_at.isoformat() if self.corrected_at else None,
            "actor": self.actor,
        }


class ValidationResult(db.Model):
    """Compliance rule validation result for an inspection."""

    __tablename__ = "validation_results"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    inspection_id = db.Column(db.String(36), db.ForeignKey("inspections.id"), nullable=False)
    rule_key = db.Column(db.String(100), nullable=False)
    rule_version = db.Column(db.String(20), nullable=False, default="v1.0")
    status = db.Column(db.String(50), nullable=False)
    # pass | fail | warn | unavailable | exempt
    finding = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "rule_key": self.rule_key,
            "rule_version": self.rule_version,
            "status": self.status,
            "finding": self.finding,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AuditEvent(db.Model):
    """Immutable audit trail event."""

    __tablename__ = "audit_events"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    inspection_id = db.Column(db.String(36), db.ForeignKey("inspections.id"), nullable=False)
    event_type = db.Column(db.String(100), nullable=False)
    # field_corrected | note_added | status_changed | report_generated | inspection_created | validated
    actor = db.Column(db.String(100), nullable=False, default="anonymous")
    before_value = db.Column(db.Text, nullable=True)
    after_value = db.Column(db.Text, nullable=True)
    recorded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "event_type": self.event_type,
            "actor": self.actor,
            "before_value": self.before_value,
            "after_value": self.after_value,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
        }


class ReportVersion(db.Model):
    """PDF report version for an inspection."""

    __tablename__ = "report_versions"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    inspection_id = db.Column(db.String(36), db.ForeignKey("inspections.id"), nullable=False)
    version_number = db.Column(db.Integer, nullable=False, default=1)
    generated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    file_path = db.Column(db.String(500), nullable=False)
    is_current = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "version_number": self.version_number,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "file_path": self.file_path,
            "is_current": self.is_current,
        }


class ReviewerNote(db.Model):
    """Human reviewer note attached to an inspection."""

    __tablename__ = "reviewer_notes"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    inspection_id = db.Column(db.String(36), db.ForeignKey("inspections.id"), nullable=False)
    note_text = db.Column(db.Text, nullable=False)
    status_decision = db.Column(db.String(50), nullable=True)
    # approved | rejected | needs_review | None
    recorded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    actor = db.Column(db.String(100), nullable=False, default="anonymous")

    def to_dict(self) -> dict:
        """Serialize to dict."""
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "note_text": self.note_text,
            "status_decision": self.status_decision,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "actor": self.actor,
        }
