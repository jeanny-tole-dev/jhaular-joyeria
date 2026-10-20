import { useState, useEffect } from 'react'
import { Settings, Save, Phone, CheckCircle2, Bell } from 'lucide-react'

export default function AdminConfiguracion() {
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('+57 312 456 7890')
  const [mensajeBienvenida, setMensajeBienvenida] = useState('¡Hola! Me interesa conocer más sobre las joyas sagradas de Jhaular.')
  const [stockMinimoAlerta, setStockMinimoAlerta] = useState<number>(10)
  const [gastosPorcentajeDefault, setGastosPorcentajeDefault] = useState<number>(10)
  const [saved, setSaved] = useState(false)

  // Cargar Configuración existente
  useEffect(() => {
    const local = localStorage.getItem('jhaular_config_general')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        if (parsed.telefonoWhatsapp) setTelefonoWhatsapp(parsed.telefonoWhatsapp)
        if (parsed.mensajeBienvenida) setMensajeBienvenida(parsed.mensajeBienvenida)
        if (parsed.stockMinimoAlerta) setStockMinimoAlerta(parsed.stockMinimoAlerta)
        if (parsed.gastosPorcentajeDefault) setGastosPorcentajeDefault(parsed.gastosPorcentajeDefault)
      } catch {
        // ignore
      }
    }
  }, [])

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault()
    const configData = {
      telefonoWhatsapp,
      mensajeBienvenida,
      stockMinimoAlerta,
      gastosPorcentajeDefault
    }
    localStorage.setItem('jhaular_config_general', JSON.stringify(configData))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
          <Settings className="w-6 h-6 text-secondary" />
          Configuración General del Sistema
        </h1>
        <p className="text-xs text-on-surface-variant">
          Parámetros globales de contacto, alertas de stock mínimo y preferencias de costo.
        </p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {/* Canales de Comunicación */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
          <h2 className="text-sm font-bold text-on-surface font-mono uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-secondary" />
            Canal de Ventas WhatsApp
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Número Telefónico Principal WhatsApp
              </label>
              <input
                type="text"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Mensaje Predeterminado al Iniciar Chat
              </label>
              <textarea
                rows={2}
                value={mensajeBienvenida}
                onChange={(e) => setMensajeBienvenida(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface text-xs focus:outline-none focus:border-secondary"
              />
            </div>
          </div>
        </div>

        {/* Parámetros de Operación & Alertas */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
          <h2 className="text-sm font-bold text-on-surface font-mono uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Alertas de Inventario & Costos Predeterminados
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Umbral de Alerta Stock Mínimo (Unidades)
              </label>
              <input
                type="number"
                value={stockMinimoAlerta}
                onChange={(e) => setStockMinimoAlerta(Number(e.target.value))}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono focus:outline-none focus:border-secondary"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Genera alerta cuando un material cae por debajo de este límite.
              </p>
            </div>

            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Porcentaje de Gastos Operativos por Defecto (%)
              </label>
              <input
                type="number"
                value={gastosPorcentajeDefault}
                onChange={(e) => setGastosPorcentajeDefault(Number(e.target.value))}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono focus:outline-none focus:border-secondary"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Aplicado automáticamente en la Calculadora de Costos BOM.
              </p>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary font-mono text-xs font-bold rounded-lg hover:bg-secondary/90 transition-all shadow-md"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Configuración guardada correctamente
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
