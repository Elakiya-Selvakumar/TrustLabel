import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Clock, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getInspectionById, generateReport, downloadReport, listReports } from '../api/api.js'
import ComplianceChecklist from '../components/Inspection/ComplianceChecklist.jsx'
import StatusBadge from '../components/Inspection/StatusBadge.jsx'

const FIELD_LABELS = {
  product_name:'Product Name', net_quantity:'Net Quantity', mrp:'MRP',
  manufacturer:'Manufacturer', ingredients:'Ingredients',
  nutritional_info:'Nutritional Info', fssai_license:'FSSAI License No.',
  best_before:'Best Before', country_of_origin:'Country of Origin',
}

export default function InspectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [genLoading, setGenLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [insp, reps] = await Promise.all([getInspectionById(id), listReports(id)])
        setInspection(insp)
        setReports(reps)
      } catch {
        toast.error('Could not load inspection')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleGenerate = async () => {
    setGenLoading(true)
    try {
      const res = await generateReport(id)
      toast.success(`Report v${res.version_number} generated`)
      const reps = await listReports(id)
      setReports(reps)
    } catch {
      toast.error('PDF generation failed. Inspection data is intact.')
    } finally {
      setGenLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-teal-400 animate-spin" />
    </div>
  )

  if (!inspection) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-slate-400">Inspection not found.</p>
      <button onClick={() => navigate('/history')} className="btn-primary">Back to History</button>
    </div>
  )

  // Build field map from OCR and corrections
  const ocrMap  = Object.fromEntries((inspection.ocr_results || []).map(r => [r.field_name, r.raw_value]))
  const corrMap = {}
  ;(inspection.corrected_fields || []).forEach(c => { corrMap[c.field_name] = c.corrected_value })

  const fieldKeys = [...new Set([...Object.keys(ocrMap), ...Object.keys(corrMap)])]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost mt-0.5"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="section-title text-xl">{inspection.product_name || 'Unnamed Product'}</h1>
            <StatusBadge status={inspection.status} />
          </div>
          <p className="section-subtitle">
            Inspection ID: <code className="text-slate-400 text-xs">{inspection.id}</code> ·
            Rule version: {inspection.rule_version} ·
            Created: {new Date(inspection.created_at).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerate} disabled={genLoading} className="btn-secondary">
            {genLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {genLoading ? 'Generating…' : 'New Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fields */}
        <div className="card">
          <h2 className="section-title mb-4">Label Fields</h2>
          <div className="space-y-3">
            {fieldKeys.map(fn => {
              const ocr  = ocrMap[fn]
              const corr = corrMap[fn]
              const isCorrected = corr !== undefined && corr !== null
              return (
                <div key={fn} className="bg-navy-900 rounded-lg border border-navy-600 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 font-medium">{FIELD_LABELS[fn] || fn}</span>
                    {isCorrected
                      ? <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">Corrected</span>
                      : <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">OCR</span>
                    }
                  </div>
                  <p className="text-slate-200 text-sm">{isCorrected ? corr : ocr || <span className="text-slate-600 italic">Not detected</span>}</p>
                  {isCorrected && ocr && <p className="text-xs text-slate-600 mt-1">Original: {ocr}</p>}
                </div>
              )
            })}
            {fieldKeys.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No field data recorded.</p>}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Compliance checklist */}
          <div className="card">
            <h2 className="section-title mb-4">Compliance Results</h2>
            <ComplianceChecklist results={inspection.validation_results || []} />
          </div>

          {/* Reviewer notes */}
          {(inspection.reviewer_notes || []).length > 0 && (
            <div className="card">
              <h2 className="section-title mb-3">Reviewer Notes</h2>
              <div className="space-y-3">
                {inspection.reviewer_notes.map(note => (
                  <div key={note.id} className="bg-navy-900 border border-navy-600 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">{new Date(note.recorded_at).toLocaleString('en-IN')}</span>
                      {note.status_decision && <StatusBadge status={note.status_decision} />}
                    </div>
                    <p className="text-slate-300 text-sm">{note.note_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit trail */}
      {(inspection.audit_events || []).length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-teal-400" />
            <h2 className="section-title">Audit Trail</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...inspection.audit_events].reverse().map(ev => (
              <div key={ev.id} className="flex items-start gap-3 text-sm py-2 border-b border-navy-700 last:border-0">
                <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-slate-300 font-medium">{ev.event_type.replace(/_/g,' ')}</span>
                  {ev.after_value && <span className="text-slate-500 ml-2">→ {ev.after_value}</span>}
                  {ev.before_value && <span className="text-slate-600 ml-1">(was: {ev.before_value})</span>}
                </div>
                <span className="text-slate-600 text-xs flex-shrink-0">
                  {new Date(ev.recorded_at).toLocaleTimeString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report versions */}
      {reports.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">Report Versions</h2>
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-navy-900 rounded-lg border border-navy-600">
                <div>
                  <span className="text-slate-200 text-sm font-medium">
                    v{r.version_number}
                    {r.is_current && <span className="ml-2 text-xs text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">Current</span>}
                  </span>
                  <p className="text-slate-500 text-xs">{new Date(r.generated_at).toLocaleString('en-IN')}</p>
                </div>
                <button onClick={() => downloadReport(r.id)} className="btn-ghost text-teal-400">
                  <FileText size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
