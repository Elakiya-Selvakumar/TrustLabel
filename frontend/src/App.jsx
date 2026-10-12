import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewInspection from './pages/NewInspection.jsx'
import InspectionDetail from './pages/InspectionDetail.jsx'
import History from './pages/History.jsx'
import Reports from './pages/Reports.jsx'
import ComplianceRules from './pages/ComplianceRules.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspection/new" element={<NewInspection />} />
        <Route path="/inspection/:id" element={<InspectionDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/rules" element={<ComplianceRules />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}
