import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-navy-900 dark:bg-navy-900 flex">
      <Sidebar />
      {/* Main area — offset for sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 transition-all duration-300">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
