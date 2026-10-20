import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  RefreshCw,
  Wallet
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const CATEGORIAS_LOGISTICA = ['Papelería/Empaques', 'Transporte']

function dinero(valor: number) {
  return `$${valor.toLocaleString('es-CO')}`
}

export default function AdminContabilidad() {
  const [gastos, setGastos] = useState<{ monto?: number | null; categoria?: string | null }[]>([])
  const [costoFacturasMaterial, setCostoFacturasMaterial] = useState(0)
  const [totalIngresosVentas, setTotalIngresosVentas] = useState(0)
  const [pedidosContados, setPedidosContados] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const cargarBalance = async () => {
    setLoading(true)
    setErrorCarga(null)
    try {
      const [gastosRes, lotesRes, pedidosRes] = await Promise.all([
        supabase.from('gastos').select('monto, categoria'),
        supabase.from('lotes_materiales').select('costo_total'),
        (supabase.from as any)('pedidos').select('total, estado')
      ])

      if (gastosRes.error || lotesRes.error || pedidosRes.error) {
        setErrorCarga('No se pudo cargar todo el balance. Las cifras que faltan quedan en cero.')
      }

      setGastos(gastosRes.data || [])
      setCostoFacturasMaterial(
        (lotesRes.data || []).reduce((acc, lote) => acc + (Number(lote.costo_total) || 0), 0)
      )

      const pedidos = ((pedidosRes.data || []) as { total?: number | null; estado?: string | null }[])
        .filter((pedido) => pedido.estado !== 'CANCELADO')
      setPedidosContados(pedidos.length)
      setTotalIngresosVentas(pedidos.reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0))
    } catch {
      setGastos([])
      setCostoFacturasMaterial(0)
      setTotalIngresosVentas(0)
      setPedidosContados(0)
      setErrorCarga('No se pudo cargar el balance.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarBalance()
  }, [])

  const totalGastosMateriaPrima = costoFacturasMaterial
  const totalManoObraArtesanal = 0
  const totalGastosOperativos = useMemo(() => {
    return gastos
      .filter((gasto) => CATEGORIAS_LOGISTICA.includes(gasto.categoria || ''))
      .reduce((acc, gasto) => acc + (Number(gasto.monto) || 0), 0)
  }, [gastos])
  const totalOtrosGastos = useMemo(() => {
    return gastos
      .filter((gasto) => !CATEGORIAS_LOGISTICA.includes(gasto.categoria || ''))
      .reduce((acc, gasto) => acc + (Number(gasto.monto) || 0), 0)
  }, [gastos])

  const totalEgresos = totalGastosMateriaPrima + totalManoObraArtesanal + totalGastosOperativos + totalOtrosGastos
  const utilidadNeta = totalIngresosVentas - totalEgresos
  const margenUtilidadPct = totalIngresosVentas > 0
    ? Math.round((utilidadNeta / totalIngresosVentas) * 100)
    : 0
  const precioPromedio = pedidosContados > 0 ? Math.round(totalIngresosVentas / pedidosContados) : null
  const retornoMaterial = totalGastosMateriaPrima > 0 && totalIngresosVentas > 0
    ? `${(totalIngresosVentas / totalGastosMateriaPrima).toFixed(2)}x`
    : 'Sin datos'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
            <Scale className="w-6 h-6 text-secondary" />
            Balance Contable & Finanzas
          </h1>
          <p className="text-xs text-on-surface-variant">
            Estado de resultados, desglose de costos de materia prima (Oro/Esmeraldas) y margen neto.
          </p>
        </div>
        <button
          onClick={cargarBalance}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalcular Balance
        </button>
      </div>

      {errorCarga && (
        <p className="text-xs font-mono text-rose-400">{errorCarga}</p>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Ingresos Brutos (Ventas)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400 font-mono">
            {dinero(totalIngresosVentas)} COP
          </p>
          <p className="text-[11px] text-on-surface-variant font-mono">
            {pedidosContados > 0 ? `${pedidosContados} pedidos no cancelados` : 'Sin ventas registradas'}
          </p>
        </div>

        {/* Total Egresos */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Costos & Egresos Totales</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-400 font-mono">
            {dinero(totalEgresos)} COP
          </p>
          <p className="text-[11px] text-on-surface-variant font-mono">Insumos + Artesanía + Operación</p>
        </div>

        {/* Utilidad Neta */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-secondary/40 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -z-0" />
          <div className="flex justify-between items-center text-on-surface-variant z-10 relative">
            <span className="text-xs font-mono tracking-wider uppercase text-secondary">Utilidad Neta Libre</span>
            <Wallet className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-on-surface font-mono z-10 relative">
            {dinero(utilidadNeta)} COP
          </p>
          <p className="text-xs font-mono font-bold text-secondary z-10 relative">
            Margen Neto: {margenUtilidadPct}%
          </p>
        </div>
      </div>

      {/* Breakdown Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose de Egresos */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
          <h2 className="text-sm font-bold text-on-surface font-mono uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-secondary" />
            Desglose de Costos de Producción
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <div>
                <p className="font-semibold text-on-surface">Materia Prima e Insumos (Oro / Esmeraldas / Hilo)</p>
                <p className="text-[10px] text-on-surface-variant">Suma de facturas de lotes de materiales</p>
              </div>
              <p className="font-mono font-bold text-on-surface">{dinero(totalGastosMateriaPrima)}</p>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <div>
                <p className="font-semibold text-on-surface">Mano de Obra Artesanal (Pago a Orfebres)</p>
                <p className="text-[10px] text-on-surface-variant">Aún no hay una cuenta de mano de obra registrada</p>
              </div>
              <p className="font-mono font-bold text-on-surface">{dinero(totalManoObraArtesanal)}</p>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <div>
                <p className="font-semibold text-on-surface">Empaques, Envíos y Logística</p>
                <p className="text-[10px] text-on-surface-variant">Gastos de papelería, empaques y transporte</p>
              </div>
              <p className="font-mono font-bold text-on-surface">{dinero(totalGastosOperativos)}</p>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <div>
                <p className="font-semibold text-on-surface">Otros gastos registrados</p>
                <p className="text-[10px] text-on-surface-variant">Telefonía, publicidad y el resto de gastos</p>
              </div>
              <p className="font-mono font-bold text-on-surface">{dinero(totalOtrosGastos)}</p>
            </div>
          </div>
        </div>

        {/* Indicadores Clave de Rentabilidad */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
          <h2 className="text-sm font-bold text-on-surface font-mono uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Indicadores de Rentabilidad Orfebre
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex justify-between items-center">
              <span>Retorno sobre Inversión de Materiales (ROI Material)</span>
              <span className="font-mono font-bold text-emerald-400">{retornoMaterial}</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex justify-between items-center">
              <span>Costo Promedio de Fabricación por Joya</span>
              <span className="font-mono font-bold text-on-surface">Sin datos</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex justify-between items-center">
              <span>Precio Promedio de Venta al Público</span>
              <span className="font-mono font-bold text-on-surface">
                {precioPromedio === null ? 'Sin datos' : `${dinero(precioPromedio)} COP`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
