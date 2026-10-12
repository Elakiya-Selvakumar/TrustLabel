import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getStats, getInspections } from '../api/api.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, review: 0, pending: 0 })
  const [inspections, setInspections] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [inspectionsLoading, setInspectionsLoading] = useState(true)

  const refreshStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const data = await getStats()
      setStats(data)
    } catch {
      // silently fail — API may not be running yet
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const refreshInspections = useCallback(async () => {
    try {
      setInspectionsLoading(true)
      const data = await getInspections()
      setInspections(data)
    } catch {
      setInspections([])
    } finally {
      setInspectionsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
    refreshInspections()
  }, [refreshStats, refreshInspections])

  return (
    <AppContext.Provider value={{
      stats, statsLoading, refreshStats,
      inspections, inspectionsLoading, refreshInspections,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
