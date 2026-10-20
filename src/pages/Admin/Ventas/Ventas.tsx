import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Search,
  ShoppingBag,
  Clock,
  RefreshCw,
  Phone,
  DollarSign
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export interface Pedido {
  id: string
  pedido_code: string
  nombre_cliente: string
  telefono_cliente: string
  direccion_entrega?: string
  ciudad?: string
  total: number
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'EN_PRODUCCION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'
  canal: 'WHATSAPP' | 'WEB' | 'INSTAGRAM' | 'LOCAL'
  created_at: string
  items_resumen?: string
}

export default function AdminVentas() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')

  const cargarPedidos = async () => {
    setLoading(true)
    setErrorCarga(null)
    try {
      const { data, error } = await (supabase.from as any)('pedidos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setPedidos([])
        setErrorCarga('No se pudieron cargar los pedidos.')
        return
      }

      setPedidos((data as Pedido[]) || [])
    } catch {
      setPedidos([])
      setErrorCarga('No se pudieron cargar los pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPedidos()
  }, [])

  // Cambiar Estado del Pedido
  const handleCambiarEstado = async (id: string, nuevoEstado: Pedido['estado']) => {
    const anterior = pedidos
    setPedidos(pedidos.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)))
    setErrorCarga(null)

    const { error } = await (supabase.from as any)('pedidos').update({ estado: nuevoEstado }).eq('id', id)
    if (error) {
      setPedidos(anterior)
      setErrorCarga('No se pudo actualizar el estado del pedido.')
    }
  }

  // Filtrado
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const cumpleBusqueda =
        p.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.pedido_code.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.telefono_cliente.includes(busqueda)
      const cumpleEstado = filtroEstado === 'TODOS' || p.estado === filtroEstado
      return cumpleBusqueda && cumpleEstado
    })
  }, [pedidos, busqueda, filtroEstado])

  // KPIs
  const totalVentasCop = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((acc, p) => acc + (p.total || 0), 0)
  }, [pedidos])

  const ticketPromedio = useMemo(() => {
    const validos = pedidos.filter((p) => p.estado !== 'CANCELADO')
    return validos.length > 0 ? Math.round(totalVentasCop / validos.length) : 0
  }, [pedidos, totalVentasCop])

  const pendientesCount = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO').length
  }, [pedidos])

  const getBadgeColor = (estado: Pedido['estado']) => {
    switch (estado) {
      case 'ENTREGADO':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'ENVIADO':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'EN_PRODUCCION':
      case 'CONFIRMADO':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'PENDIENTE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'CANCELADO':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-secondary" />
            Gestión de Ventas y Pedidos
          </h1>
          <p className="text-xs text-on-surface-variant">
            Seguimiento en tiempo real de órdenes de clientes, canales de venta y estados de despacho.
          </p>
        </div>
        <button
          onClick={cargarPedidos}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg border border-outline-variant/30 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </div>

      {errorCarga && pedidos.length > 0 && (
        <p className="text-xs font-mono text-rose-400">{errorCarga}</p>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Ventas Totales</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-mono">
            ${totalVentasCop.toLocaleString('es-CO')}
          </p>
          <p className="text-[11px] text-on-surface-variant font-mono">
            Suma de pedidos no cancelados
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Pedidos Registrados</span>
            <ShoppingBag className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-mono">{pedidos.length}</p>
          <p className="text-[11px] text-on-surface-variant font-mono">Órdenes activas en sistema</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Ticket Promedio</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-mono">
            ${ticketPromedio.toLocaleString('es-CO')}
          </p>
          <p className="text-[11px] text-on-surface-variant font-mono">Valor medio por pedido</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="text-xs font-mono tracking-wider uppercase">Por Despachar</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-on-surface font-mono">{pendientesCount}</p>
          <p className="text-[11px] text-purple-400 font-mono">Requieren atención prioritaria</p>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, código o teléfono..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['TODOS', 'PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all font-mono whitespace-nowrap ${
                filtroEstado === st
                  ? 'bg-secondary text-on-secondary font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low/50 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Código / Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Resumen Ítems</th>
                <th className="py-3 px-4">Total COP</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs">
              {pedidosFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-on-surface">{p.pedido_code}</p>
                    <p className="text-[10px] text-on-surface-variant/70 font-mono">
                      {new Date(p.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-on-surface">{p.nombre_cliente}</p>
                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                      <Phone className="w-3 h-3 text-secondary" /> {p.telefono_cliente}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-container-high text-on-surface border border-outline-variant/30">
                      {p.canal}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant max-w-xs truncate">
                    {p.items_resumen || 'Sin detalle de piezas'}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                    ${p.total.toLocaleString('es-CO')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getBadgeColor(
                        p.estado
                      )}`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={p.estado}
                      onChange={(e) => handleCambiarEstado(p.id, e.target.value as Pedido['estado'])}
                      className="bg-surface-container-low text-on-surface text-[11px] font-mono py-1 px-2 rounded border border-outline-variant/30 focus:outline-none focus:border-secondary"
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="CONFIRMADO">CONFIRMADO</option>
                      <option value="EN_PRODUCCION">EN PRODUCCIÓN</option>
                      <option value="ENVIADO">ENVIADO</option>
                      <option value="ENTREGADO">ENTREGADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </td>
                </tr>
              ))}
              {pedidosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant text-xs font-mono">
                    {errorCarga
                      ? errorCarga
                      : pedidos.length === 0
                        ? 'No hay pedidos registrados.'
                        : 'No se encontraron pedidos que coincidan con los filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
