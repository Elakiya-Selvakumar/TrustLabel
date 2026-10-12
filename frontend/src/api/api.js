import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Inspections ────────────────────────────────────────────────
export const getInspections = async () => {
  const { data } = await api.get('/inspections/')
  return data
}

export const getInspectionById = async (id) => {
  const { data } = await api.get(`/inspections/${id}`)
  return data
}

export const createInspection = async (payload) => {
  const { data } = await api.post('/inspections/', payload)
  return data
}

export const updateInspection = async (id, payload) => {
  const { data } = await api.patch(`/inspections/${id}`, payload)
  return data
}

export const deleteInspection = async (id) => {
  const { data } = await api.delete(`/inspections/${id}`)
  return data
}

export const getStats = async () => {
  const { data } = await api.get('/inspections/stats')
  return data
}

export const addReviewerNote = async (id, payload) => {
  const { data } = await api.post(`/inspections/${id}/notes`, payload)
  return data
}

// ── OCR ────────────────────────────────────────────────────────
export const extractOcr = async (formData) => {
  const { data } = await api.post('/ocr/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return data
}

export const correctField = async (payload) => {
  const { data } = await api.post('/ocr/correct', payload)
  return data
}

// ── Rules ──────────────────────────────────────────────────────
export const getRules = async () => {
  const { data } = await api.get('/rules/')
  return data
}

export const validateInspection = async (id) => {
  const { data } = await api.post(`/rules/validate/${id}`)
  return data
}

// ── Reports ────────────────────────────────────────────────────
export const generateReport = async (inspectionId) => {
  const { data } = await api.post(`/reports/generate/${inspectionId}`)
  return data
}

export const listReports = async (inspectionId) => {
  const { data } = await api.get(`/reports/list/${inspectionId}`)
  return data
}

export const downloadReport = (reportId) => {
  window.open(`/api/reports/download/${reportId}`, '_blank')
}

// ── QR ─────────────────────────────────────────────────────────
export const decodeQr = async (formData) => {
  const { data } = await api.post('/qr/decode', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const lookupQr = async (payload) => {
  const { data } = await api.post('/qr/lookup', payload)
  return data
}

export default api
