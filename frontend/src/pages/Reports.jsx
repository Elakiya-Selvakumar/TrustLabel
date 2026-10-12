import { useEffect, useState } from 'react'
import { FileText, Download, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getInspections, listReports, downloadReport, generateReport } from '../api/api.js'

export default function Reports() {
  const [inspections, setInspections] = useState([])
  const [reportMap, setReportMap]     = useState({}) // inspectionId -> [reports]
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const insp = await getInspections()
        setInspections(insp)
        const map = {}
        await Promise.all(insp.map(async i => {
          try { map[i.id] = await listReports(i.id) } catch { map[i.id] = [] }
        }))
        setReportMap(map)
      } catch {
        toast.error('Could not load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleGenerate = async (inspectionId) => {
    setGenerating(inspectionId)
    try {
      const res = await generateReport(inspectionId)
      toast.success(`Report v${res.version_number} generated`)
      const reps = await listReports(inspectionId)
      setReportMap(prev => ({ ...prev, [inspectionId]: reps }))
    } catch {
      toast.error('PDF generation failed. Inspection data is safe.')
    } finally {
      setGenerating(null)
    }
  }

  const withReports = inspections.filter(i => (reportMap[i.id] || []).length > 0)
  const withoutReports = inspections.filter(i => (reportMap[i.id] || []).length === 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-teal-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="section-title text-xl">Reports</h1>
        <p className="section-subtitle">PDF compliance reports grouped by inspection</p>
      </div>

      {/* Inspections with reports */}
      {withReports.map(insp => (
        <div key={insp.id} className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-slate-200 font-semibold">{insp.product_name || 'Unnamed Product'}</h2>
              <p className="text-slate-500 text-xs font-mono mt-0.5">{insp.id}</p>
            </div>
            <button
              onClick={() => handleGenerate(insp.id)}
              disabled={generating === insp.id}
              className="btn-ghost text-teal-400 text-xs"
            >
              {generating === insp.id
                ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                : <><RefreshCw size={13} /> New Version</>
              }
            </button>
          </div>
          <div className="space-y-2">
            {(reportMap[insp.id] || []).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-navy-900 rounded-lg border border-navy-600">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-slate-400" />
                  <div>
                    <span className="text-slate-200 text-sm font-medium">
                      Version {r.version_number}
                      {r.is_current && <span className="ml-2 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded">Current</span>}
                    </span>
                    <p className="text-slate-500 text-xs">{new Date(r.generated_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <button onClick={() => downloadReport(r.id)} className="btn-primary py-1.5">
                  <Download size={13} /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Inspections without reports */}
      {withoutReports.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-3">Inspections Without Reports</h2>
          <div className="space-y-2">
            {withoutReports.map(insp => (
              <div key={insp.id} className="flex items-center justify-between p-3 bg-navy-900 rounded-lg border border-navy-600">
                <span className="text-slate-300 text-sm">{insp.product_name || 'Unnamed'}</span>
                <button
                  onClick={() => handleGenerate(insp.id)}
                  disabled={generating === insp.id}
                  className="btn-secondary py-1.5 text-xs"
                >
                  {generating === insp.id ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                  Generate Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {inspections.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <FileText size={32} className="text-slate-600" />
          <p className="text-slate-400 font-medium">No inspections found</p>
          <p className="text-slate-600 text-sm">Run an inspection first to generate reports.</p>
        </div>
      )}
    </div>
  )
}
