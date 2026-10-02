import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Admin/Sidebar'
import Topbar from '../../components/Admin/Topbar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
