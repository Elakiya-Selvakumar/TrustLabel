import { useNavigate } from 'react-router-dom'
import { PlusCircle, Clock } from 'lucide-react'

export default function WelcomeBanner() {
  const navigate = useNavigate()
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy-800 border border-navy-600 p-6 md:p-8">
      {/* Teal top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 rounded-t-2xl" />

      {/* Subtle background glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
        {/* Left — text */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 mb-3">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-400 text-xs font-medium">SIH 2026 — Live Demo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2 leading-tight">
            Welcome to <span className="text-teal-400">TrustLabel</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg leading-relaxed">
            AI-powered food label compliance verification for FSSAI standards.
            Upload a product label to extract fields, validate all 9 compliance rules,
            and generate an audit-ready PDF report.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button onClick={() => navigate('/inspection/new')} className="btn-primary">
              <PlusCircle size={16} />
              Start New Inspection
            </button>
            <button onClick={() => navigate('/history')} className="btn-secondary">
              <Clock size={16} />
              View History
            </button>
          </div>
        </div>

        {/* Right — SVG illustration */}
        <div className="hidden md:block flex-shrink-0">
          <ProductIllustration />
        </div>
      </div>
    </div>
  )
}

function ProductIllustration() {
  return (
    <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Package body */}
      <rect x="30" y="20" width="100" height="120" rx="8" fill="#1e3a4a" stroke="#14b8a6" strokeWidth="1.5"/>
      {/* Label area */}
      <rect x="40" y="35" width="80" height="90" rx="4" fill="#0f2533" stroke="#334155" strokeWidth="1"/>
      {/* Product name bar */}
      <rect x="48" y="42" width="64" height="10" rx="2" fill="#14b8a6" opacity="0.8"/>
      {/* Content lines */}
      <rect x="48" y="60" width="50" height="3" rx="1.5" fill="#334155"/>
      <rect x="48" y="68" width="42" height="3" rx="1.5" fill="#334155"/>
      <rect x="48" y="76" width="55" height="3" rx="1.5" fill="#334155"/>
      <rect x="48" y="84" width="38" height="3" rx="1.5" fill="#334155"/>
      {/* QR code box */}
      <rect x="90" y="96" width="26" height="26" rx="2" fill="#0f2533" stroke="#334155" strokeWidth="1"/>
      <rect x="93" y="99" width="8" height="8" rx="1" fill="#14b8a6"/>
      <rect x="103" y="99" width="3" height="3" fill="#14b8a6"/>
      <rect x="108" y="99" width="5" height="8" rx="1" fill="#14b8a6"/>
      <rect x="93" y="110" width="5" height="9" rx="1" fill="#14b8a6"/>
      <rect x="100" y="107" width="3" height="3" fill="#14b8a6"/>
      <rect x="105" y="112" width="8" height="5" rx="1" fill="#14b8a6"/>
      {/* Check marks floating */}
      <circle cx="135" cy="35" r="12" fill="#14b8a6" opacity="0.15"/>
      <path d="M129 35 L133 39 L141 31" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="140" cy="65" r="9" fill="#22c55e" opacity="0.15"/>
      <path d="M136 65 L139 68 L145 61" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="80" r="9" fill="#ef4444" opacity="0.12"/>
      <path d="M16 76 L24 84 M24 76 L16 84" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
      {/* FSSAI badge at bottom */}
      <rect x="48" y="96" width="36" height="9" rx="2" fill="#1e3a4a" stroke="#14b8a6" strokeWidth="0.8"/>
      <text x="66" y="103" textAnchor="middle" fill="#14b8a6" fontSize="5" fontFamily="Inter,sans-serif" fontWeight="600">FSSAI ✓</text>
    </svg>
  )
}
