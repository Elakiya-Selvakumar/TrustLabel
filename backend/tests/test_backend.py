"""Tests for TrustLabel backend."""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def app():
    """Create test Flask app with in-memory SQLite."""
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['FLASK_ENV'] = 'development'
    os.environ['SECRET_KEY'] = 'test-secret'
    from app import create_app, db as _db
    application = create_app()
    application.config['TESTING'] = True
    with application.app_context():
        _db.create_all()
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


# ── Stats endpoint ────────────────────────────────────────────────────────────
class TestStats:
    def test_stats_returns_zero_counts_initially(self, client):
        r = client.get('/api/inspections/stats')
        assert r.status_code == 200
        data = r.get_json()
        assert data['total'] == 0
        assert data['passed'] == 0
        assert data['failed'] == 0

    def test_stats_increments_after_create(self, client):
        client.post('/api/inspections/', json={'product_name': 'Test Product'})
        r = client.get('/api/inspections/stats')
        assert r.get_json()['total'] == 1


# ── Inspections CRUD ──────────────────────────────────────────────────────────
class TestInspections:
    def test_create_inspection(self, client):
        r = client.post('/api/inspections/', json={'product_name': 'Aashirvaad Atta'})
        assert r.status_code == 201
        data = r.get_json()
        assert data['product_name'] == 'Aashirvaad Atta'
        assert data['status'] == 'pending'
        assert 'id' in data

    def test_list_inspections(self, client):
        client.post('/api/inspections/', json={'product_name': 'P1'})
        client.post('/api/inspections/', json={'product_name': 'P2'})
        r = client.get('/api/inspections/')
        assert r.status_code == 200
        assert len(r.get_json()) == 2

    def test_get_inspection_by_id(self, client):
        create = client.post('/api/inspections/', json={'product_name': 'P1'})
        iid = create.get_json()['id']
        r = client.get(f'/api/inspections/{iid}')
        assert r.status_code == 200
        assert r.get_json()['id'] == iid

    def test_get_nonexistent_returns_404(self, client):
        r = client.get('/api/inspections/00000000-0000-0000-0000-000000000000')
        assert r.status_code == 404

    def test_soft_delete(self, client):
        create = client.post('/api/inspections/', json={'product_name': 'Del'})
        iid = create.get_json()['id']
        client.delete(f'/api/inspections/{iid}')
        r = client.get('/api/inspections/')
        ids = [i['id'] for i in r.get_json()]
        assert iid not in ids


# ── Rules endpoint ────────────────────────────────────────────────────────────
class TestRules:
    def test_get_rules_returns_nine(self, client):
        r = client.get('/api/rules/')
        assert r.status_code == 200
        data = r.get_json()
        assert len(data['rules']) == 9

    def test_validate_empty_inspection_fails_all(self, client):
        create = client.post('/api/inspections/', json={'product_name': ''})
        iid = create.get_json()['id']
        r = client.post(f'/api/rules/validate/{iid}')
        assert r.status_code == 200
        data = r.get_json()
        # All rules should fail or warn since no fields were extracted
        assert data['summary']['pass'] == 0

    def test_validate_nonexistent_returns_404(self, client):
        r = client.post('/api/rules/validate/00000000-0000-0000-0000-000000000000')
        assert r.status_code == 404


# ── External lookup fallback ──────────────────────────────────────────────────
class TestExternalLookup:
    def test_lookup_not_configured_returns_not_configured(self, client):
        r = client.post('/api/qr/lookup', json={'qr_data': 'test-qr'})
        assert r.status_code == 200
        data = r.get_json()
        assert data['status'] == 'not_configured'

    def test_lookup_missing_qr_data_returns_400(self, client):
        r = client.post('/api/qr/lookup', json={})
        assert r.status_code == 400


# ── OCR service unit tests ────────────────────────────────────────────────────
class TestOcrService:
    def test_extract_fields_mrp(self):
        from app.services.ocr_service import extract_fields
        text = "Aashirvaad Atta\nNet Wt. 5 kg\nMRP Rs 280\nManufactured by ITC Ltd, Kolkata"
        fields = extract_fields(text)
        assert '280' in (fields.get('mrp') or '')

    def test_extract_fields_fssai(self):
        from app.services.ocr_service import extract_fields
        text = "FSSAI Lic. No. 10016011002253\nBest Before: Dec 2025"
        fields = extract_fields(text)
        assert fields.get('fssai_license') == '10016011002253'

    def test_extract_fields_returns_dict(self):
        from app.services.ocr_service import extract_fields
        fields = extract_fields("some random text")
        assert isinstance(fields, dict)
        assert 'product_name' in fields


# ── Validation rules unit tests ───────────────────────────────────────────────
class TestValidationRules:
    def test_valid_mrp_passes(self, client):
        from app.routes.rules import _validate_field
        result = _validate_field('mrp', '₹280')
        assert result['status'] == 'pass'

    def test_invalid_mrp_fails(self, client):
        from app.routes.rules import _validate_field
        result = _validate_field('mrp', '280')
        assert result['status'] == 'fail'

    def test_valid_fssai_passes(self, client):
        from app.routes.rules import _validate_field
        result = _validate_field('fssai_license', '10016011002253')
        assert result['status'] == 'pass'

    def test_invalid_fssai_fails(self, client):
        from app.routes.rules import _validate_field
        result = _validate_field('fssai_license', '12345')
        assert result['status'] == 'fail'

    def test_empty_field_fails(self, client):
        from app.routes.rules import _validate_field
        result = _validate_field('product_name', '')
        assert result['status'] == 'fail'
