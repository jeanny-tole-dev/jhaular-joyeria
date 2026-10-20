import React, { useState, useEffect, useMemo } from 'react'
import {
  Calculator,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  Layers,
  Image as ImageIcon
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { convertGoogleDriveUrl } from '../../utils/driveUrlConverter'
import type { ItemProduccion } from '../../types/produccionSheets'
import type { Material } from '../../types/materiales'
import { CATEGORIAS_PRODUCCION } from '../../constants/categorias'

// Insumos predeterminados de joyería Jhaular (Fallback de alta calidad)
const FALLBACK_MATERIALES: Material[] = [
  {
    id: 'mat_esmeralda',
    nombre: 'ESMERALDA COLOMBIANA BRUTO',
    categoria: 'ESMERALDA',
    unidad: 'unidad',
    costo_unitario: 40000,
    stock_actual: 50,
    stock_minimo: 5,
    proveedor: 'Minas Muzo',
    color: 'Verde',
    codigo: 'ESM-01',
    imagen_url: null,
    activo: true
  },
  {
    id: 'mat_balin_4',
    nombre: 'Balines #4 (Oro 18K Diamantado)',
    categoria: 'BALIN',
    unidad: 'unidad',
    costo_unitario: 24600,
    stock_actual: 200,
    stock_minimo: 20,
    proveedor: 'Atelier Jhaular',
    color: 'Dorado 18K',
    codigo: 'BAL-04',
    imagen_url: null,
    activo: true
  },
  {
    id: 'mat_balin_3',
    nombre: 'Balines #3 (Oro 18K Diamantado)',
    categoria: 'BALIN',
    unidad: 'unidad',
    costo_unitario: 13650,
    stock_actual: 300,
    stock_minimo: 30,
    proveedor: 'Atelier Jhaular',
    color: 'Dorado 18K',
    codigo: 'BAL-03',
    imagen_url: null,
    activo: true
  },
  {
    id: 'mat_hilo_macrame',
    nombre: 'HILO MACRAMÉ T70 ESPECIAL',
    categoria: 'HILO',
    unidad: 'metro',
    costo_unitario: 300,
    stock_actual: 1000,
    stock_minimo: 100,
    proveedor: 'Importación Italia',
    color: 'Negro / Rojo / Verde',
    codigo: 'HIL-T70',
    imagen_url: null,
    activo: true
  },
  {
    id: 'mat_dije_san_benito',
    nombre: 'Dije San Benito (Oro 18K)',
    categoria: 'DIJE',
    unidad: 'unidad',
    costo_unitario: 85000,
    stock_actual: 30,
    stock_minimo: 5,
    proveedor: 'Atelier Jhaular',
    color: 'Dorado',
    codigo: 'DIJ-SB',
    imagen_url: null,
    activo: true
  },
  {
    id: 'mat_dije_virgen',
    nombre: 'Dije Virgen Guadalupe (Oro 18K)',
    categoria: 'DIJE',
    unidad: 'unidad',
    costo_unitario: 75000,
    stock_actual: 25,
    stock_minimo: 5,
    proveedor: 'Atelier Jhaular',
    color: 'Dorado',
    codigo: 'DIJ-VG',
    imagen_url: null,
    activo: true
  }
]

// Lista de artesanos / tejedoras
const ARTESANOS_LIST = [
  { id: 'art_carlos', nombre: 'Maestro Carlos Ruiz ($180/min)', tarifaMin: 180 },
  { id: 'art_maria', nombre: 'Artesana María Gómez ($150/min)', tarifaMin: 150 },
  { id: 'art_taller', nombre: 'Taller Central Jhaular ($150/min)', tarifaMin: 150 },
  { id: 'art_custom', nombre: 'Tarifa Personalizada ($150/min)', tarifaMin: 150 }
]

export interface RecetaFila {
  id: string
  materialId: string
  cantidad: number
}

interface BomCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  itemToEdit?: ItemProduccion | null
  totalItemsCount?: number
  onSave: (newItem: ItemProduccion, extraPayload?: any) => Promise<void> | void
  onDelete?: (itemId: string) => Promise<void> | void
}

export default function BomCalculatorModal({
  isOpen,
  onClose,
  itemToEdit,
  totalItemsCount = 13,
  onSave,
  onDelete
}: BomCalculatorModalProps) {
  const isEditMode = Boolean(itemToEdit)

  // Materiales de inventario disponibles
  const [materiales, setMateriales] = useState<Material[]>(FALLBACK_MATERIALES)

  // Campos principales
  const [sku, setSku] = useState('')
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('Oro 18K Diamantado')
  const [colorHilo, setColorHilo] = useState('Negro')
  const [descripcion, setDescripcion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [fotosAdicionalesText, setFotosAdicionalesText] = useState('')

  // Artesano y tiempo
  const [artesanoId, setArtesanoId] = useState('art_carlos')
  const [tarifaMin, setTarifaMin] = useState(180)
  const [tiempoTejidoMin, setTiempoTejidoMin] = useState(35)

  // Receta de Insumos (BOM)
  const [recetaItems, setRecetaItems] = useState<RecetaFila[]>([
    { id: 'rec_1', materialId: 'mat_esmeralda', cantidad: 1 },
    { id: 'rec_2', materialId: 'mat_balin_4', cantidad: 2 },
    { id: 'rec_3', materialId: 'mat_balin_3', cantidad: 2 },
    { id: 'rec_4', materialId: 'mat_hilo_macrame', cantidad: 4 }
  ])

  // Porcentajes de Márgenes
  const [pctGastosIndirectos, setPctGastosIndirectos] = useState<number>(10)
  const [pctGananciaInterna, setPctGananciaInterna] = useState<number>(2)
  const [pctGananciaExterna, setPctGananciaExterna] = useState<number>(40)

  // Estado & QA
  const [stock, setStock] = useState<number>(5)
  const [estado, setEstado] = useState<string>('Disponible')
  const [qa, setQa] = useState<string>('Aprobado')

  // Estado de guardado
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar materiales de Supabase
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('materiales')
          .select('*')
          .eq('activo', true)
          .order('nombre', { ascending: true })

        if (!error && data && data.length > 0) {
          // Combinar con fallbacks por si faltan ítems clave
          const mapMats = new Map<string, Material>()
          FALLBACK_MATERIALES.forEach((m) => mapMats.set(m.id, m))
          data.forEach((m: any) => mapMats.set(m.id, m))
          setMateriales(Array.from(mapMats.values()))
        }
      } catch {
        // fallback
      }
    }

    if (isOpen) {
      loadInventory()
    }
  }, [isOpen])

  // Precargar datos al abrir modal
  useEffect(() => {
    if (!isOpen) return

    if (itemToEdit) {
      setSku(itemToEdit.sku || 'JH-001')
      setNombre(itemToEdit.nombre || '')
      setCategoria(itemToEdit.categoria || 'Oro 18K Diamantado')
      setColorHilo(itemToEdit.colorHilo || 'Negro')
      setDescripcion(itemToEdit.material || '')
      setImagenUrl((itemToEdit as any).imagen_url || (itemToEdit as any).imagen_principal_url || '')
      setStock(itemToEdit.stock ?? 5)
      setEstado(itemToEdit.estado || 'Disponible')
      setQa(itemToEdit.qa || 'Aprobado')

      setRecetaItems([
        { id: 'rec_1', materialId: 'mat_esmeralda', cantidad: 1 },
        { id: 'rec_2', materialId: 'mat_balin_4', cantidad: 2 },
        { id: 'rec_3', materialId: 'mat_balin_3', cantidad: 2 },
        { id: 'rec_4', materialId: 'mat_hilo_macrame', cantidad: 4 }
      ])
    } else {
      const nextNum = totalItemsCount + 1
      setSku(`JH-${nextNum.toString().padStart(3, '0')}`)
      setNombre('')
      setCategoria('Oro 18K Diamantado')
      setColorHilo('Negro')
      setDescripcion('Hermosa manilla en macramé confeccionada con balines de Oro 18K...')
      setImagenUrl('')
      setFotosAdicionalesText('')
      setArtesanoId('art_carlos')
      setTarifaMin(180)
      setTiempoTejidoMin(35)
      setPctGastosIndirectos(10)
      setPctGananciaInterna(2)
      setPctGananciaExterna(40)
      setStock(5)
      setEstado('Disponible')
      setQa('Aprobado')

      setRecetaItems([
        { id: 'rec_1', materialId: 'mat_esmeralda', cantidad: 1 },
        { id: 'rec_2', materialId: 'mat_balin_4', cantidad: 2 },
        { id: 'rec_3', materialId: 'mat_balin_3', cantidad: 2 },
        { id: 'rec_4', materialId: 'mat_hilo_macrame', cantidad: 4 }
      ])
    }
  }, [isOpen, itemToEdit, totalItemsCount])

  // Actualizar tarifa según artesano seleccionado
  const handleArtesanoChange = (id: string) => {
    setArtesanoId(id)
    const selected = ARTESANOS_LIST.find((a) => a.id === id)
    if (selected) {
      setTarifaMin(selected.tarifaMin)
    }
  }

  // Agregar insumo a la receta
  const handleAddInsumo = () => {
    const defaultMat = materiales[0] || FALLBACK_MATERIALES[0]
    setRecetaItems((prev) => [
      ...prev,
      {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        materialId: defaultMat.id,
        cantidad: 1
      }
    ])
  }

  // Eliminar insumo
  const handleRemoveInsumo = (id: string) => {
    setRecetaItems((prev) => prev.filter((r) => r.id !== id))
  }

  // Cambiar material en fila
  const handleMaterialChange = (rowId: string, newMatId: string) => {
    setRecetaItems((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, materialId: newMatId } : r))
    )
  }

  // Cambiar cantidad en fila
  const handleCantidadChange = (rowId: string, cant: number) => {
    setRecetaItems((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, cantidad: Math.max(0.1, cant) } : r))
    )
  }

  // --- CÁLCULOS MATEMÁTICOS DE LAS 4 FASES BOM ---
  // 1. Insumos Total
  const costoInsumosCalculado = useMemo(() => {
    return recetaItems.reduce((sum, row) => {
      const mat = materiales.find((m) => m.id === row.materialId) || FALLBACK_MATERIALES.find((m) => m.id === row.materialId)
      const unitPrice = mat?.costo_unitario || 0
      return sum + row.cantidad * unitPrice
    }, 0)
  }, [recetaItems, materiales])

  // 2. Mano de Obra
  const costoManoObra = useMemo(() => {
    return Math.max(0, tiempoTejidoMin) * tarifaMin
  }, [tiempoTejidoMin, tarifaMin])

  // 3. Costos Directos (Insumos + Mano Obra)
  const costosDirectos = useMemo(() => {
    return costoInsumosCalculado + costoManoObra
  }, [costoInsumosCalculado, costoManoObra])

  // 4. Gastos Indirectos ($)
  const montoGastosIndirectos = useMemo(() => {
    return (costosDirectos * Math.max(0, pctGastosIndirectos)) / 100
  }, [costosDirectos, pctGastosIndirectos])

  // 5. COSTO TOTAL BODEGA ($) (Fase 1)
  const costoTotalBodega = useMemo(() => {
    return costosDirectos + montoGastosIndirectos
  }, [costosDirectos, montoGastosIndirectos])

  // 6. Ganancia Interna Taller ($) (Fase 2 & 3)
  const montoGananciaInterna = useMemo(() => {
    return (costoTotalBodega * Math.max(0, pctGananciaInterna)) / 100
  }, [costoTotalBodega, pctGananciaInterna])

  // 7. COSTO BASE / PRECIO MAYORISTA ($)
  const costoBaseMayorista = useMemo(() => {
    return costoTotalBodega + montoGananciaInterna
  }, [costoTotalBodega, montoGananciaInterna])

  // 8. PRECIO OFICIAL SUGERIDO AL PÚBLICO ($) (Fase 4)
  const precioPublicoSugerido = useMemo(() => {
    if (costoBaseMayorista <= 0) return 0
    const margin = Math.min(Math.max(pctGananciaExterna, 0), 95) / 100
    const rawPrice = costoBaseMayorista / (1 - margin)
    // Redondear a la centena más cercana
    return Math.ceil(rawPrice / 100) * 100
  }, [costoBaseMayorista, pctGananciaExterna])

  // 9. UTILIDAD REAL VENTA FINAL ($)
  const utilidadRealFinal = useMemo(() => {
    return Math.max(0, precioPublicoSugerido - costoBaseMayorista)
  }, [precioPublicoSugerido, costoBaseMayorista])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Math.round(val))
  }

  if (!isOpen) return null

  // Guardar formulario BOM completo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !sku.trim()) {
      alert('Por favor ingresa un SKU y un Nombre para la manilla.')
      return
    }

    try {
      setIsSubmitting(true)

      const newItem: ItemProduccion = {
        id: itemToEdit?.id || `prod_${Date.now()}`,
        sku: sku.trim().toUpperCase(),
        nombre: nombre.trim(),
        categoria,
        material: descripcion.trim() || 'Hilo macramé + balines 18K',
        colorHilo: colorHilo.trim() || 'Negro',
        precioBase: Math.round(costoTotalBodega),
        precioPublico: Math.round(precioPublicoSugerido),
        ganancia: Math.round(utilidadRealFinal),
        stock,
        estado,
        qa
      }

      const extraPayload = {
        imagen_principal_url: convertGoogleDriveUrl(imagenUrl),
        imagen_url: convertGoogleDriveUrl(imagenUrl),
        costo_materiales: Math.round(costoInsumosCalculado),
        mano_obra: Math.round(costoManoObra),
        margen_operativo: Math.round(montoGastosIndirectos),
        costo_total_real: Math.round(costoTotalBodega),
        precio_sugerido: Math.round(precioPublicoSugerido),
        precio_venta: Math.round(precioPublicoSugerido),
        tiempo_produccion: tiempoTejidoMin,
        tiempo_produccion_min: tiempoTejidoMin,
        receta: recetaItems
      }

      await onSave(newItem, extraPayload)
      onClose()
    } catch (err) {
      console.error('Error guardando manilla BOM:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#121216] text-slate-100 rounded-2xl border border-outline-variant/30 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-6">
        {/* Header Modal */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                {isEditMode ? `Editar Manilla & Receta BOM: ${itemToEdit?.nombre || ''}` : 'Calculadora BOM Completa & Crear Nueva Manilla'}
              </h2>
              <p className="text-[11px] text-amber-400/90 font-mono">
                Definición técnica de insumos, mano de obra artesanal, márgenes y foto (Google Drive / URL) para publicar a Catálogo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario Modal */}
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* SECCIÓN 1: IDENTIFICACIÓN & CATEGORÍA */}
          <div className="p-4 rounded-xl bg-[#16161C] border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              1. Datos de Identificación & Categoría del Producto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1 font-semibold">SKU Único</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="JH-001"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-mono text-[11px] mb-1 font-semibold">Nombre de la Manilla</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. mar / Manilla PROMESA / CORAZON DORADO"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1 font-semibold">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                >
                  {CATEGORIAS_PRODUCCION.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1 font-semibold">Color Hilo Técnico</label>
                <input
                  type="text"
                  value={colorHilo}
                  onChange={(e) => setColorHilo(e.target.value)}
                  placeholder="Negro / Verde / Rojo / Rosa"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1 font-semibold">Stock Inicial en Bodega</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: FOTOGRAFÍA & MULTIMEDIA GOOGLE DRIVE */}
          <div className="p-4 rounded-xl bg-[#16161C] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                URL de Imagen o Enlace Compartido de Google Drive
              </label>
              <span className="text-[10px] text-amber-400 font-bold">Convierte automáticamente enlaces de Drive</span>
            </div>

            <input
              type="url"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="Pega aquí el enlace de Google Drive o URL directa de la imagen (https://...)"
              className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
            />

            {imagenUrl && (
              <div className="p-3 bg-[#111115] rounded-xl border border-amber-500/30 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-black/60 overflow-hidden border border-amber-500/40 shrink-0 flex items-center justify-center">
                  <img
                    src={convertGoogleDriveUrl(imagenUrl)}
                    alt="Foto principal"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="space-y-0.5 text-xs overflow-hidden">
                  <p className="font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Foto principal vinculada desde Google Drive</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 truncate break-all">
                    {convertGoogleDriveUrl(imagenUrl)}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-mono text-[10.5px] mb-1 font-semibold uppercase">
                Fotos Adicionales para el Carrusel de Catálogo (Google Drive / URLs)
              </label>
              <textarea
                rows={2}
                value={fotosAdicionalesText}
                onChange={(e) => setFotosAdicionalesText(e.target.value)}
                placeholder="Pega aquí URLs o enlaces de Google Drive adicionales (una por línea)..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Estas fotos se anexarán automáticamente al carrusel editorial de la manilla.
              </p>
            </div>

            <div>
              <label className="block text-slate-400 font-mono text-[10.5px] mb-1 font-semibold uppercase">
                Descripción Breve o Concepto
              </label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Joya ancestral confeccionada en hilo macramé negro con 5 balines de Oro 18K..."
                className="w-full p-2.5 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* SECCIÓN 3: 2. INSUMOS REQUERIDOS (RECETA BOM) & MANO DE OBRA */}
          <div className="p-4 rounded-xl bg-[#16161C] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                2. Insumos Requeridos (Receta BOM) & Mano de Obra
              </h3>
              <button
                type="button"
                onClick={handleAddInsumo}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Insumo</span>
              </button>
            </div>

            {/* Artesano y Tiempo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 font-mono text-[10.5px] mb-1 uppercase font-semibold">
                  Artesano / Tejedora Sugerida
                </label>
                <select
                  value={artesanoId}
                  onChange={(e) => handleArtesanoChange(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                >
                  {ARTESANOS_LIST.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10.5px] mb-1 uppercase font-semibold">
                  Tiempo de Tejido (Minutos por Unidad)
                </label>
                <input
                  type="number"
                  min="1"
                  value={tiempoTejidoMin}
                  onChange={(e) => setTiempoTejidoMin(Number(e.target.value))}
                  className="w-full p-2 bg-slate-900 border border-slate-700/60 rounded-lg text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Lista Dinámica de Insumos */}
            <div className="space-y-2">
              <label className="block text-slate-400 font-mono text-[10.5px] uppercase font-bold tracking-wider">
                Materiales del Inventario (Balines, Gemas, Hilos, Dijes):
              </label>

              {recetaItems.map((row) => {
                const mat = materiales.find((m) => m.id === row.materialId) || FALLBACK_MATERIALES.find((m) => m.id === row.materialId)
                const unitCost = mat?.costo_unitario || 0
                const subtotal = row.cantidad * unitCost
                return (
                  <div
                    key={row.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-7">
                        <select
                          value={row.materialId}
                          onChange={(e) => handleMaterialChange(row.id, e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                        >
                          {materiales.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.nombre} ({formatCurrency(m.costo_unitario)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 flex items-center space-x-1">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.cantidad}
                          onChange={(e) => handleCantidadChange(row.id, Number(e.target.value))}
                          className="w-20 p-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-bold text-emerald-400 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">{mat?.unidad || 'unidad'}</span>
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveInsumo(row.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 transition-colors self-end sm:self-center"
                      title="Eliminar insumo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FASE 1: COSTOS DIRECTOS & DE BODEGA */}
          <div className="p-4 rounded-xl bg-[#16161C] border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">1</span>
                FASE 1: COSTOS DIRECTOS & DE BODEGA (PRODUCCIÓN / TALLER)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Fórmula: [Insumos] + [Mano de Obra] + [Gastos Indirectos]
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">1. INSUMOS BOM</span>
                <span className="text-sm font-bold font-mono text-slate-100">{formatCurrency(costoInsumosCalculado)}</span>
                <span className="text-[9.5px] text-slate-500 block font-mono">Materiales e insumos</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-purple-300 uppercase block">2. MANO DE OBRA</span>
                <span className="text-sm font-bold font-mono text-purple-300">{formatCurrency(costoManoObra)}</span>
                <span className="text-[9.5px] text-purple-400/80 block font-mono">{tiempoTejidoMin} min de tejido</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-300 uppercase block">3. GASTOS INDIRECTOS</span>
                <span className="text-sm font-bold font-mono text-amber-300">{formatCurrency(montoGastosIndirectos)}</span>
                <span className="text-[9.5px] text-amber-400/80 block font-mono">{pctGastosIndirectos}% s/ Directos</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40">
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">COSTO TOTAL BODEGA</span>
                <span className="text-base font-bold font-mono text-amber-300">{formatCurrency(costoTotalBodega)}</span>
                <span className="text-[9.5px] text-amber-400/90 block font-mono">Costo real de fabricación</span>
              </div>
            </div>
          </div>

          {/* FASE 2 & 3: CONFIGURACIÓN DE TALLER & PRECIO MAYORISTA */}
          <div className="p-4 rounded-xl bg-[#16161C] border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">2</span>
                FASE 2 & 3: CONFIGURACIÓN DE TALLER & PRECIO MAYORISTA
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                Fórmula: [Costo Bodega] + [Ganancia Interna]
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-300 font-bold">
                  <span>% GASTOS INDIRECTOS (TALLER)</span>
                  <span className="text-amber-300">{formatCurrency(montoGastosIndirectos)}</span>
                </div>
                <input
                  type="number"
                  value={pctGastosIndirectos}
                  onChange={(e) => setPctGastosIndirectos(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono font-bold focus:outline-none"
                />
                <p className="text-[9.5px] text-slate-500 font-mono">
                  Calculado como el {pctGastosIndirectos}% sobre Costos Directos (Insumos + Mano de Obra).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-300 font-bold">
                  <span>% GANANCIA INTERNA (TALLER/ADMIN)</span>
                  <span className="text-amber-300">{formatCurrency(montoGananciaInterna)}</span>
                </div>
                <input
                  type="number"
                  value={pctGananciaInterna}
                  onChange={(e) => setPctGananciaInterna(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono font-bold focus:outline-none"
                />
                <p className="text-[9.5px] text-slate-500 font-mono">
                  Calculado como el {pctGananciaInterna}% sobre el Costo Total de Bodega.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">GANANCIA INTERNA TALLER</span>
                <span className="text-base font-bold font-mono text-amber-300">{formatCurrency(montoGananciaInterna)}</span>
                <span className="text-[9.5px] text-slate-400 block font-mono">Utilidad bruta asignada al Taller/Admin</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40">
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">COSTO BASE / PRECIO MAYORISTA</span>
                <span className="text-base font-bold font-mono text-amber-300">{formatCurrency(costoBaseMayorista)}</span>
                <span className="text-[9.5px] text-amber-400/90 block font-mono">Precio base de salida del taller</span>
              </div>
            </div>
          </div>

          {/* FASE 4: COMERCIALIZACIÓN & VENTA AL PÚBLICO */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">3</span>
                FASE 4: COMERCIALIZACIÓN & VENTA AL PÚBLICO (UTILIDAD EXTERNA)
              </h3>
              <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Margen Comercial sobre Venta
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <label className="block text-[10.5px] font-mono text-slate-300 font-bold uppercase">
                % GANANCIA EXTERNA (UTILIDAD VENTA COMERCIAL)
              </label>
              <input
                type="number"
                value={pctGananciaExterna}
                onChange={(e) => setPctGananciaExterna(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-mono font-bold focus:outline-none text-sm"
              />
              <p className="text-[9.5px] text-slate-400 font-mono">
                Representa el margen de utilidad neta ({pctGananciaExterna}%) sobre el precio final de venta al cliente en e-commerce/catálogo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <div>
                <span className="text-[10px] font-mono text-emerald-300 uppercase block font-bold">
                  PRECIO OFICIAL SUGERIDO AL PÚBLICO:
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCurrency(precioPublicoSugerido)}
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-mono text-emerald-300 uppercase block font-bold">
                  UTILIDAD REAL VENTA FINAL ($)
                </span>
                <span className="text-xl font-bold font-mono text-emerald-300">
                  +{formatCurrency(utilidadRealFinal)}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER ACCIONES DE GUARDADO */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {isEditMode && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  const targetId = itemToEdit?.id
                  if (targetId && confirm(`¿Seguro que deseas eliminar la manilla "${itemToEdit?.nombre || ''}"?`)) {
                    onDelete(targetId)
                    onClose()
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 font-mono text-xs font-bold rounded-xl border border-rose-500/40 transition-all w-full sm:w-auto justify-center"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Manilla</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded-xl transition-all shadow-lg w-full sm:w-auto cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'Guardando...' : 'Guardar Manilla & Publicar en Catálogo'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
