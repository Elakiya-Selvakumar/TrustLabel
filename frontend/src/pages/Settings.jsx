import { ShieldCheck, Sun, Moon, Github } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title text-xl">Settings</h1>
        <p className="section-subtitle">Application preferences and information</p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-slate-200 font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between p-4 bg-navy-900 rounded-xl border border-navy-600">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-teal-400" /> : <Sun size={18} className="text-amber-400" />}
            <div>
              <p className="text-slate-200 text-sm font-medium">Color Theme</p>
              <p className="text-slate-500 text-xs">Currently using {theme} mode</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-teal-500' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-slate-200 font-bold text-lg">TrustLabel</h2>
            <p className="text-slate-500 text-sm">Version 1.0.0 · SIH 2026</p>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              AI-powered food label compliance verification for FSSAI regulations.
              Designed for Smart India Hackathon 2026.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-navy-600 grid grid-cols-2 gap-3">
          {[
            { label: 'Backend', value: 'Flask + SQLite' },
            { label: 'OCR Engine', value: 'Tesseract 5.x' },
            { label: 'Frontend', value: 'React 18 + Vite' },
            { label: 'Compliance', value: 'FSSAI 2020 v1.0' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-navy-900 rounded-lg p-3 border border-navy-600">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-slate-200 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="card border border-amber-500/20 bg-amber-500/5">
        <p className="text-amber-300 text-sm leading-relaxed">
          <strong>Disclaimer:</strong> TrustLabel is a prototype. Compliance findings are based on automated OCR and rule checks.
          Always verify results with a qualified food safety professional before taking regulatory action.
        </p>
      </div>
    </div>
  )
}
