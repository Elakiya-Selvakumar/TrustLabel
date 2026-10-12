"""QR code scanning and external lookup API routes."""
import os
from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from app.services.external_lookup import lookup_product

qr_bp = Blueprint("qr", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@qr_bp.route("/decode", methods=["POST"])
def decode_qr():
    """Decode QR codes from an uploaded image.

    Returns list of decoded QR data strings.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file or not _allowed_file(file.filename):
        return jsonify({"error": "Invalid or unsupported file type"}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    filename = secure_filename(file.filename)
    image_path = os.path.join(upload_folder, f"qr_{filename}")
    file.save(image_path)

    decoded_data = []
    error_msg = None

    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        import cv2

        img = cv2.imread(image_path)
        if img is None:
            return jsonify({"error": "Could not load image"}), 400

        barcodes = pyzbar_decode(img)
        decoded_data = [b.data.decode("utf-8") for b in barcodes]

    except ImportError:
        # Try with PIL fallback
        try:
            from PIL import Image
            from pyzbar.pyzbar import decode as pyzbar_decode
            img = Image.open(image_path)
            barcodes = pyzbar_decode(img)
            decoded_data = [b.data.decode("utf-8") for b in barcodes]
        except ImportError:
            error_msg = "pyzbar not installed. QR decoding unavailable."
        except Exception as exc:
            error_msg = f"QR decode error: {str(exc)}"
    except Exception as exc:
        error_msg = f"QR decode error: {str(exc)}"

    # Clean up temp file
    try:
        os.remove(image_path)
    except OSError:
        pass

    if error_msg:
        return jsonify({"decoded": [], "error": error_msg}), 206

    return jsonify({
        "decoded": decoded_data,
        "count": len(decoded_data),
    })


@qr_bp.route("/lookup", methods=["POST"])
def lookup():
    """Look up decoded QR data in external product database.

    Request JSON: {"qr_data": "..."}
    Returns lookup result with graceful fallback.
    """
    data = request.get_json(silent=True) or {}
    qr_data = data.get("qr_data", "").strip()

    if not qr_data:
        return jsonify({"error": "qr_data is required"}), 400

    result = lookup_product(qr_data)
    return jsonify(result)
