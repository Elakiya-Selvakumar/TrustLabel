import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Sun, Moon, PlusCircle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/inspection/new': 'New Inspection',
  '/history': 'Inspection History',
  '/rules': 'Compliance Rules',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'TrustLabel'

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/history?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="h-14 bg-navy-800 border-b border-navy-600 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Page title */}
      <h1 className="text-slate-100 font-semibold text-base hidden md:block min-w-max">
        {title}
      </h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-0 md:ml-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search inspections..."
            className="input-field pl-9 py-1.5 text-sm"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-ghost p-2 rounded-lg"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* New Inspection CTA */}
        <button
          onClick={() => navigate('/inspection/new')}
          className="btn-primary"
        >
          <PlusCircle size={16} />
          <span className="hidden sm:inline">New Inspection</span>
        </button>
      </div>
    </header>
  )
}
