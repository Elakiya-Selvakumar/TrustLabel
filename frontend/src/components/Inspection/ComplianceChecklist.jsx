import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, HelpCircle } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'

const RULE_LABELS = {
  product_name:      'Product Name',
  net_quantity:      'Net Quantity',
  mrp:               'MRP Declaration',
  manufacturer:      'Manufacturer Details',
  ingredients:       'Ingredients List',
  nutritional_info:  'Nutritional Information',
  fssai_license:     'FSSAI License Number',
  best_before:       'Best Before / Expiry Date',
  country_of_origin: 'Country of Origin',
}

const StatusIcon = ({ status }) => {
  const size = 16
  if (status === 'pass')        return <CheckCircle2  size={size} className="text-green-400 flex-shrink-0" />
  if (status === 'fail')        return <XCircle       size={size} className="text-red-400   flex-shrink-0" />
  if (status === 'warn')        return <AlertTriangle size={size} className="text-amber-400 flex-shrink-0" />
  if (status === 'unavailable') return <MinusCircle   size={size} className="text-slate-400 flex-shrink-0" />
  return                               <HelpCircle    size={size} className="text-blue-400  flex-shrink-0" />
}

export default function ComplianceChecklist({ results = [] }) {
  if (results.length === 0) {
    return (
      <div className="text-slate-500 text-sm py-4 text-center">
        Run validation to see compliance results.
      </div>
    )
  }

  const passed = results.filter(r => r.status === 'pass').length
  const total  = results.length
  const pct    = Math.round((passed / total) * 100)

  return (
    <div className="space-y-3">
      {/* Score bar */}
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-400">Compliance Score</span>
        <span className={`font-semibold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
          {passed}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-navy-900 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Rule list */}
      {results.map((r) => (
        <div
          key={r.rule_key}
          className="flex items-start gap-3 p-3 bg-navy-900 rounded-lg border border-navy-600 hover:border-navy-500 transition-colors"
        >
          <StatusIcon status={r.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-slate-200 text-sm font-medium">
                {r.label || RULE_LABELS[r.rule_key] || r.rule_key}
              </span>
              <StatusBadge status={r.status} />
            </div>
            {r.finding && (
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{r.finding}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
