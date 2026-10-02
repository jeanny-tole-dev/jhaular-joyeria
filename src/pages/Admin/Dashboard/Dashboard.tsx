import { Link } from 'react-router-dom'
import {
  QrCode,
  Boxes,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Gem,
  Smartphone
} from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-outline-variant/30 pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Gem className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">
              Panel de Control Principal
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Bienvenido al Atelier de Administración Jhaular
            </p>
          </div>
        </div>
      </div>

      {/* BANNER DESTACADO: MOSTRAR ACCESO DIRECTO AL QR INFINITO */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-surface-container-lowest to-surface-container-lowest border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
            <Smartphone className="w-3 h-3" />
            <span>MÓDULO NUEVO DESTACADO</span>
          </div>
          <h2 className="text-lg font-bold font-display text-on-surface">
            QR Infinito de WhatsApp Maestro
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Genera un código QR dinámico maestro en alta resolución (2000x2000px PNG) para imprenta. Cambia el número de teléfono o el mensaje predeterminado en cualquier momento sin volver a imprimir el sticker.
          </p>
        </div>

        <Link
          to="/admin/qr-whatsapp"
          className="shrink-0 px-5 py-3 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 flex items-center space-x-2 group z-10"
        >
          <QrCode className="w-4 h-4" />
          <span>Ir al Módulo QR Infinito</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* GRID DE MÓDULOS DEL PANEL ADMIN */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-on-surface-variant">
          Accesos Rápidos a Módulos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card: QR Infinito WhatsApp */}
          <Link
            to="/admin/qr-whatsapp"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-amber-500/40 hover:border-amber-400 transition-all duration-300 space-y-3 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                Activo
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-amber-300 transition-colors">
                QR Infinito de WhatsApp
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Generador de QR dinámico, descarga PNG HD y analíticas de escaneo.
              </p>
            </div>
          </Link>

          {/* Card: Catálogo */}
          <Link
            to="/admin/catalogo"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary transition-all duration-300 space-y-3 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary border border-secondary/30">
                <Gem className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors">
                Gestión de Catálogo BOM
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Creación de productos con calculadora de costos de materiales e insumos.
              </p>
            </div>
          </Link>

          {/* Card: Certificados */}
          <Link
            to="/admin/certificados"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary transition-all duration-300 space-y-3 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-emerald-300 transition-colors">
                Certificados de Autenticidad
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Verificación de lotes de balines en Oro 18K y esmeraldas naturales.
              </p>
            </div>
          </Link>

          {/* Card: Inventario */}
          <Link
            to="/admin/inventario"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary transition-all duration-300 space-y-3 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-blue-300 transition-colors">
                Inventario de Insumos
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Control de stock de balines, esmeraldas, hilos y empaques.
              </p>
            </div>
          </Link>

          {/* Card: Ventas */}
          <Link
            to="/admin/ventas"
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-secondary transition-all duration-300 space-y-3 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface group-hover:text-purple-300 transition-colors">
                Registro de Ventas
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Historial de pedidos, clientes y facturas emitidas.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
