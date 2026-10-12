@echo off
ECHO ============================================================
ECHO  TrustLabel Backend Setup
ECHO ============================================================

:: Check if Python is available (real install, not store stub)
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    ECHO.
    ECHO [ERROR] Python not found.
    ECHO Please install Python 3.10+ from https://www.python.org/downloads/
    ECHO Make sure to check "Add Python to PATH" during installation.
    ECHO Then re-run this script.
    PAUSE
    EXIT /B 1
)

FOR /F "tokens=*" %%i IN ('python --version') DO SET PYVER=%%i
ECHO Found: %PYVER%

:: Create virtual environment
IF NOT EXIST "venv" (
    ECHO Creating virtual environment...
    python -m venv venv
)

:: Activate and install
ECHO Activating virtual environment...
CALL venv\Scripts\activate.bat

ECHO Installing dependencies...
pip install -r requirements.txt

:: Copy .env if not present
IF NOT EXIST ".env" (
    COPY .env.example .env
    ECHO Created .env from .env.example — please review TESSERACT_CMD setting.
)

:: Init migrations if needed
IF NOT EXIST "migrations" (
    ECHO Initialising Flask-Migrate...
    flask db init
    flask db migrate -m "initial schema"
)

ECHO Applying database migrations...
flask db upgrade

ECHO.
ECHO ============================================================
ECHO  Setup complete! Starting backend on http://localhost:5000
ECHO ============================================================
python run.py

PAUSE
