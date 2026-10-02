import { useState, useEffect, useMemo } from 'react'
import { X, FileText, PlusCircle, AlertCircle, Calculator } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Material, FacturaFormData } from '../../types/materiales'

interface FacturaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  materiales: Material[]
  initialMaterialId?: string
}

const initialForm: FacturaFormData = {
  material_id: '',
  cantidad: 1,
  costo_total: 0,
  proveedor: '',
  numero_factura: ''
}

export default function FacturaModal({
  isOpen,
  onClose,
  onSuccess,
  materiales,
  initialMaterialId
}: FacturaModalProps) {
  const [formData, setFormData] = useState<FacturaFormData>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        material_id: initialMaterialId || (materiales.length > 0 ? materiales[0].id : ''),
        cantidad: 1,
        costo_total: 0,
        proveedor: '',
        numero_factura: ''
      })
      setErrorMessage(null)
    }
  }, [isOpen, initialMaterialId, materiales])

  // Material seleccionado actualmente
  const selectedMaterial = useMemo(() => {
    return materiales.find((m) => m.id === formData.material_id) || null
  }, [materiales, formData.material_id])

  // Precompletar proveedor si el material seleccionado ya tiene proveedor
  useEffect(() => {
    if (selectedMaterial && selectedMaterial.proveedor && !formData.proveedor) {
      setFormData((prev) => ({
        ...prev,
        proveedor: selectedMaterial.proveedor || ''
      }))
    }
  }, [selectedMaterial])

  // Costo unitario calculado en tiempo real
  const costoUnitarioCalculado = useMemo(() => {
    if (formData.cantidad <= 0 || formData.costo_total <= 0) return 0
    return formData.costo_total / formData.cantidad
  }, [formData.cantidad, formData.costo_total])

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

    if (!formData.material_id) {
      setErrorMessage('Debes seleccionar un material o insumo.')
      return
    }

    if (formData.cantidad <= 0) {
      setErrorMessage('La cantidad comprada debe ser mayor a 0.')
      return
    }

    if (formData.costo_total <= 0) {
      setErrorMessage('El costo total de la factura debe ser mayor a 0.')
      return
    }

    try {
      setIsSubmitting(true)

      const materialRef = selectedMaterial
      if (!materialRef) {
        throw new Error('El material seleccionado no se encuentra en el sistema.')
      }

      const cantidadComprada = Number(formData.cantidad)
      const costoTotalFactura = Number(formData.costo_total)
      const costoUnitarioCalculado = costoTotalFactura / cantidadComprada

      // 1. Intentar registrar la factura en la tabla lotes_materiales
      try {
        await supabase.from('lotes_materiales').insert([
          {
            material_id: formData.material_id,
            cantidad: cantidadComprada,
            costo_total: costoTotalFactura,
            costo_unitario: costoUnitarioCalculado,
            proveedor: formData.proveedor.trim() || null,
            numero_factura: formData.numero_factura.trim() || null
          }
        ])
      } catch (loteErr) {
        console.warn('Registro opcional de lote no guardado en lotes_materiales:', loteErr)
      }

      // 2. Actualizar el stock_actual del material sumando la nueva cantidad y actualizando el costo unitario
      const nuevoStock = Number(materialRef.stock_actual) + cantidadComprada

      const { error: updateError } = await supabase
        .from('materiales')
        .update({
          stock_actual: nuevoStock,
          costo_unitario: costoUnitarioCalculado > 0 ? costoUnitarioCalculado : materialRef.costo_unitario,
          proveedor: formData.proveedor.trim() || materialRef.proveedor
        })
        .eq('id', formData.material_id)

      if (updateError) throw updateError

      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('Error al registrar factura:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar el ingreso en Supabase.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Registrar Factura / Compra</h2>
              <p className="text-[11px] text-on-surface-variant">
                Sistema contable automático: Aumenta el stock e ingresa costo total de la factura.
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
        <form id="factura-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 flex items-center space-x-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seleccionar Insumo */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Insumo / Material a Ingresar <span className="text-error">*</span>
            </label>
            <select
              name="material_id"
              value={formData.material_id}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-secondary transition-all cursor-pointer font-medium"
              required
            >
              <option value="" disabled>
                -- Seleccionar Material --
              </option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id} className="bg-surface-container-low text-on-surface">
                  {m.nombre} ({m.categoria}) — Stock actual: {m.stock_actual} {m.unidad}
                </option>
              ))}
            </select>
          </div>

          {/* Resumen del Stock Actual */}
          {selectedMaterial && (
            <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/20 flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Stock Actual en Bodega:</span>
              <span className="font-mono font-bold text-secondary">
                {selectedMaterial.stock_actual} {selectedMaterial.unidad}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cantidad Comprada */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Cantidad Comprada <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="cantidad"
                min="0.01"
                step="any"
                value={formData.cantidad}
                onChange={handleChange}
                placeholder="1"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
                required
              />
            </div>

            {/* Costo Total Factura */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Costo Total Factura (COP) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="costo_total"
                min="0"
                step="any"
                value={formData.costo_total}
                onChange={handleChange}
                placeholder="0"
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
                / {selectedMaterial?.unidad || 'unidad'}
              </span>
            </div>
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
              placeholder="Ej: Joyas y Macramé Co."
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
            />
          </div>

          {/* Número de Factura */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Nº de Factura / Lote (Opcional)
            </label>
            <input
              type="text"
              name="numero_factura"
              value={formData.numero_factura}
              onChange={handleChange}
              placeholder="Ej: FAC-2026-0042"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all font-mono"
            />
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
            form="factura-form"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-600 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando...' : 'Ingresar Lote de Stock'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
