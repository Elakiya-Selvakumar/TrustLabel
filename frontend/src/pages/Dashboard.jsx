import { ClipboardList, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react'
import WelcomeBanner from '../components/Dashboard/WelcomeBanner.jsx'
import StatsCard from '../components/Dashboard/StatsCard.jsx'
import QuickActions from '../components/Dashboard/QuickActions.jsx'
import RecentInspections from '../components/Dashboard/RecentInspections.jsx'
import { useApp } from '../context/AppContext.jsx'

const HOW_STEPS = [
  {
    num: '01',
    title: 'Upload Label Image',
    desc: 'Photograph or upload a product label. TrustLabel accepts JPG, PNG, and WebP.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
  {
    num: '02',
    title: 'AI OCR + Validation',
    desc: 'Tesseract OCR extracts key fields. The 9-point FSSAI ruleset checks each requirement.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    num: '03',
    title: 'Download PDF Report',
    desc: 'Generate a versioned, audit-ready compliance report from the verified inspection record.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
]

export default function Dashboard() {
  const { stats, statsLoading, inspections, inspectionsLoading } = useApp()

  const STAT_CARDS = [
    {
      icon: ClipboardList,
      title: 'Total Inspections',
      value: stats.total,
      description: 'All recorded product inspections',
      colorClass: 'bg-blue-500/10 text-blue-400',
      borderClass: 'border-blue-500',
    },
    {
      icon: CheckCircle2,
      title: 'No Issues Detected',
      value: stats.passed,
      description: 'Fully compliant — all 9 rules passed',
      colorClass: 'bg-teal-500/10 text-teal-400',
      borderClass: 'border-teal-500',
    },
    {
      icon: AlertTriangle,
      title: 'Potential Issues',
      value: stats.failed,
      description: 'One or more compliance failures',
      colorClass: 'bg-amber-500/10 text-amber-400',
      borderClass: 'border-amber-500',
    },
    {
      icon: UserCheck,
      title: 'Manual Review Required',
      value: stats.review,
      description: 'Awaiting human reviewer decision',
      colorClass: 'bg-red-500/10 text-red-400',
      borderClass: 'border-red-500',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <StatsCard key={card.title} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Quick Actions + Recent Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <div className="mb-3">
            <h2 className="section-title">Quick Actions</h2>
            <p className="section-subtitle">Common tasks to get started</p>
          </div>
          <QuickActions />
        </div>

        {/* Recent Inspections */}
        <RecentInspections inspections={inspections} loading={inspectionsLoading} />
      </div>

      {/* How TrustLabel Works */}
      <div className="card">
        <div className="mb-5">
          <h2 className="section-title">How TrustLabel Works</h2>
          <p className="section-subtitle">Three steps to verifiable FSSAI compliance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOW_STEPS.map(({ num, title, desc, color, bg }) => (
            <div key={num} className="relative flex gap-4 p-4 bg-navy-900 rounded-xl border border-navy-600">
              <div className={`flex-shrink-0 w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <span className={`font-bold text-sm ${color}`}>{num}</span>
              </div>
              <div>
                <h3 className="text-slate-200 font-semibold text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
