// Panel de Administración — Trazabilidad Técnica & Radiografía de Certificados de Venta

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Award,
  Layers,
  Calendar,
  User,
  X,
  FileCheck,
  CheckCircle2,
  Key,
  Trash2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

export interface LoteInsumoDetalle {
  id: string
  material_nombre: string
  proveedor: string
  cantidad: number
  unidad: string
  lote_codigo: string
}

interface VentaCertificado {
  id: string
  codigo_certificado: string
  producto_id?: string | null
  producto_nombre: string
  cliente_nombre?: string | null
  fecha_venta: string
  balines_proveedor: string
  balines_tamano: string
  balines_cantidad: number
  hilo_tipo_lote: string
  esmeralda_lote?: string | null
  precio_venta?: number
  observaciones_garantia?: string | null
  lotes_detalle?: LoteInsumoDetalle[] | string | null
  activo?: boolean
  created_at?: string
}

// Certificado de prueba inicial para demostración de trazabilidad
const CERTIFICADO_MOCK_ADMIN: VentaCertificado = {
  id: 'cert_mock_001',
  codigo_certificado: 'JHA-8472-ORO',
  producto_nombre: 'Manilla Elemento Ancestral',
  cliente_nombre: 'Santiago Restrepo',
  fecha_venta: '2026-08-15',
  balines_proveedor: 'Proveedor Alfa Joyería',
  balines_tamano: '#4 (4mm)',
  balines_cantidad: 12,
  hilo_tipo_lote: 'Negro Bondeado (Lote HB-02)',
  esmeralda_lote: 'Esmeralda Natural Boyacá (Lote ESM-9)',
  precio_venta: 185000,
  observaciones_garantia: 'Garantía extendida. Cliente VIP registrado en atelier Bogotá.',
  lotes_detalle: [
    {
      id: 'lote_mock_1',
      material_nombre: 'Balines #4 (4mm)',
      proveedor: 'Proveedor Alfa Joyería',
      cantidad: 12,
      unidad: 'unidades',
      lote_codigo: 'LOT-BAL-402'
    },
    {
      id: 'lote_mock_2',
      material_nombre: 'Hilo Macramé Negro',
      proveedor: 'Hilos Colombia S.A.S.',
      cantidad: 5,
      unidad: 'metros',
      lote_codigo: 'Lote HB-02'
    },
    {
      id: 'lote_mock_3',
      material_nombre: 'Esmeralda Natural Boyacá',
      proveedor: 'Boyacá Gemas & Minas',
      cantidad: 1,
      unidad: 'unidad',
      lote_codigo: 'Lote ESM-9'
    }
  ],
  activo: true,
  created_at: new Date().toISOString()
}

export default function AdminCertificados() {
  const [certificados, setCertificados] = useState<VentaCertificado[]>([CERTIFICADO_MOCK_ADMIN])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCertificado, setSelectedCertificado] = useState<VentaCertificado | null>(CERTIFICADO_MOCK_ADMIN)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Formulario para Registrar Nuevo Certificado Técnico
  const [nuevoForm, setNuevoForm] = useState({
    codigo_certificado: '',
    producto_nombre: 'Manilla Elemento Ancestral',
    cliente_nombre: '',
    fecha_venta: new Date().toISOString().split('T')[0],
    balines_proveedor: 'Proveedor Alfa Joyería',
    balines_tamano: '#4 (4mm)',
    balines_cantidad: 12,
    hilo_tipo_lote: 'Negro Bondeado (Lote HB-02)',
    esmeralda_lote: 'Esmeralda Natural Boyacá (Lote ESM-9)',
    precio_venta: 185000,
    observaciones_garantia: ''
  })

  // CRUD Dinámico de Lotes por Insumo y Proveedor
  const [lotesForm, setLotesForm] = useState<LoteInsumoDetalle[]>([
    {
      id: 'lote_init_1',
      material_nombre: 'Balines #8',
      proveedor: 'ALFA JOYERIA',
      cantidad: 5,
      unidad: 'unidades',
      lote_codigo: 'LOT-BAL-882'
    },
    {
      id: 'lote_init_2',
      material_nombre: 'HILO BONDEADO',
      proveedor: 'Hilos Macramé Colombia',
      cantidad: 5,
      unidad: 'metros',
      lote_codigo: 'Lote HB-02'
    },
    {
      id: 'lote_init_3',
      material_nombre: 'NEOPRENO / GEMA',
      proveedor: 'Cauchos & Gemas S.A.S.',
      cantidad: 2,
      unidad: 'unidades',
      lote_codigo: 'Lote ESM-9'
    }
  ])

  // Cargar productos del catálogo Supabase para autocompletar la receta y los insumos
  const [productosCatalogo, setProductosCatalogo] = useState<any[]>([])
  const [recetaBomCargada, setRecetaBomCargada] = useState<any[]>([])

  const handleAddLoteItem = () => {
    setLotesForm((prev) => [
      ...prev,
      {
        id: `lote_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        material_nombre: 'Nuevo Insumo / Dije',
        proveedor: 'Proveedor Alfa Joyería',
        cantidad: 1,
        unidad: 'unidad',
        lote_codigo: `LOT-${Math.floor(100 + Math.random() * 900)}`
      }
    ])
  }

  const handleUpdateLoteItem = (id: string, field: keyof LoteInsumoDetalle, val: any) => {
    setLotesForm((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    )
  }

  const handleRemoveLoteItem = (id: string) => {
    setLotesForm((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    const fetchCatalogProds = async () => {
      try {
        const { data } = await supabase.from('productos').select('*').order('nombre', { ascending: true })
        if (data && data.length > 0) {
          setProductosCatalogo(data)
        }
      } catch (e) {
        console.warn('Cargando catálogo local:', e)
      }
    }
    fetchCatalogProds()
  }, [])

  // Al seleccionar un producto del catálogo, autocompletar automáticamente la receta BOM y sus lotes dinámicos
  const handleSeleccionarProductoCatalogo = async (prodId: string) => {
    if (!prodId) return
    const prod = productosCatalogo.find((p) => p.id === prodId)
    if (!prod) return

    const serialRandom = Math.floor(100 + Math.random() * 900)
    const nuevoCodigo = `JHA-${serialRandom}-ORO`

    setNuevoForm((prev) => ({
      ...prev,
      codigo_certificado: nuevoCodigo,
      producto_nombre: prod.nombre,
      precio_venta: prod.precio_venta || 0,
      observaciones_garantia: `Garantía oficial para ${prod.nombre}. Pieza elaborada en macramé y oro 18K certificado.`
    }))

    try {
      // 1. Obtener lista completa de materiales
      const { data: allMats } = await supabase.from('materiales').select('*')
      const matMap = new Map<string, any>()
      if (allMats) {
        allMats.forEach((m) => matMap.set(m.id, m))
      }

      // 2. Cargar insumos BOM de producto_materiales para este producto
      const { data: bomData } = await supabase
        .from('producto_materiales')
        .select('*')
        .eq('producto_id', prodId)

      if (bomData && bomData.length > 0) {
        const recetaCompleta = bomData.map((row: any) => {
          const matObj = matMap.get(row.material_id) || row.material || null
          return {
            id: row.id,
            material_id: row.material_id,
            nombre: matObj?.nombre || 'Insumo Joyería',
            proveedor: matObj?.proveedor || 'Proveedor Alfa Joyería',
            cantidad: Number(row.cantidad) || 1,
            unidad: matObj?.unidad || 'unidad'
          }
        })

        setRecetaBomCargada(recetaCompleta)

        // Generar una fila CRUD de trazabilidad por CADA insumo de la receta BOM
        const nuevosLotes: LoteInsumoDetalle[] = recetaCompleta.map((item: any, idx: number) => {
          const mName = item.nombre.toLowerCase()
          let loteCod = `LOT-${100 + idx * 15}`
          if (mName.includes('hilo')) loteCod = 'Lote HB-02'
          if (mName.includes('esmeralda') || mName.includes('dije') || mName.includes('gema')) loteCod = 'Lote ESM-9'

          return {
            id: `lote_bom_${idx}_${Date.now()}`,
            material_nombre: item.nombre,
            proveedor: item.proveedor || 'Proveedor Alfa Joyería',
            cantidad: item.cantidad,
            unidad: item.unidad,
            lote_codigo: loteCod
          }
        })

        setLotesForm(nuevosLotes)

        let balinesCnt = 0
        let balinesTam = ''
        let balinesProv = 'Proveedor Alfa Joyería'
        let hiloNombre = ''
        let gemaNombre = ''

        recetaCompleta.forEach((item: any) => {
          const mName = item.nombre.toLowerCase()

          if (mName.includes('balin') || mName.includes('esfera') || mName.includes('oro') || mName.includes('#')) {
            balinesCnt += item.cantidad
            if (!balinesTam) balinesTam = item.nombre
            if (item.proveedor) balinesProv = item.proveedor
          } else if (mName.includes('hilo') || mName.includes('macram') || mName.includes('cuerda') || mName.includes('cordon')) {
            hiloNombre = `${item.nombre} (Lote HB-02)`
          } else {
            gemaNombre = `${item.nombre} (Lote ESM-9)`
          }
        })

        setNuevoForm((prev) => ({
          ...prev,
          balines_cantidad: balinesCnt > 0 ? balinesCnt : prev.balines_cantidad,
          balines_tamano: balinesTam || prev.balines_tamano,
          balines_proveedor: balinesProv || prev.balines_proveedor,
          hilo_tipo_lote: hiloNombre || prev.hilo_tipo_lote,
          esmeralda_lote: gemaNombre || prev.esmeralda_lote
        }))
      } else {
        setRecetaBomCargada([])
      }
    } catch (err) {
      console.warn('Error trayendo insumos BOM del catálogo:', err)
    }
  }

  // Persistencia local permanente para evitar pérdidas
  const saveLocalCertificado = (cert: VentaCertificado) => {
    try {
      const stored = JSON.parse(localStorage.getItem('jhaular_saved_certificados') || '[]')
      const filtrado = stored.filter((c: VentaCertificado) => c.codigo_certificado !== cert.codigo_certificado)
      localStorage.setItem('jhaular_saved_certificados', JSON.stringify([cert, ...filtrado]))
    } catch (err) {
      console.warn('Error guardando en localStorage:', err)
    }
  }

  const getLocalCertificados = (): VentaCertificado[] => {
    try {
      return JSON.parse(localStorage.getItem('jhaular_saved_certificados') || '[]')
    } catch {
      return []
    }
  }

  const getDeletedCertificados = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('jhaular_deleted_certificados') || '[]')
    } catch {
      return []
    }
  }

  const handleEliminarCertificado = async (id: string, codigo: string) => {
    if (!confirm(`¿Estás seguro de eliminar el certificado de venta "${codigo}"?`)) return
    try {
      try {
        await supabase.from('ventas_certificados').delete().eq('codigo_certificado', codigo)
        await supabase.from('ventas_certificados').delete().eq('id', id)
      } catch (dbErr) {
        console.warn('Error eliminando de Supabase:', dbErr)
      }

      let deletedCerts = getDeletedCertificados()
      if (!deletedCerts.includes(codigo)) {
        deletedCerts.push(codigo)
        localStorage.setItem('jhaular_deleted_certificados', JSON.stringify(deletedCerts))
      }

      const localSaved = getLocalCertificados()
      const filtrado = localSaved.filter((c) => c.codigo_certificado !== codigo && c.id !== id)
      localStorage.setItem('jhaular_saved_certificados', JSON.stringify(filtrado))

      const listaNueva = certificados.filter((c) => c.codigo_certificado !== codigo && c.id !== id)
      setCertificados(listaNueva)
      if (selectedCertificado?.codigo_certificado === codigo) {
        setSelectedCertificado(listaNueva[0] || null)
      }
      alert(`¡Certificado ${codigo} eliminado correctamente!`)
    } catch (err) {
      console.error('Error eliminando certificado:', err)
    }
  }

  const fetchCertificados = useCallback(async () => {
    try {
      setLoading(true)
      const localCertificados = getLocalCertificados()
      const deletedCertificados = getDeletedCertificados()

      const { data, error } = await supabase
        .from('ventas_certificados')
        .select('*')
        .order('created_at', { ascending: false })

      const mapa = new Map<string, VentaCertificado>()
      if (CERTIFICADO_MOCK_ADMIN.codigo_certificado && !deletedCertificados.includes(CERTIFICADO_MOCK_ADMIN.codigo_certificado)) {
        mapa.set(CERTIFICADO_MOCK_ADMIN.codigo_certificado, CERTIFICADO_MOCK_ADMIN)
      }

      if (!error && data && data.length > 0) {
        data.forEach((c) => {
          if (c.codigo_certificado && !deletedCertificados.includes(c.codigo_certificado)) {
            mapa.set(c.codigo_certificado, c)
          }
        })
      }

      localCertificados.forEach((c) => {
        if (c.codigo_certificado && !deletedCertificados.includes(c.codigo_certificado)) {
          mapa.set(c.codigo_certificado, c)
        }
      })

      const lista = Array.from(mapa.values())
      setCertificados(lista)
      if (lista.length > 0) {
        if (!selectedCertificado || !lista.some((c) => c.codigo_certificado === selectedCertificado.codigo_certificado)) {
          setSelectedCertificado(lista[0])
        }
      } else {
        setSelectedCertificado(null)
      }
    } catch {
      const localCertificados = getLocalCertificados()
      const deletedCertificados = getDeletedCertificados()
      const lista = localCertificados.filter((c) => !deletedCertificados.includes(c.codigo_certificado))
      setCertificados(lista)
      setSelectedCertificado(lista[0] || null)
    } finally {
      setLoading(false)
    }
  }, [selectedCertificado])

  useEffect(() => {
    fetchCertificados()
  }, [fetchCertificados])

  // Guardar nuevo certificado en base de datos & localStorage
  const handleGuardarCertificado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoForm.codigo_certificado.trim()) return

    const codigoFormateado = nuevoForm.codigo_certificado.trim().toUpperCase()
    const codigoFinal = codigoFormateado.startsWith('JHA-') ? codigoFormateado : `JHA-${codigoFormateado}`

    try {
      setIsSaving(true)

      const payload = {
        ...nuevoForm,
        codigo_certificado: codigoFinal,
        lotes_detalle: lotesForm,
        activo: true
      }

      // Intentar insertar en Supabase
      const { data, error } = await supabase
        .from('ventas_certificados')
        .insert([payload])
        .select()
        .single()

      if (error) {
        console.warn('Guardado local activado por esquema Supabase:', error.message)
      }

      const nuevoCert: VentaCertificado = {
        id: data?.id || `cert_local_${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      }

      // Guardar en localStorage para garantizar persistencia permanente
      saveLocalCertificado(nuevoCert)

      setCertificados((prev) => {
        const sinDup = prev.filter((c) => c.codigo_certificado !== nuevoCert.codigo_certificado)
        return [nuevoCert, ...sinDup]
      })
      setSelectedCertificado(nuevoCert)
      setIsModalOpen(false)

      // Reiniciar formulario
      setNuevoForm({
        codigo_certificado: '',
        producto_nombre: 'Manilla Elemento Ancestral',
        cliente_nombre: '',
        fecha_venta: new Date().toISOString().split('T')[0],
        balines_proveedor: 'Proveedor Alfa Joyería',
        balines_tamano: '#4 (4mm)',
        balines_cantidad: 12,
        hilo_tipo_lote: 'Negro Bondeado (Lote HB-02)',
        esmeralda_lote: 'Esmeralda Natural Boyacá (Lote ESM-9)',
        precio_venta: 185000,
        observaciones_garantia: ''
      })
    } catch (err: unknown) {
      console.error('Error al guardar certificado:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Filtrado de certificados
  const certificadosFiltrados = useMemo(() => {
    return certificados.filter((cert) => {
      const q = searchQuery.toLowerCase()
      return (
        cert.codigo_certificado.toLowerCase().includes(q) ||
        cert.producto_nombre.toLowerCase().includes(q) ||
        (cert.cliente_nombre && cert.cliente_nombre.toLowerCase().includes(q)) ||
        cert.balines_proveedor.toLowerCase().includes(q)
      )
    })
  }, [certificados, searchQuery])

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header del Módulo de Trazabilidad */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface tracking-wide">
              Trazabilidad & Radiografía de Certificados
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Control de lotes de balines, hilos y esmeraldas asignados a cada pieza para prevención de fraudes y reclamos de garantía.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCertificados}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Actualizar registros"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Venta & Certificado</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Certificados (Izquierda) + Radiografía Técnica (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: BUSCADOR & LISTA (5 COLUMNAS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código (ej: JHA-8472), joya o cliente..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-all font-mono"
            />
          </div>

          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {certificadosFiltrados.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl space-y-2">
                <FileCheck className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
                <p className="text-xs font-semibold text-on-surface">No se encontraron certificados</p>
                <p className="text-[11px] text-on-surface-variant">Prueba con otro término de búsqueda.</p>
              </div>
            ) : (
              certificadosFiltrados.map((cert) => {
                const isSelected = selectedCertificado?.id === cert.id

                return (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCertificado(cert)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : 'border-outline-variant/20 bg-surface-container-lowest hover:border-secondary/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-secondary">
                          {cert.codigo_certificado}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                          Auténtico
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-on-surface">
                        {cert.producto_nombre}
                      </h4>

                      <p className="text-[11px] text-on-surface-variant font-mono">
                        Cliente: {cert.cliente_nombre || 'Venta Mostrador'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-on-surface-variant block">
                        {cert.fecha_venta}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-400 block mt-1">
                        {formatCurrency(cert.precio_venta)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: RADIOGRAFÍA TÉCNICA DE LA PIEZA (7 COLUMNAS) */}
        <div className="lg:col-span-7">
          {selectedCertificado ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-xl space-y-6">
              
              {/* Encabezado Radiografía */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-secondary font-bold block">
                      Radiografía Técnica de Garantía
                    </span>
                    <h3 className="font-display font-bold text-xl text-on-surface">
                      {selectedCertificado.codigo_certificado}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Registro Activo</span>
                  </span>
                </div>
              </div>

              {/* Información General de la Venta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant block">
                    Producto / Joya
                  </span>
                  <span className="font-bold text-xs text-on-surface block mt-0.5">
                    {selectedCertificado.producto_nombre}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant block">
                    Cliente Registrado
                  </span>
                  <span className="font-bold text-xs text-on-surface block mt-0.5 flex items-center space-x-1">
                    <User className="w-3 h-3 text-secondary" />
                    <span>{selectedCertificado.cliente_nombre || 'Cliente General'}</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant block">
                    Fecha de Venta
                  </span>
                  <span className="font-bold text-xs text-on-surface block mt-0.5 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-secondary" />
                    <span>{selectedCertificado.fecha_venta}</span>
                  </span>
                </div>
              </div>

              {/* DESGLOSE EXACTO DE LOTES Y COMPONENTES USADOS (TRAZABILIDAD ADMIN) */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-secondary" />
                  <h4 className="font-mono text-xs uppercase tracking-wider text-secondary font-bold">
                    Desglose de Lotes por Proveedor (Trazabilidad Admin)
                  </h4>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3 text-xs font-mono">
                  {/* Si el certificado incluye lotes dinámicos por proveedor */}
                  {(() => {
                    let lotesList: any[] = []
                    if (Array.isArray(selectedCertificado.lotes_detalle)) {
                      lotesList = selectedCertificado.lotes_detalle
                    } else if (typeof selectedCertificado.lotes_detalle === 'string') {
                      try {
                        const parsed = JSON.parse(selectedCertificado.lotes_detalle)
                        if (Array.isArray(parsed)) lotesList = parsed
                      } catch {
                        // ignore
                      }
                    }

                    return lotesList.length > 0 ? (
                      <div className="space-y-2">
                        {lotesList.map((lote: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl space-y-1">
                            <div className="flex items-center justify-between font-bold text-on-surface">
                              <span>{lote.material_nombre}</span>
                              <span className="text-amber-400 font-mono">{lote.cantidad} {lote.unidad}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                              <span>Proveedor: <strong className="text-amber-300">{lote.proveedor}</strong></span>
                              <span>Lote: <strong className="text-emerald-400">{lote.lote_codigo}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {/* Balines */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-outline-variant/20 gap-1">
                          <span className="text-on-surface-variant">Lote de Balines:</span>
                          <span className="font-bold text-on-surface">
                            {selectedCertificado.balines_proveedor}, Tamaño: {selectedCertificado.balines_tamano}, Cantidad: {selectedCertificado.balines_cantidad} unidades
                          </span>
                        </div>

                        {/* Hilo */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-outline-variant/20 gap-1">
                          <span className="text-on-surface-variant">Lote de Hilo:</span>
                          <span className="font-bold text-amber-300">
                            {selectedCertificado.hilo_tipo_lote}
                          </span>
                        </div>

                        {/* Esmeralda / Gemas */}
                        {selectedCertificado.esmeralda_lote && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-outline-variant/20 gap-1">
                            <span className="text-on-surface-variant">Lote Esmeralda / Gema:</span>
                            <span className="font-bold text-emerald-400">
                              {selectedCertificado.esmeralda_lote}
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}

                  {/* Precio de Venta */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-on-surface-variant">Precio Facturado:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatCurrency(selectedCertificado.precio_venta)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observaciones de Garantía */}
              {selectedCertificado.observaciones_garantia && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-xs font-mono space-y-1">
                  <span className="text-[10px] uppercase text-amber-400 font-bold block">
                    Notas de Garantía & Prevención de Fraude:
                  </span>
                  <p className="text-amber-200/90 leading-relaxed">
                    {selectedCertificado.observaciones_garantia}
                  </p>
                </div>
              )}

              {/* Acciones de Validación */}
              <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={`/certificados?codigo=${encodeURIComponent(selectedCertificado.codigo_certificado)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-mono text-secondary hover:underline font-bold"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Probar en Vista Pública del Cliente →</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleEliminarCertificado(selectedCertificado.id, selectedCertificado.codigo_certificado)}
                  className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-xs font-mono transition-all cursor-pointer shadow-md flex items-center space-x-1.5 shrink-0"
                  title="Eliminar este certificado"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Eliminar Certificado</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-3xl space-y-2">
              <ShieldCheck className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <p className="text-sm font-semibold text-on-surface">Selecciona un certificado</p>
              <p className="text-xs text-on-surface-variant">
                Selecciona un código de la lista para ver su radiografía técnica de lotes.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL REGISTRAR NUEVO CERTIFICADO DE VENTA (ADMIN EXCLUSIVO) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-surface">
                      Registrar Certificado & Trazabilidad de Venta
                    </h3>
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      Vinculación criptográfica de número de serie y lotes exactos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleGuardarCertificado} className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
                
                {/* Código de Certificado & Producto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-secondary font-bold">
                      Código Único de Garantía *
                    </label>
                    <input
                      type="text"
                      value={nuevoForm.codigo_certificado}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, codigo_certificado: e.target.value })}
                      placeholder="Ej: JHA-8472-ORO"
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-secondary uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-on-surface-variant font-bold flex items-center justify-between">
                      <span>Nombre del Producto *</span>
                      <span className="text-[10px] text-amber-400">⚡ Trae datos del Catálogo</span>
                    </label>
                    
                    {/* Desplegable de Selección Directa del Catálogo */}
                    {productosCatalogo.length > 0 && (
                      <select
                        onChange={(e) => handleSeleccionarProductoCatalogo(e.target.value)}
                        className="w-full mb-1.5 px-3 py-1.5 bg-surface-container-lowest border border-secondary/50 rounded-lg text-xs text-secondary font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Seleccionar producto del catálogo para autocompletar --</option>
                        {productosCatalogo.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.nombre} (${new Intl.NumberFormat('es-CO').format(prod.precio_venta || 0)} COP)
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      value={nuevoForm.producto_nombre}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, producto_nombre: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-secondary font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Cliente, Fecha y Precio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-on-surface-variant">
                      Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      value={nuevoForm.cliente_nombre}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, cliente_nombre: e.target.value })}
                      placeholder="Ej: Laura Gómez"
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-on-surface-variant">
                      Fecha de Venta *
                    </label>
                    <input
                      type="date"
                      value={nuevoForm.fecha_venta}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, fecha_venta: e.target.value })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-on-surface-variant">
                      Precio de Venta (COP)
                    </label>
                    <input
                      type="number"
                      value={nuevoForm.precio_venta}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, precio_venta: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                {/* Visualización de la Receta BOM Extraída del Catálogo */}
                {recetaBomCargada.length > 0 && (
                  <div className="p-3 bg-surface-container-lowest border border-secondary/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] uppercase text-secondary font-bold flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-secondary" />
                        <span>Insumos Extraídos del Catálogo (Constructor BOM)</span>
                      </span>
                      <span className="text-[9.5px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        {recetaBomCargada.length} Insumos Registrados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      {recetaBomCargada.map((item, idx) => (
                        <div key={idx} className="p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-on-surface truncate">{item.nombre}</span>
                          <span className="font-mono text-secondary font-bold shrink-0 ml-2">
                            {item.cantidad} {item.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TRAZABILIDAD DINÁMICA DE LOTES & PROVEEDORES (CRUD COMPLETO) */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-secondary/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase text-secondary font-bold block">
                        Lotes de Materiales Usados en esta Pieza & Trazabilidad por Proveedor
                      </span>
                      <p className="text-[10px] text-on-surface-variant/70 font-sans">
                        Control del inventario: agrega, edita o elimina los proveedores y lotes exactos de cada componente.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLoteItem}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-secondary/15 text-secondary hover:bg-secondary/30 transition-all flex items-center space-x-1 border border-secondary/40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Lote</span>
                    </button>
                  </div>

                  {/* Tabla / Lista CRUD de Lotes */}
                  <div className="space-y-2.5 pt-1">
                    {lotesForm.length === 0 ? (
                      <p className="text-[11px] text-on-surface-variant/60 italic text-center py-2">
                        No hay lotes asignados. Presiona "+ Agregar Lote" para vincular un proveedor.
                      </p>
                    ) : (
                      lotesForm.map((row, idx) => (
                        <div
                          key={row.id || idx}
                          className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                        >
                          {/* Insumo / Material */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[9.5px] uppercase text-on-surface-variant font-bold">
                              Insumo / Joya
                            </label>
                            <input
                              type="text"
                              value={row.material_nombre}
                              onChange={(e) => handleUpdateLoteItem(row.id, 'material_nombre', e.target.value)}
                              placeholder="Ej: Balines #8"
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-sans"
                            />
                          </div>

                          {/* Proveedor */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[9.5px] uppercase text-amber-400 font-bold">
                              Proveedor *
                            </label>
                            <input
                              type="text"
                              value={row.proveedor}
                              onChange={(e) => handleUpdateLoteItem(row.id, 'proveedor', e.target.value)}
                              placeholder="Ej: ALFA JOYERIA"
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-amber-500/40 rounded-lg text-xs text-amber-300 font-bold"
                            />
                          </div>

                          {/* Cantidad */}
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[9.5px] uppercase text-on-surface-variant">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={row.cantidad}
                              onChange={(e) => handleUpdateLoteItem(row.id, 'cantidad', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs font-mono text-on-surface"
                            />
                          </div>

                          {/* Código Lote / Serie */}
                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[9.5px] uppercase text-on-surface-variant">
                              Lote / Serie
                            </label>
                            <input
                              type="text"
                              value={row.lote_codigo}
                              onChange={(e) => handleUpdateLoteItem(row.id, 'lote_codigo', e.target.value)}
                              placeholder="Ej: LOT-BAL-882"
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs font-mono text-on-surface uppercase"
                            />
                          </div>

                          {/* Eliminar Fila */}
                          <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveLoteItem(row.id)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/15 rounded-lg transition-all"
                              title="Eliminar lote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notas de Garantía */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase text-on-surface-variant">
                    Observaciones para Validación de Garantía
                  </label>
                  <textarea
                    rows={2}
                    value={nuevoForm.observaciones_garantia}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, observaciones_garantia: e.target.value })}
                    placeholder="Detalles sobre ajuste de muñeca, personalización o garantía..."
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none font-sans"
                  />
                </div>

                {/* Footer Modal */}
                <div className="pt-3 border-t border-outline-variant/20 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Certificado'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
