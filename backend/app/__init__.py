"""TrustLabel Flask application factory."""
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Load configuration
    from app.config import get_config
    app.config.from_object(get_config())

    # Ensure upload directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "reports"), exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    # Import models so Flask-Migrate can detect them
    from app import models  # noqa: F401

    # Register blueprints
    from app.routes.inspections import inspections_bp
    from app.routes.ocr import ocr_bp
    from app.routes.reports import reports_bp
    from app.routes.qr import qr_bp
    from app.routes.rules import rules_bp

    app.register_blueprint(inspections_bp, url_prefix="/api/inspections")
    app.register_blueprint(ocr_bp, url_prefix="/api/ocr")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(qr_bp, url_prefix="/api/qr")
    app.register_blueprint(rules_bp, url_prefix="/api/rules")

    # Create tables on first run (safe — does not drop existing tables)
    with app.app_context():
        try:
            db.create_all()
        except Exception as exc:
            app.logger.error("Database initialisation error: %s", exc)

    return app
