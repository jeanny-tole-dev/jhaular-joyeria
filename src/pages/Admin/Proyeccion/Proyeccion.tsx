import { useState, useMemo } from 'react'
import { TrendingUp, Target, Boxes, Calculator } from 'lucide-react'

export default function AdminProyeccion() {
  const [metaVentasMensual, setMetaVentasMensual] = useState<number>(30000000)
  const [precioPromedioJoya, setPrecioPromedioJoya] = useState<number>(380000)
  const [costoMaterialesUnidad, setCostoMaterialesUnidad] = useState<number>(145000)

  // Cálculos de Proyección
  const unidadesNecesarias = useMemo(() => {
    return Math.ceil(metaVentasMensual / Math.max(1, precioPromedioJoya))
  }, [metaVentasMensual, precioPromedioJoya])

  const presupuestoInsumosRequeridos = useMemo(() => {
    return unidadesNecesarias * costoMaterialesUnidad
  }, [unidadesNecesarias, costoMaterialesUnidad])

  const gananciaProyectada = useMemo(() => {
    return metaVentasMensual - presupuestoInsumosRequeridos
  }, [metaVentasMensual, presupuestoInsumosRequeridos])

  const margenProyectadoPct = useMemo(() => {
    return Math.round((gananciaProyectada / Math.max(1, metaVentasMensual)) * 100)
  }, [gananciaProyectada, metaVentasMensual])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-secondary" />
          Proyección de Ventas y Reabastecimiento
        </h1>
        <p className="text-xs text-on-surface-variant">
          Simulador de metas comerciales, insumos requeridos y planificación de lotes de producción.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Controles / Parámetros */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
          <h2 className="text-sm font-bold text-on-surface font-mono uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-secondary" />
            Parámetros del Simulador
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Meta de Facturación Mensual (COP)
              </label>
              <input
                type="number"
                step="1000000"
                value={metaVentasMensual}
                onChange={(e) => setMetaVentasMensual(Number(e.target.value))}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono font-bold focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Precio Promedio de Venta por Joya (COP)
              </label>
              <input
                type="number"
                step="10000"
                value={precioPromedioJoya}
                onChange={(e) => setPrecioPromedioJoya(Number(e.target.value))}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono font-bold focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant font-mono mb-1">
                Costo Promedio de Insumos por Joya (COP)
              </label>
              <input
                type="number"
                step="5000"
                value={costoMaterialesUnidad}
                onChange={(e) => setCostoMaterialesUnidad(Number(e.target.value))}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface font-mono font-bold focus:outline-none focus:border-secondary"
              />
            </div>
          </div>
        </div>

        {/* Resultados de la Proyección */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-6">
          <h2 className="text-sm font-bold text-on-surface font-mono uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Resultados de la Planificación
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">Unidades a Fabricar</span>
              <p className="text-2xl font-bold text-on-surface font-mono">{unidadesNecesarias} piezas</p>
              <p className="text-[10px] text-on-surface-variant font-mono">Para cumplir meta</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">Presupuesto Insumos</span>
              <p className="text-2xl font-bold text-amber-400 font-mono">
                ${presupuestoInsumosRequeridos.toLocaleString('es-CO')}
              </p>
              <p className="text-[10px] text-on-surface-variant font-mono">Compra de oro / hilos / gemas</p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">Ganancia Bruta</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                ${gananciaProyectada.toLocaleString('es-CO')}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono font-bold">Margen: {margenProyectadoPct}%</p>
            </div>
          </div>

          {/* Requerimientos Estimados de Materia Prima */}
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3">
            <h3 className="text-xs font-mono font-bold text-on-surface uppercase flex items-center gap-2">
              <Boxes className="w-4 h-4 text-secondary" />
              Insumos Estimados Necesarios para el Lote
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                <p className="text-on-surface-variant text-[10px] font-mono">Balines Oro 18K (#4)</p>
                <p className="font-bold font-mono text-on-surface text-sm">{unidadesNecesarias * 4} unidades</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                <p className="text-on-surface-variant text-[10px] font-mono">Esmeraldas Muzo Certificadas</p>
                <p className="font-bold font-mono text-on-surface text-sm">{unidadesNecesarias * 1} piedras</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                <p className="text-on-surface-variant text-[10px] font-mono">Hilo Fino Calibre T70</p>
                <p className="font-bold font-mono text-on-surface text-sm">{(unidadesNecesarias * 1.2).toFixed(1)} metros</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
