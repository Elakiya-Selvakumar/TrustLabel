# TrustLabel 🛡️

> AI-powered food label compliance verification for FSSAI standards — SIH 2026

TrustLabel helps food inspectors and consumers verify that packaged food labels comply with India's 9-point FSSAI checklist. It uses Tesseract OCR to extract label fields, validates them against versioned compliance rules, maintains a full audit trail, and generates PDF reports.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10 or later |
| Node.js | 18 or later |
| npm | 9 or later |
| Tesseract OCR | 5.x |
| SQLite | Built into Python — no extra install needed |

---

## Quick Start

### 1. Clone / Open the project

```
cd "trust label"
```

### 2. Install Tesseract OCR

**Windows:**
Download and run the installer from https://github.com/UB-Mannheim/tesseract/wiki
Default install path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

**macOS (Homebrew):**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

Verify installation:
```bash
tesseract --version
```

---

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
copy .env.example .env        # Windows
cp .env.example .env           # macOS/Linux

# Edit .env — set TESSERACT_CMD to your Tesseract path
# Windows: TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Apply database migrations (creates trustlabel.db)
flask db init      # only on first run
flask db migrate -m "initial"
flask db upgrade

# Start the backend
python run.py
```

Backend runs at: http://localhost:5000

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `FLASK_ENV` | `development` | `development` or `production` |
| `SECRET_KEY` | `dev-secret-key` | Flask secret key — change in production |
| `DATABASE_URL` | `sqlite:///trustlabel.db` | Database connection string |
| `TESSERACT_CMD` | `tesseract` | Path to Tesseract executable |
| `UPLOAD_FOLDER` | `uploads` | Directory for uploaded images |
| `EXTERNAL_LOOKUP_URL` | *(empty)* | Optional external product database URL |
| `EXTERNAL_LOOKUP_TIMEOUT` | `5` | External request timeout in seconds |

> ⚠️ Never commit real API keys, passwords, or tokens. The `.env` file is in `.gitignore`.

---

## Database Migrations

TrustLabel uses Flask-Migrate (Alembic) for safe, versioned migrations.

```bash
# Create a new migration after model changes
flask db migrate -m "description of change"

# Apply pending migrations
flask db upgrade

# Roll back one migration
flask db downgrade

# View migration history
flask db history
```

> ⚠️ Always back up `trustlabel.db` before applying destructive migrations:
> ```
> copy backend\trustlabel.db backend\trustlabel.db.bak   # Windows
> cp backend/trustlabel.db backend/trustlabel.db.bak     # macOS/Linux
> ```

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/inspections/` | List all inspections |
| POST | `/api/inspections/` | Create inspection |
| GET | `/api/inspections/stats` | Dashboard statistics |
| GET | `/api/inspections/<id>` | Full inspection detail |
| PATCH | `/api/inspections/<id>` | Update inspection |
| POST | `/api/ocr/extract` | Upload image and run OCR |
| POST | `/api/ocr/correct` | Save field correction |
| GET | `/api/rules/` | List compliance rules |
| POST | `/api/rules/validate/<id>` | Run 9-point validation |
| POST | `/api/reports/generate/<id>` | Generate PDF report |
| GET | `/api/reports/list/<id>` | List report versions |
| GET | `/api/reports/download/<id>` | Download PDF |
| POST | `/api/qr/decode` | Decode QR from image |
| POST | `/api/qr/lookup` | External product lookup |

---

## Troubleshooting

### Tesseract not found
```
Error: tesseract is not installed or it's not in your PATH
```
Set `TESSERACT_CMD` in your `.env` to the full path, e.g.:
```
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Missing environment variables
Copy `.env.example` to `.env` in the `backend/` directory. All variables have safe defaults for development.

### Database migration failures
1. Back up `trustlabel.db`
2. Run `flask db history` to see current state
3. Run `flask db upgrade` to apply pending migrations
4. If corrupt: delete `trustlabel.db` and `migrations/` then re-initialise (⚠️ loses data)

### Camera permission errors
Your browser must have camera permission enabled. On Chrome: Settings → Privacy → Camera → Allow localhost.

### PDF generation failures
Inspection data is always preserved. The PDF is generated separately from the saved record.
Check that `uploads/reports/` directory is writable.

### External API failures
If `EXTERNAL_LOOKUP_URL` is not configured or times out, only that specific lookup is marked `unavailable`. All local OCR and validation checks complete normally.

### CORS errors
Ensure the backend is running on port 5000 and the frontend on port 5173. The Vite proxy automatically forwards `/api` requests.

---

## Project Structure

```
trust label/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask factory
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── config.py            # Configuration
│   │   ├── routes/              # API blueprints
│   │   │   ├── inspections.py
│   │   │   ├── ocr.py
│   │   │   ├── reports.py
│   │   │   ├── qr.py
│   │   │   └── rules.py
│   │   ├── services/            # Business logic
│   │   │   ├── ocr_service.py
│   │   │   ├── pdf_service.py
│   │   │   └── external_lookup.py
│   │   └── utils/
│   │       └── audit.py
│   ├── migrations/              # Alembic migration scripts
│   ├── uploads/                 # Uploaded images + reports/
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/api.js
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Features

| Feature | Status |
|---|---|
| Image upload + camera capture | ✅ Implemented |
| Tesseract OCR field extraction | ✅ Implemented |
| 9-point FSSAI validation | ✅ Implemented |
| Editable field corrections | ✅ Implemented |
| Immutable OCR audit trail | ✅ Implemented |
| PDF report generation | ✅ Implemented |
| Versioned PDF reports | ✅ Implemented |
| QR code decoding | ✅ Implemented |
| External product lookup | ✅ With graceful fallback |
| Dark/light theme | ✅ Implemented |
| Responsive layout | ✅ Implemented |
| Database migrations | ✅ Flask-Migrate/Alembic |
| Inspection history | ✅ Implemented |

---

## License

MIT — Built for Smart India Hackathon 2026
