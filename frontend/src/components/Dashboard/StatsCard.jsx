export default function StatsCard({ icon: Icon, title, value, description, colorClass, borderClass, loading }) {
  return (
    <div className={`card flex items-start gap-4 border-l-4 ${borderClass ?? 'border-teal-500'}`}>
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass ?? 'bg-teal-500/15'}`}>
        <Icon size={20} className={colorClass ? '' : 'text-teal-400'} />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
        {loading ? (
          <div className="h-7 w-12 bg-navy-700 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-100 leading-none">{value ?? '—'}</p>
        )}
        {description && <p className="text-slate-500 text-xs mt-1">{description}</p>}
      </div>
    </div>
  )
}
