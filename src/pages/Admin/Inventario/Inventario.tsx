import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Boxes,
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  Tag,
  DollarSign,
  PackageCheck,
  Filter,
  CheckCircle2,
  FileText,
  Pencil,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Material } from '../../../types/materiales'
import MaterialModal from '../../../components/Admin/MaterialModal'
import FacturaModal from '../../../components/Admin/FacturaModal'
import ConfirmModal from '../../../components/Admin/ConfirmModal'

export default function AdminInventario() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS')
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false)

  // Modales State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null)

  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false)
  const [facturaMaterialId, setFacturaMaterialId] = useState<string | undefined>(undefined)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchMateriales = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre', { ascending: true })

      if (supabaseError) {
        throw supabaseError
      }

      setMateriales(data || [])
    } catch (err: unknown) {
      console.error('Error al cargar inventario:', err)
      const msg = err instanceof Error ? err.message : 'No se pudieron obtener los materiales.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMateriales()
  }, [fetchMateriales])

  // Handlers para Abrir Modales
  const handleOpenCreateModal = () => {
    setMaterialToEdit(null)
    setIsMaterialModalOpen(true)
  }

  const handleOpenEditModal = (material: Material) => {
    setMaterialToEdit(material)
    setIsMaterialModalOpen(true)
  }

  const handleOpenFacturaModal = (materialId?: string) => {
    setFacturaMaterialId(materialId)
    setIsFacturaModalOpen(true)
  }

  const handleOpenDeleteModal = (material: Material) => {
    setMaterialToDelete(material)
    setIsDeleteModalOpen(true)
  }

  // Handler de Eliminación
  const handleConfirmDelete = async () => {
    if (!materialToDelete) return

    try {
      setIsDeleting(true)
      const { error: deleteError } = await supabase
        .from('materiales')
        .delete()
        .eq('id', materialToDelete.id)

      if (deleteError) throw deleteError

      setIsDeleteModalOpen(false)
      setMaterialToDelete(null)
      fetchMateriales()
    } catch (err: unknown) {
      console.error('Error al eliminar material:', err)
      alert(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el material. Verifica si tiene dependencias en otras tablas.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Categorías únicas
  const categorias = useMemo(() => {
    const setCat = new Set<string>()
    materiales.forEach((m) => {
      if (m.categoria) setCat.add(m.categoria)
    })
    return ['TODAS', ...Array.from(setCat)]
  }, [materiales])

  // Filtrado
  const materialesFiltrados = useMemo(() => {
    return materiales.filter((m) => {
      const matchSearch =
        m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.codigo && m.codigo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.proveedor && m.proveedor.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchCategory =
        selectedCategoria === 'TODAS' || m.categoria === selectedCategoria

      const matchLowStock = !onlyLowStock || m.stock_actual <= m.stock_minimo

      return matchSearch && matchCategory && matchLowStock
    })
  }, [materiales, searchQuery, selectedCategoria, onlyLowStock])

  // Métricas
  const totalInsumos = materiales.length
  const insumosBajoStock = useMemo(
    () => materiales.filter((m) => m.stock_actual <= m.stock_minimo).length,
    [materiales]
  )
  const valorTotalInventario = useMemo(
    () =>
      materiales.reduce(
        (acc, item) => acc + item.stock_actual * item.costo_unitario,
        0
      ),
    [materiales]
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-secondary" />
            <h1 className="font-display text-2xl font-bold text-on-surface tracking-wide">
              Inventario de Materiales e Insumos
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Gestión de insumos, costos unitarios, registro de facturas y alertas de stock Jhaular.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchMateriales}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Recargar datos de Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Botón Secundario: Registrar Factura */}
          <button
            onClick={() => handleOpenFacturaModal()}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 transition-all cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Registrar Factura</span>
          </button>

          {/* Botón Primario: Nuevo Insumo */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 transition-all shadow-md cursor-pointer font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Insumos */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface">
            <Boxes className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Total Insumos
            </p>
            <p className="text-2xl font-bold text-on-surface mt-0.5">{totalInsumos}</p>
          </div>
        </div>

        {/* Card 2: Stock Crítico */}
        <div
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-xl border shadow-sm flex items-center space-x-4 transition-all cursor-pointer ${
            onlyLowStock
              ? 'bg-error/15 border-error'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-error/50'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              insumosBajoStock > 0 ? 'bg-error/20 text-error' : 'bg-emerald-950 text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Bajo Stock Mínimo
            </p>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-2xl font-bold text-on-surface">{insumosBajoStock}</span>
              {insumosBajoStock > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-error/20 text-error border border-error/40 rounded-full animate-pulse">
                  ALERTA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Valor Estimado */}
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Valor Total Stock
            </p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">
              {formatCurrency(valorTotalInventario)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código o proveedor..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
            <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="bg-transparent text-on-surface text-xs focus:outline-none font-medium cursor-pointer"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat} className="bg-surface-container-low text-on-surface">
                  {cat === 'TODAS' ? 'Todas las Categorías' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Low Stock Filter */}
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              onlyLowStock
                ? 'bg-error/20 border-error text-error'
                : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Solo stock bajo</span>
          </button>
        </div>
      </div>

      {/* Main Materials Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">
              Cargando materiales desde Supabase...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-error/5 border-l-4 border-error space-y-2">
            <p className="text-sm font-semibold text-error">Error de Conexión</p>
            <p className="text-xs text-on-surface-variant">{error}</p>
            <button
              onClick={fetchMateriales}
              className="mt-2 inline-flex items-center space-x-2 px-3 py-1.5 rounded text-xs bg-error text-on-error font-semibold"
            >
              Reintentar
            </button>
          </div>
        ) : materialesFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PackageCheck className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
            <p className="text-sm font-medium text-on-surface">No se encontraron materiales</p>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              {searchQuery || selectedCategoria !== 'TODAS' || onlyLowStock
                ? 'Prueba modificando tus filtros o términos de búsqueda.'
                : 'No hay materiales registrados. ¡Haz clic en "Nuevo Insumo" para crear el primero!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/30 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3.5 px-4 font-semibold">Insumo / Material</th>
                  <th className="py-3.5 px-4 font-semibold">Categoría</th>
                  <th className="py-3.5 px-4 font-semibold">Costo Unitario</th>
                  <th className="py-3.5 px-4 font-semibold">Stock (Actual / Mín)</th>
                  <th className="py-3.5 px-4 font-semibold">Estado de Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {materialesFiltrados.map((item) => {
                  const esCritico = item.stock_actual <= item.stock_minimo
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-surface-container-low/60 transition-colors ${
                        esCritico ? 'bg-error/5' : ''
                      }`}
                    >
                      {/* Nombre & Código (Avatar con Inicial) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-secondary font-mono font-bold text-xs shrink-0 shadow-sm">
                            {item.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface">{item.nombre}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-on-surface-variant/70 font-mono mt-0.5">
                              {item.codigo && <span>Cód: {item.codigo}</span>}
                              {item.color && (
                                <span className="flex items-center space-x-1">
                                  <span
                                    className="w-2 h-2 rounded-full inline-block border border-white/20"
                                    style={{ backgroundColor: item.color }}
                                  ></span>
                                  <span>{item.color}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Categoría Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wide bg-surface-container-high text-on-surface border border-outline-variant/30 font-medium">
                          <Tag className="w-3 h-3 text-secondary" />
                          <span>{item.categoria || 'General'}</span>
                        </span>
                      </td>

                      {/* Costo Unitario */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {formatCurrency(item.costo_unitario)}
                        <span className="text-[10px] text-on-surface-variant/60 font-normal ml-1">
                          / {item.unidad || 'und'}
                        </span>
                      </td>

                      {/* Stock Actual vs Stock Mínimo */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono">
                          <span
                            className={`font-bold text-sm ${
                              esCritico ? 'text-error' : 'text-on-surface'
                            }`}
                          >
                            {item.stock_actual}
                          </span>
                          <span className="text-on-surface-variant/60 text-xs">
                            {' '}
                            / min {item.stock_minimo} {item.unidad}
                          </span>
                        </div>
                      </td>

                      {/* Indicador Visual / Badge Alerta */}
                      <td className="py-3.5 px-4">
                        {esCritico ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error/15 text-error border border-error/40 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>STOCK BAJO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>EN STOCK</span>
                          </span>
                        )}
                      </td>

                      {/* Proveedor con enlace a factura de respaldo en Google Drive si existe */}
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.proveedor || 'No especificado'}</span>
                          {item.imagen_url && (
                            <a
                              href={item.imagen_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-surface-container-high text-emerald-400 hover:text-emerald-300 transition-all inline-flex items-center"
                              title="Ver factura de respaldo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Columna Acciones (Editar / Eliminar) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Ingreso rápido de factura para este material */}
                          <button
                            onClick={() => handleOpenFacturaModal(item.id)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/80 hover:border hover:border-emerald-800/60 transition-all cursor-pointer"
                            title="Ingresar Factura / Stock para este material"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-all cursor-pointer"
                            title="Editar material"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleOpenDeleteModal(item)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/15 transition-all cursor-pointer"
                            title="Eliminar material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {!loading && !error && (
          <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
            <span>
              Mostrando {materialesFiltrados.length} de {materiales.length} materiales registrados
            </span>
            <span className="text-secondary font-semibold">Panel Admin Jhaular</span>
          </div>
        )}
      </div>

      {/* Modal Material (Crear / Editar) */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSuccess={fetchMateriales}
        materialToEdit={materialToEdit}
      />

      {/* Modal Factura (Ingresar Compras / Stock) */}
      <FacturaModal
        isOpen={isFacturaModalOpen}
        onClose={() => setIsFacturaModalOpen(false)}
        onSuccess={fetchMateriales}
        materiales={materiales}
        initialMaterialId={facturaMaterialId}
      />

      {/* Modal Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setMaterialToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar "${materialToDelete?.nombre || 'este material'}"?`}
        message="Esta acción no se puede deshacer y borrará el registro de inventario permanentemente."
        isDeleting={isDeleting}
      />
    </div>
  )
}
