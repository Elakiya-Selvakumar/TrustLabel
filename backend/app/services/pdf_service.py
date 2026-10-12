"""PDF report generation service using ReportLab."""
import os
import logging
from datetime import datetime
from typing import Dict, List

logger = logging.getLogger(__name__)

STATUS_COLORS = {
    "pass": (0.13, 0.77, 0.37),       # green
    "fail": (0.94, 0.27, 0.27),       # red
    "warn": (0.96, 0.62, 0.04),       # amber
    "unavailable": (0.49, 0.53, 0.60), # gray
    "exempt": (0.25, 0.56, 0.87),     # blue
}


def _status_label(status: str) -> str:
    labels = {
        "pass": "PASS",
        "fail": "FAIL",
        "warn": "WARNING",
        "unavailable": "UNAVAILABLE",
        "exempt": "EXEMPT",
        "pending": "PENDING",
    }
    return labels.get(status.lower(), status.upper())


def generate_pdf(inspection: Dict, output_path: str) -> bool:
    """Generate a PDF compliance report from a saved inspection record.

    Args:
        inspection: Fully serialized inspection dict (from Inspection.to_dict(include_relations=True)).
        output_path: Absolute path where the PDF will be saved.

    Returns:
        True if generation succeeded, False otherwise.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )

        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        story = []

        # Header
        title_style = ParagraphStyle(
            "Title",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=6,
        )
        sub_style = ParagraphStyle(
            "Sub",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#1e293b"),
        )
        section_style = ParagraphStyle(
            "Section",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#14b8a6"),
            spaceBefore=14,
            spaceAfter=6,
        )

        story.append(Paragraph("TrustLabel — FSSAI Compliance Report", title_style))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#14b8a6")))
        story.append(Spacer(1, 0.3 * cm))

        # Metadata table
        meta_data = [
            ["Inspection ID", inspection.get("id", "—")],
            ["Product Name", inspection.get("product_name") or "—"],
            ["Status", _status_label(inspection.get("status", "pending"))],
            ["Rule Version", inspection.get("rule_version", "v1.0")],
            ["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ]
        meta_table = Table(meta_data, colWidths=[4 * cm, 12 * cm])
        meta_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748b")),
            ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#0f172a")),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(meta_table)

        # Extracted Fields
        story.append(Paragraph("Extracted Label Fields", section_style))
        ocr_results = inspection.get("ocr_results", [])
        corrected_fields = {c["field_name"]: c["corrected_value"] for c in inspection.get("corrected_fields", [])}

        field_labels = {
            "product_name": "Product Name",
            "net_quantity": "Net Quantity",
            "mrp": "MRP",
            "manufacturer": "Manufacturer",
            "ingredients": "Ingredients",
            "nutritional_info": "Nutritional Info",
            "fssai_license": "FSSAI License No.",
            "best_before": "Best Before",
            "country_of_origin": "Country of Origin",
        }

        if ocr_results:
            field_data = [["Field", "OCR Extracted", "Corrected / Final"]]
            for ocr in ocr_results:
                fn = ocr["field_name"]
                field_data.append([
                    field_labels.get(fn, fn),
                    ocr.get("raw_value") or "—",
                    corrected_fields.get(fn) or "—",
                ])
            field_table = Table(field_data, colWidths=[4 * cm, 7 * cm, 5 * cm])
            field_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(field_table)
        else:
            story.append(Paragraph("No OCR results recorded.", body_style))

        # Validation Results
        story.append(Paragraph("9-Point FSSAI Compliance Checklist", section_style))
        validation_results = inspection.get("validation_results", [])
        if validation_results:
            val_data = [["Rule", "Status", "Finding"]]
            for vr in validation_results:
                r, g, b = STATUS_COLORS.get(vr["status"], (0.5, 0.5, 0.5))
                val_data.append([
                    vr.get("rule_key", "—").replace("_", " ").title(),
                    _status_label(vr["status"]),
                    (vr.get("finding") or "—")[:120],
                ])
            val_table = Table(val_data, colWidths=[4.5 * cm, 2.5 * cm, 9 * cm])
            val_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            # Color status column cells
            for i, vr in enumerate(validation_results, start=1):
                r, g, b = STATUS_COLORS.get(vr["status"], (0.5, 0.5, 0.5))
                val_table.setStyle(TableStyle([
                    ("BACKGROUND", (1, i), (1, i), colors.Color(r, g, b)),
                    ("TEXTCOLOR", (1, i), (1, i), colors.white),
                    ("FONTNAME", (1, i), (1, i), "Helvetica-Bold"),
                ]))
            story.append(val_table)
        else:
            story.append(Paragraph("Validation not yet run.", body_style))

        # Reviewer Notes
        reviewer_notes = inspection.get("reviewer_notes", [])
        if reviewer_notes:
            story.append(Paragraph("Reviewer Notes", section_style))
            for note in reviewer_notes:
                ts = note.get("recorded_at", "")[:19]
                decision = note.get("status_decision") or "No decision"
                story.append(Paragraph(
                    f"<b>[{ts}] {note.get('actor', 'anonymous')} — {decision}</b>",
                    body_style,
                ))
                story.append(Paragraph(note.get("note_text", ""), body_style))
                story.append(Spacer(1, 0.2 * cm))

        # Footer
        story.append(Spacer(1, 0.5 * cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
        story.append(Paragraph(
            "This report was generated by TrustLabel. "
            "It reflects the saved inspection record at the time of generation. "
            "Verify findings with the original label before taking regulatory action.",
            sub_style,
        ))

        doc.build(story)
        return True

    except Exception as exc:
        logger.error("PDF generation failed: %s", exc)
        return False
