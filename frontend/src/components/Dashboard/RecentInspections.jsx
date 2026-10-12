import { useNavigate } from 'react-router-dom'
import { Eye, PlusCircle, ArrowRight } from 'lucide-react'
import StatusBadge from '../Inspection/StatusBadge.jsx'

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4].map(i => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-navy-700 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function RecentInspections({ inspections = [], loading = false }) {
  const navigate = useNavigate()
  const recent = inspections.slice(0, 5)

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title">Recent Inspections</h2>
          <p className="section-subtitle">Latest saved inspection records</p>
        </div>
        <button
          onClick={() => navigate('/history')}
          className="btn-ghost text-teal-400 hover:text-teal-300 gap-1"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600">
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3].map(i => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : recent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 bg-navy-700 rounded-full flex items-center justify-center mb-3">
            <PlusCircle size={24} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium mb-1">No inspections yet</p>
          <p className="text-slate-600 text-sm mb-4">Start your first inspection to see results here.</p>
          <button onClick={() => navigate('/inspection/new')} className="btn-primary">
            <PlusCircle size={15} />
            Start Inspection
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600">
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-2 text-slate-500 font-medium text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {recent.map((insp) => (
                <tr key={insp.id} className="hover:bg-navy-700/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-slate-200 font-medium truncate max-w-[150px] block">
                      {insp.product_name || <span className="text-slate-500 italic">Unnamed</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                    {insp.created_at ? new Date(insp.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={insp.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/inspection/${insp.id}`)}
                      className="btn-ghost py-1 px-2 text-teal-400 hover:text-teal-300"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
