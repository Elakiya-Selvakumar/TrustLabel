import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Search, Filter, Loader2 } from 'lucide-react'
import { getInspections } from '../api/api.js'
import StatusBadge from '../components/Inspection/StatusBadge.jsx'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['all', 'pass', 'fail', 'review', 'pending']

export default function History() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getInspections()
        setInspections(data)
      } catch {
        toast.error('Could not load inspection history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = inspections.filter(i => {
    const matchStatus = filter === 'all' || i.status === filter
    const matchSearch = !search || (i.product_name || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="section-title text-xl">Inspection History</h1>
        <p className="section-subtitle">All recorded product label inspections</p>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product name…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-500 flex-shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  filter === s
                    ? 'bg-teal-500 text-white'
                    : 'bg-navy-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-teal-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-slate-400 font-medium">No inspections found</p>
            <p className="text-slate-600 text-sm">Try adjusting your search or filter.</p>
            <button onClick={() => navigate('/inspection/new')} className="btn-primary mt-2">Start Inspection</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-600">
                {['Product Name', 'Status', 'Rule Version', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filtered.map(insp => (
                <tr key={insp.id} className="hover:bg-navy-700/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-slate-200 font-medium">
                      {insp.product_name || <span className="text-slate-500 italic">Unnamed</span>}
                    </span>
                    <p className="text-slate-600 text-xs mt-0.5 font-mono">{insp.id.slice(0,8)}…</p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={insp.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{insp.rule_version}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(insp.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/inspection/${insp.id}`)}
                      className="btn-ghost py-1 px-2 text-teal-400 hover:text-teal-300"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-slate-600 text-xs text-right">{filtered.length} of {inspections.length} records</p>
    </div>
  )
}
