import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, UserCheck, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../ThemeToggle'

export default function Topbar() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email)
      }
    })
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      navigate('/admin/login', { replace: true })
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="h-16 bg-surface-container-lowest/80 backdrop-blur border-b border-outline-variant/30 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Title / Breadcrumb context */}
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider font-semibold bg-secondary/15 text-secondary border border-secondary/30">
          <Shield className="w-3 h-3" />
          Panel Admin
        </span>
        <span className="text-on-surface-variant/40">/</span>
        <h2 className="text-sm font-medium text-on-surface">Gestión Jhaular</h2>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Badge */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-xs">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-on-surface font-medium max-w-[200px] truncate">
            {userEmail || 'Administrador'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 uppercase">
            ADMIN
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-error bg-error/10 hover:bg-error/20 border border-error/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
          title="Cerrar sesión de administrador"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </header>
  )
}
