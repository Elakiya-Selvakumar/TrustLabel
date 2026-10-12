import { useEffect, useState } from 'react'
import { BookOpen, Loader2, ExternalLink } from 'lucide-react'
import { getRules } from '../api/api.js'
import toast from 'react-hot-toast'

export default function ComplianceRules() {
  const [rules, setRules] = useState([])
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRules()
        setRules(data.rules || [])
        setVersion(data.version || '')
      } catch {
        toast.error('Could not load compliance rules')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-teal-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-teal-500/10 rounded-lg">
          <BookOpen size={20} className="text-teal-400" />
        </div>
        <div>
          <h1 className="section-title text-xl">FSSAI Compliance Rules</h1>
          <p className="section-subtitle">
            9-point labelling checklist · Rule version: <span className="text-teal-400 font-medium">{version}</span>
          </p>
        </div>
      </div>

      <div className="card bg-teal-500/5 border-teal-500/20">
        <p className="text-teal-300 text-sm leading-relaxed">
          These requirements are derived from the <strong>Food Safety and Standards (Labelling and Display) Regulations, 2020</strong> and
          the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>. Every packaged food product sold in India must comply with all applicable rules.
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <div key={rule.key} className="card border border-navy-600 hover:border-teal-500/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center mt-0.5">
                <span className="text-teal-400 font-bold text-sm">{String(idx + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-slate-200 font-semibold text-sm mb-1">{rule.label}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-2">{rule.description}</p>
                <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                  <ExternalLink size={11} />
                  <span className="font-mono">{rule.reference}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
