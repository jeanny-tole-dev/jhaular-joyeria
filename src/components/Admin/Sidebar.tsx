import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  Hammer,
  Receipt,
  Settings,
  Gem,
  ShieldCheck,
  QrCode,
  Scale,
  Calculator
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
  badge?: string
}

const navItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/inventario', label: 'Inventario', icon: Boxes },
  { to: '/admin/catalogo', label: 'Catálogo', icon: Gem },
  { to: '/admin/ventas', label: 'Ventas', icon: TrendingUp },
  { to: '/admin/produccion', label: 'Producción', icon: Hammer },
  { to: '/admin/gastos', label: 'Gastos', icon: Receipt },
  { to: '/admin/contabilidad', label: 'Contabilidad', icon: Scale },
  { to: '/admin/proyeccion', label: 'Proyección', icon: Calculator },
  { to: '/admin/certificados', label: 'Certificados & Lotes', icon: ShieldCheck },
  { to: '/admin/qr-whatsapp', label: 'QR Infinito WhatsApp', icon: QrCode, badge: 'NUEVO' },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-outline-variant/20 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-sm">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-wider text-on-surface">JHAULAR</h1>
            <p className="text-[10px] font-mono tracking-widest text-secondary uppercase font-semibold">
              Admin & Craft
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 py-2 text-[10px] font-mono tracking-widest text-on-surface-variant/60 uppercase">
            Navegación Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-secondary/15 text-secondary font-semibold border-l-2 border-secondary shadow-inner'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-secondary' : 'text-on-surface-variant/70 group-hover:text-on-surface'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Footer / Status */}
      <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest/50">
        <div className="flex items-center space-x-2 text-xs text-on-surface-variant/70">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[11px]">Sistema Conectado (Supabase)</span>
        </div>
      </div>
    </aside>
  )
}
