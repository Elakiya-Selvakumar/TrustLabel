import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Upload, Camera, QrCode, CheckCircle2, FileText,
  Save, RefreshCw, AlertCircle, X, Loader2,
} from 'lucide-react'
import { extractOcr, validateInspection, generateReport, createInspection, decodeQr } from '../api/api.js'
import FieldEditor from '../components/Inspection/FieldEditor.jsx'
import ComplianceChecklist from '../components/Inspection/ComplianceChecklist.jsx'
import StatusBadge from '../components/Inspection/StatusBadge.jsx'
import { useApp } from '../context/AppContext.jsx'

const FIELD_ORDER = [
  'product_name','net_quantity','mrp','manufacturer',
  'ingredients','nutritional_info','fssai_license','best_before','country_of_origin',
]

export default function NewInspection() {
  const navigate = useNavigate()
  const { refreshStats, refreshInspections } = useApp()

  const [stage, setStage] = useState('upload') // upload | processing | fields | validated | done
  const [inspectionId, setInspectionId]   = useState(null)
  const [ocrFields, setOcrFields]         = useState({})
  const [correctedFields, setCorrectedFields] = useState({})
  const [validationResults, setValidationResults] = useState([])
  const [overallStatus, setOverallStatus] = useState(null)
  const [reportId, setReportId]           = useState(null)
  const [ocrError, setOcrError]           = useState(null)
  const [previewUrl, setPreviewUrl]       = useState(null)
  const [activeTab, setActiveTab]         = useState('upload') // upload | camera | qr
  const [qrDecoded, setQrDecoded]         = useState([])
  const [qrLoading, setQrLoading]         = useState(false)
  const [genLoading, setGenLoading]       = useState(false)
  const [validateLoading, setValidateLoading] = useState(false)
  const videoRef = useRef(null)
  const [cameraStream, setCameraStream]   = useState(null)

  // ── Dropzone ──────────────────────────────────────────────────
  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setStage('processing')
    setOcrError(null)

    const formData = new FormData()
    formData.append('file', file)
    if (inspectionId) formData.append('inspection_id', inspectionId)

    try {
      const result = await extractOcr(formData)
      setInspectionId(result.inspection_id)
      setOcrFields(result.fields || {})
      if (result.error) setOcrError(result.message || result.error)
      setStage('fields')
      if (!result.error) toast.success('OCR extraction complete')
      else toast.error(`OCR issue: ${result.message}`)
    } catch (err) {
      setOcrError(err.response?.data?.message || 'OCR request failed. Is the backend running?')
      setStage('upload')
      toast.error('OCR failed')
    }
  }, [inspectionId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png','.jpg','.jpeg','.webp','.bmp'] },
    maxFiles: 1,
    disabled: stage === 'processing',
  })

  // ── Camera ────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setCameraStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.')
    }
  }

  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop())
    setCameraStream(null)
  }, [cameraStream])

  useEffect(() => () => stopCamera(), [stopCamera])

  const captureFrame = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      stopCamera()
      onDrop([file])
    }, 'image/jpeg', 0.92)
  }

  // ── QR ────────────────────────────────────────────────────────
  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setQrLoading(true)
    try {
      const res = await decodeQr(formData)
      setQrDecoded(res.decoded || [])
      if (res.decoded?.length > 0) toast.success(`Decoded ${res.decoded.length} QR code(s)`)
      else toast('No QR codes found in this image', { icon: '⚠️' })
    } catch {
      toast.error('QR decode failed')
    } finally {
      setQrLoading(false)
    }
  }

  // ── Validate ──────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!inspectionId) { toast.error('No inspection to validate'); return }
    setValidateLoading(true)
    try {
      const res = await validateInspection(inspectionId)
      setValidationResults(res.results || [])
      setOverallStatus(res.overall_status)
      setStage('validated')
      toast.success('Validation complete')
      refreshStats()
      refreshInspections()
    } catch {
      toast.error('Validation failed')
    } finally {
      setValidateLoading(false)
    }
  }

  // ── Generate PDF ──────────────────────────────────────────────
  const handleGenerateReport = async () => {
    if (!inspectionId) { toast.error('No inspection to report'); return }
    setGenLoading(true)
    try {
      const res = await generateReport(inspectionId)
      setReportId(res.report_id)
      setStage('done')
      toast.success(`Report v${res.version_number} generated`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'PDF generation failed. Inspection data is safe.')
    } finally {
      setGenLoading(false)
    }
  }

  const reset = () => {
    setStage('upload'); setInspectionId(null); setOcrFields({})
    setCorrectedFields({}); setValidationResults([]); setOverallStatus(null)
    setReportId(null); setOcrError(null); setPreviewUrl(null)
    setQrDecoded([]); stopCamera()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">New Inspection</h1>
          <p className="section-subtitle">Upload a product label image to begin</p>
        </div>
        {inspectionId && (
          <div className="flex items-center gap-3">
            {overallStatus && <StatusBadge status={overallStatus} />}
            <button onClick={reset} className="btn-ghost text-xs">
              <RefreshCw size={13} /> Start Over
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {ocrError && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-0.5">OCR Notice</p>
            <p className="text-amber-400/80">{ocrError}</p>
          </div>
          <button onClick={() => setOcrError(null)} className="ml-auto flex-shrink-0 text-amber-400 hover:text-amber-200">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — upload / camera / QR */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-navy-800 border border-navy-600 p-1 rounded-lg w-fit">
            {[
              { id: 'upload', icon: Upload, label: 'Upload' },
              { id: 'camera', icon: Camera, label: 'Camera' },
              { id: 'qr',     icon: QrCode, label: 'QR Scan' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); if (id !== 'camera') stopCamera() }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Upload tab */}
          {activeTab === 'upload' && (
            <div className="card">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-teal-400 bg-teal-500/5'
                    : stage === 'processing'
                    ? 'border-navy-500 cursor-not-allowed opacity-60'
                    : 'border-navy-500 hover:border-teal-500/60 hover:bg-teal-500/5'
                }`}
              >
                <input {...getInputProps()} />
                {stage === 'processing' ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="text-teal-400 animate-spin" />
                    <p className="text-slate-300 font-medium">Running OCR extraction…</p>
                    <p className="text-slate-500 text-xs">This may take 5–15 seconds</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center">
                      <Upload size={24} className="text-teal-400" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium">
                        {isDragActive ? 'Drop the image here' : 'Drop label image or click to upload'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">Supports JPG, PNG, WebP, BMP · Max 16 MB</p>
                    </div>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Uploaded image</p>
                  <img src={previewUrl} alt="Label preview" className="max-h-48 rounded-lg border border-navy-600 object-contain mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* Camera tab */}
          {activeTab === 'camera' && (
            <div className="card space-y-4">
              <div className="relative bg-navy-900 rounded-xl overflow-hidden aspect-video">
                {cameraStream ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <div className="w-14 h-14 bg-navy-700 rounded-full flex items-center justify-center">
                      <Camera size={24} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">Camera not started</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {!cameraStream ? (
                  <button onClick={startCamera} className="btn-primary flex-1">
                    <Camera size={15} /> Start Camera
                  </button>
                ) : (
                  <>
                    <button onClick={captureFrame} className="btn-primary flex-1">
                      <Camera size={15} /> Capture
                    </button>
                    <button onClick={stopCamera} className="btn-ghost">
                      <X size={15} /> Stop
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* QR tab */}
          {activeTab === 'qr' && (
            <div className="card space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <QrCode size={24} className="text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm text-center">
                  Upload an image containing a QR code to decode it.
                </p>
                <label className="btn-primary cursor-pointer">
                  <Upload size={15} />
                  {qrLoading ? 'Decoding…' : 'Upload QR Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={qrLoading} />
                </label>
              </div>
              {qrDecoded.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Decoded QR Data</p>
                  {qrDecoded.map((d, i) => (
                    <div key={i} className="bg-navy-900 border border-navy-600 rounded-lg p-3 text-sm text-slate-200 break-all font-mono">
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — extracted fields */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="section-title mb-4">Extracted Fields</h2>
            {stage === 'upload' && !inspectionId ? (
              <p className="text-slate-500 text-sm py-4 text-center">Upload an image to see extracted fields.</p>
            ) : (
              <div className="space-y-4">
                {FIELD_ORDER.map(field => (
                  <FieldEditor
                    key={field}
                    fieldName={field}
                    ocrValue={ocrFields[field] ?? null}
                    correctedValue={correctedFields[field] ?? null}
                    inspectionId={inspectionId}
                    onCorrected={(fn, val) => setCorrectedFields(prev => ({ ...prev, [fn]: val }))}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {inspectionId && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleValidate}
                disabled={validateLoading}
                className="btn-primary flex-1"
              >
                {validateLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {validateLoading ? 'Validating…' : 'Run Validation'}
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={genLoading || !overallStatus}
                className="btn-secondary flex-1"
                title={!overallStatus ? 'Run validation first' : ''}
              >
                {genLoading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                {genLoading ? 'Generating…' : 'Generate PDF'}
              </button>
            </div>
          )}

          {reportId && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-300 font-medium text-sm">Report generated!</p>
                <p className="text-green-400/70 text-xs">View all reports in the Reports section.</p>
              </div>
              <button onClick={() => navigate('/reports')} className="btn-ghost text-green-400 text-xs">
                View Reports
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compliance checklist — full width after validation */}
      {validationResults.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">9-Point FSSAI Compliance Checklist</h2>
              <p className="section-subtitle">Based on extracted and corrected field values · Rule version v1.0</p>
            </div>
            {overallStatus && <StatusBadge status={overallStatus} />}
          </div>
          <ComplianceChecklist results={validationResults} />
        </div>
      )}
    </div>
  )
}
