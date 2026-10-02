import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Receipt,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { CATEGORIAS_GASTOS, type Gasto } from '../../../types/gastos'
import GastoModal from '../../../components/Admin/GastoModal'
import ConfirmModal from '../../../components/Admin/ConfirmModal'

export default function AdminGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS')

  // Modales State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [gastoToEdit, setGastoToEdit] = useState<Gasto | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [gastoToDelete, setGastoToDelete] = useState<Gasto | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const fetchGastos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false })

      if (supabaseError) throw supabaseError

      setGastos(data || [])
    } catch (err: unknown) {
      console.error('Error al cargar gastos:', err)
      const msg = err instanceof Error ? err.message : 'No se pudieron obtener los gastos.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGastos()
  }, [fetchGastos])

  // Abrir Modal en modo Crear
  const handleOpenCreateModal = () => {
    setGastoToEdit(null)
    setIsModalOpen(true)
  }

  // Abrir Modal en modo Editar
  const handleOpenEditModal = (gasto: Gasto) => {
    setGastoToEdit(gasto)
    setIsModalOpen(true)
  }

  // Confirmar Eliminación de Gasto
  const handleConfirmDelete = async () => {
    if (!gastoToDelete) return

    try {
      setIsDeleting(true)
      const { error: deleteError } = await supabase
        .from('gastos')
        .delete()
        .eq('id', gastoToDelete.id)

      if (deleteError) throw deleteError

      setIsDeleteModalOpen(false)
      setGastoToDelete(null)
      fetchGastos()
    } catch (err: unknown) {
      console.error('Error eliminando gasto:', err)
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el registro de gasto.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtrado de gastos
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const matchSearch =
        g.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.categoria.toLowerCase().includes(searchQuery.toLowerCase())

      const matchCategory =
        selectedCategoria === 'TODAS' || g.categoria === selectedCategoria

      return matchSearch && matchCategory
    })
  }, [gastos, searchQuery, selectedCategoria])

  // KPIs
  // 1. Total Gastos Mes Actual
  const totalMesActual = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed

    return gastos.reduce((acc, g) => {
      if (!g.fecha) return acc
      const [y, m] = g.fecha.split('-').map(Number)
      if (y === currentYear && m === currentMonth) {
        return acc + Number(g.monto)
      }
      return acc
    }, 0)
  }, [gastos])

  // 2. Categoría con Mayor Gasto Total
  const categoriaMayorGasto = useMemo(() => {
    if (gastos.length === 0) return { nombre: 'N/A', total: 0 }

    const totalesPorCategoria: Record<string, number> = {}
    gastos.forEach((g) => {
      totalesPorCategoria[g.categoria] =
        (totalesPorCategoria[g.categoria] || 0) + Number(g.monto)
    })

    let maxCat = 'N/A'
    let maxVal = 0
    Object.entries(totalesPorCategoria).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val
        maxCat = cat
      }
    })

    return { nombre: maxCat, total: maxVal }
  }, [gastos])

  // 3. Total Acumulado Histórico
  const totalAcumulado = useMemo(() => {
    return gastos.reduce((acc, g) => acc + Number(g.monto), 0)
  }, [gastos])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            <h1 className="font-display text-2xl font-bold text-on-surface tracking-wide">
              Gastos Operativos
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Control de costos recurrentes de telefonía, transporte, papelería y publicidad en Jhaular.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchGastos}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Actualizar datos de Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 transition-all shadow-md cursor-pointer font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Gastos Mes Actual */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Gastos Mes Actual
            </p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">
              {formatCurrency(totalMesActual)}
            </p>
          </div>
        </div>

        {/* Card 2: Categoría Mayor Gasto */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Categoría Principal
            </p>
            <p className="text-base font-bold text-on-surface mt-0.5 truncate max-w-[170px]">
              {categoriaMayorGasto.nombre}
            </p>
            {categoriaMayorGasto.total > 0 && (
              <p className="text-[11px] font-mono text-on-surface-variant/70">
                {formatCurrency(categoriaMayorGasto.total)}
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Acumulado Histórico */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
            <DollarSign className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Total Histórico ({gastos.length})
            </p>
            <p className="text-xl font-bold text-on-surface mt-0.5">
              {formatCurrency(totalAcumulado)}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descripción o categoría..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-all"
          />
        </div>

        {/* Filter Select */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
          <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="bg-transparent text-on-surface text-xs focus:outline-none font-medium cursor-pointer"
          >
            <option value="TODAS" className="bg-surface-container-low text-on-surface">
              Todas las Categorías
            </option>
            {CATEGORIAS_GASTOS.map((cat) => (
              <option key={cat} value={cat} className="bg-surface-container-low text-on-surface">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gastos Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">
              Cargando gastos desde Supabase...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-error/5 border-l-4 border-error space-y-2">
            <p className="text-sm font-semibold text-error">Error de Conexión</p>
            <p className="text-xs text-on-surface-variant">{error}</p>
            <button
              onClick={fetchGastos}
              className="mt-2 inline-flex items-center space-x-2 px-3 py-1.5 rounded text-xs bg-error text-on-error font-semibold"
            >
              Reintentar
            </button>
          </div>
        ) : gastosFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
            <p className="text-sm font-medium text-on-surface">No se encontraron gastos</p>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              {searchQuery || selectedCategoria !== 'TODAS'
                ? 'Prueba modificando tus filtros de búsqueda.'
                : 'No hay gastos registrados. ¡Haz clic en "Registrar Gasto" para añadir el primero!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3.5 px-4 font-semibold">Fecha</th>
                  <th className="py-3.5 px-4 font-semibold">Categoría</th>
                  <th className="py-3.5 px-4 font-semibold">Descripción</th>
                  <th className="py-3.5 px-4 font-semibold">Monto (COP)</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {gastosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                    {/* Fecha */}
                    <td className="py-3.5 px-4 font-mono font-medium text-on-surface-variant">
                      {formatDate(item.fecha)}
                    </td>

                    {/* Categoría Badge */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wide bg-amber-950/60 text-amber-300 border border-amber-800/40 font-medium">
                        <span>{item.categoria}</span>
                      </span>
                    </td>

                    {/* Descripción con enlace a comprobante */}
                    <td className="py-3.5 px-4 font-medium text-on-surface">
                      <div className="flex items-center space-x-2">
                        <span>{item.descripcion}</span>
                        {item.comprobante_url && (
                          <a
                            href={item.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-surface-container-high text-emerald-400 hover:text-emerald-300 transition-all inline-flex items-center"
                            title="Ver comprobante"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Monto */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {formatCurrency(item.monto)}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">

                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-amber-400 hover:bg-surface-container-high transition-all cursor-pointer"
                          title="Editar gasto"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => {
                            setGastoToDelete(item)
                            setIsDeleteModalOpen(true)
                          }}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/15 transition-all cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
            <span>
              Mostrando {gastosFiltrados.length} de {gastos.length} gastos operativos
            </span>
            <span className="text-amber-400 font-semibold">Modulo Gastos Jhaular Admin</span>
          </div>
        )}
      </div>

      {/* Modal Registrar / Editar Gasto */}
      <GastoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGastos}
        gastoAEditar={gastoToEdit}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setGastoToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar registro de gasto?"
        message={`Se eliminará el gasto "${gastoToDelete?.descripcion || ''}" de ${formatCurrency(gastoToDelete?.monto || 0)}.`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
