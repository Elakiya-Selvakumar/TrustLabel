import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, Clock, BookOpen,
  FileText, Settings, ShieldCheck, ChevronLeft, Menu, X,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inspection/new', icon: PlusCircle, label: 'New Inspection' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/rules', icon: BookOpen, label: 'Compliance Rules' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden bg-navy-800 border border-navy-600 p-2 rounded-lg text-slate-400 hover:text-teal-400"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 bg-navy-800 border-r border-navy-600
          flex flex-col transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-600">
          <div className="flex-shrink-0 w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-white font-bold text-base leading-tight block">TrustLabel</span>
              <span className="text-slate-500 text-xs">FSSAI Inspector</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-navy-600">
          {!collapsed && (
            <div className="text-xs text-slate-500 text-center mb-3">v1.0.0 · SIH 2026</div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex nav-item w-full justify-center"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>
    </>
  )
}
