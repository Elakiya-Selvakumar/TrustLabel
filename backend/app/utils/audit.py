"""Audit event utility for TrustLabel."""
from datetime import datetime
from app import db
from app.models import AuditEvent


def log_event(
    inspection_id: str,
    event_type: str,
    before_value: str = None,
    after_value: str = None,
    actor: str = "anonymous",
) -> AuditEvent:
    """Record an immutable audit event.

    Args:
        inspection_id: UUID of the related inspection.
        event_type: Type of event (field_corrected, note_added, etc.).
        before_value: Previous value before change.
        after_value: New value after change.
        actor: Identity of the actor (default 'anonymous').

    Returns:
        The created AuditEvent instance.
    """
    event = AuditEvent(
        inspection_id=inspection_id,
        event_type=event_type,
        actor=actor,
        before_value=str(before_value) if before_value is not None else None,
        after_value=str(after_value) if after_value is not None else None,
        recorded_at=datetime.utcnow(),
    )
    db.session.add(event)
    db.session.commit()
    return event
