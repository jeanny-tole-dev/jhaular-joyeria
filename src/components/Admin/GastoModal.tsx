import { useState, useEffect } from 'react'
import { X, Save, Receipt, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS_GASTOS, type Gasto, type GastoFormData } from '../../types/gastos'

interface GastoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  gastoAEditar?: Gasto | null
}

const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialFormState: GastoFormData = {
  fecha: getTodayString(),
  categoria: 'Telefonía/Internet',
  descripcion: '',
  monto: 0,
  comprobante_url: ''
}

export default function GastoModal({
  isOpen,
  onClose,
  onSuccess,
  gastoAEditar
}: GastoModalProps) {
  const [formData, setFormData] = useState<GastoFormData>(initialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEditing = Boolean(gastoAEditar)

  useEffect(() => {
    if (isOpen) {
      if (gastoAEditar) {
        setFormData({
          fecha: gastoAEditar.fecha || getTodayString(),
          categoria: gastoAEditar.categoria || 'Telefonía/Internet',
          descripcion: gastoAEditar.descripcion || '',
          monto: gastoAEditar.monto || 0,
          comprobante_url: gastoAEditar.comprobante_url || ''
        })
      } else {
        setFormData({
          ...initialFormState,
          fecha: getTodayString()
        })
      }
      setErrorMessage(null)
    }
  }, [isOpen, gastoAEditar])

  if (!isOpen) return null

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!formData.descripcion.trim()) {
      setErrorMessage('La descripción del gasto es obligatoria.')
      return
    }

    if (formData.monto <= 0) {
      setErrorMessage('El monto del gasto debe ser mayor a 0.')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        fecha: formData.fecha,
        categoria: formData.categoria,
        descripcion: formData.descripcion.trim(),
        monto: Number(formData.monto),
        comprobante_url: formData.comprobante_url.trim() || null
      }

      if (isEditing && gastoAEditar) {
        const { error } = await supabase
          .from('gastos')
          .update(payload)
          .eq('id', gastoAEditar.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('gastos')
          .insert([payload])

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('Error guardando gasto:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar el gasto en Supabase.'
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
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {isEditing ? 'Editar Gasto Operativo' : 'Registrar Gasto Operativo'}
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                {isEditing
                  ? 'Modifica los detalles del gasto seleccionado.'
                  : 'Ingresa los detalles del gasto realizado en Jhaular.'}
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
        <form id="gasto-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 flex items-center space-x-2 text-xs text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                Fecha del Gasto <span className="text-error">*</span>
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono focus:outline-none focus:border-secondary transition-all cursor-pointer"
                required
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
                required
              >
                {CATEGORIAS_GASTOS.map((cat) => (
                  <option key={cat} value={cat} className="bg-surface-container-low text-on-surface">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Descripción del Gasto <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Ej: Compra SIM card plan datos, Envío paquetes Servientrega..."
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
              required
            />
          </div>

          {/* Monto COP */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              Monto del Gasto (COP) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="monto"
              min="1"
              step="any"
              value={formData.monto}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-mono font-bold text-amber-400 placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary transition-all"
              required
            />
          </div>

          {/* Comprobante URL */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              URL del Comprobante / Factura (Opcional)
            </label>
            <input
              type="url"
              name="comprobante_url"
              value={formData.comprobante_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/..."
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
            form="gasto-form"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar Gasto' : 'Registrar Gasto'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
