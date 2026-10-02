import { useState, useEffect, useMemo } from 'react'
import { X, Save, Boxes, AlertCircle, Calculator } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  CATEGORIAS_MATERIALES,
  type Material
} from '../../types/materiales'

interface MaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  materialToEdit?: Material | null
}

interface FormState {
  nombre: string
  codigo: string
  categoria: string
  unidad: string
  stock_actual: number
  costo_total_factura: number
  stock_minimo: number
  proveedor: string
  color: string
  imagen_url: string
}

const initialFormState: FormState = {
  nombre: '',
  codigo: '',
  categoria: 'HILO',
  unidad: 'metro',
  stock_actual: 1,
  costo_total_factura: 0,
  stock_minimo: 10,
  proveedor: '',
  color: '',
  imagen_url: ''
}

export default function MaterialModal({
  isOpen,
  onClose,
  onSuccess,
  materialToEdit
}: MaterialModalProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEditing = Boolean(materialToEdit)

  useEffect(() => {
    if (materialToEdit) {
      const stock = materialToEdit.stock_actual || 1
      const unitCost = materialToEdit.costo_unitario || 0
      setFormData({
        nombre: materialToEdit.nombre || '',
        codigo: materialToEdit.codigo || '',
        categoria: materialToEdit.categoria || 'HILO',
        unidad: materialToEdit.unidad || 'metro',
        stock_actual: stock,
        costo_total_factura: Math.round(stock * unitCost),
        stock_minimo: materialToEdit.stock_minimo || 0,
        proveedor: materialToEdit.proveedor || '',
        color: materialToEdit.color || '',
        imagen_url: materialToEdit.imagen_url || ''
      })
    } else {
      setFormData(initialFormState)
    }
    setErrorMessage(null)
  }, [materialToEdit, isOpen])

  // CÁLCULO AUTOMÁTICO EN TIEMPO REAL DEL COSTO UNITARIO
  const costoUnitarioCalculado = useMemo(() => {
    const cantidad = Number(formData.stock_actual)
    const costoTotal = Number(formData.costo_total_factura)

    if (cantidad <= 0 || costoTotal <= 0) return 0
    return costoTotal / cantidad
  }, [formData.stock_actual, formData.costo_total_factura])

  if (!isOpen) return null

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }))
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2
    }).format(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.nombre.trim()) {
      setErrorMessage('El nombre del insumo es obligatorio.')
      return
    }

    if (formData.stock_actual <= 0) {
      setErrorMessage('La cantidad comprada/stock debe ser mayor a 0.')
      return
    }

    if (formData.costo_total_factura <= 0) {
      setErrorMessage('El costo total de la factura debe ser mayor a 0 para calcular el costo unitario.')
      return
    }

    try {
      setIsSubmitting(true)

      const costoUnitarioFinal = costoUnitarioCalculado

      const payload = {
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim() || null,
        categoria: formData.categoria,
        unidad: formData.unidad.trim() || 'unidad',
        stock_actual: Number(formData.stock_actual),
        costo_unitario: costoUnitarioFinal,
        stock_minimo: Number(formData.stock_minimo),
        proveedor: formData.proveedor.trim() || null,
        color: formData.color.trim() || null,
        imagen_url: formData.imagen_url.trim() || null,
        activo: true
      }

      if (isEditing && materialToEdit) {
        const { error } = await supabase
          .from('materiales')
          .update(payload)
          .eq('id', materialToEdit.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materiales')
          .insert([payload])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('Error guardando material:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar en Supabase.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {isEditing ? 'Editar Insumo / Material' : 'Nuevo Insumo / Material'}
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Sistema contable automático: Ingresa cantidad comprada y costo total de la factura.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form id="material-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 flex items-center space-x-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Nombre del Insumo <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Hilo Macramé Rojo 1mm, Balín Oro 18k 3mm..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                required
              />
            </div>

            {/* Código */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Código / SKU
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Ej: HIL-ROJ-01"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            {/* Categoría Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Categoría <span className="text-error">*</span>
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer font-medium"
              >
                {CATEGORIAS_MATERIALES.map((cat) => (
                  <option key={cat} value={cat} className="bg-surface-container-low text-on-surface">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad Comprada / Stock */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Cantidad Comprada (Stock) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="stock_actual"
                min="0.01"
                step="any"
                value={formData.stock_actual}
                onChange={handleChange}
                placeholder="Ej: 20, 100, 500"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                required
              />
            </div>

            {/* Costo Total de la Factura */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Costo Total Factura (COP) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="costo_total_factura"
                min="0"
                step="any"
                value={formData.costo_total_factura}
                onChange={handleChange}
                placeholder="Ej: 700000"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                required
              />
            </div>
          </div>

          {/* CÁLCULO AUTOMÁTICO DESTACADO: COSTO UNITARIO CALCULADO (Read-Only) */}
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  Costo Unitario Calculado (Automático)
                </p>
                <p className="text-[10px] font-mono text-emerald-300/70">
                  Fórmula: Costo Total Factura / Cantidad Comprada
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(costoUnitarioCalculado)}
              </span>
              <span className="text-[10px] font-mono text-emerald-300/80 block">
                / {formData.unidad || 'unidad'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unidad de Medida */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Unidad de Medida
              </label>
              <select
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer"
              >
                <option value="metro">Metro (m)</option>
                <option value="unidad">Unidad (und)</option>
                <option value="gramo">Gramo (g)</option>
                <option value="par">Par</option>
                <option value="cm">Centímetro (cm)</option>
                <option value="rollo">Rollo</option>
              </select>
            </div>

            {/* Stock Mínimo */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Stock Mínimo (Alerta) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="stock_minimo"
                min="0"
                value={formData.stock_minimo}
                onChange={handleChange}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                required
              />
            </div>

            {/* Proveedor */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Proveedor
              </label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Ej: Distribuidora Macramé, Joyería Central..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            {/* Color */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Color / Tono
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="Ej: Rojo Pasión, Dorado 18K, Esmeralda..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            {/* URL de Factura / Respaldo */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                URL DE FACTURA / RESPALDO (Google Drive, etc.)
              </label>
              <input
                type="url"
                name="imagen_url"
                value={formData.imagen_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all font-mono"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="material-form"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold bg-secondary text-on-secondary hover:bg-secondary/90 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Insumo' : 'Crear Insumo'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
