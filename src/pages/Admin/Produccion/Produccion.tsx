import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Factory,
  Clock,
  Plus,
  RefreshCw,
  User,
  Scissors,
  ShieldCheck,
  Layers,
  Search,
  Trash2,
  PackageCheck,
  ChevronRight,
  ShieldAlert,
  X,
  CheckCircle2,
  Box,
  Tag,
  Edit3,
  Users,
  Phone,
  Calculator,
  MessageSquare,
  DollarSign,
  UserPlus,
  Image as ImageIcon,
  PlusCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { convertGoogleDriveUrl } from '../../../utils/driveUrlConverter'
import { processMediaUrl } from '../../../utils/mediaConverter'
import type { ProductoData } from '../../../types/productos'
import type { Material } from '../../../types/materiales'

// Modelo para el Directorio de Artesanos & Tejedores
export interface Artesano {
  id: string
  nombre: string
  especialidad: string
  telefono?: string
  tarifa_minuto: number
  activo?: boolean
}

// Modelo para los materiales / insumos BOM de la receta de producción
export interface MaterialInsumoRequerido {
  id: string
  material_id?: string
  nombre: string
  categoria?: string
  cantidad_por_unidad: number
  cantidad_total_requerida?: number
  unidad: string
  costo_unitario: number
  costo_total?: number
  proveedor?: string
  lote_codigo?: string
  stock_disponible?: number
  stock_suficiente?: boolean
}

// Modelo de la Orden de Producción
export interface OrdenProduccion {
  id: string
  codigo_op: string
  producto_id: string
  producto_nombre: string
  producto_imagen?: string | null
  cantidad: number
  artesano_id?: string
  artesano_nombre: string
  artesano_telefono?: string
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE'
  estado: 'PENDIENTE' | 'CORTE_MATERIAL' | 'TEJIDO' | 'CONTROL_CALIDAD' | 'COMPLETADO'
  fecha_inicio: string
  fecha_estimada_fin: string
  tiempo_estimado_min: number
  costo_mano_obra: number
  costo_estimado_materiales: number
  costo_total_produccion: number
  observaciones?: string
  insumos_bom: MaterialInsumoRequerido[]
  created_at?: string
}

// Lista Inicial de Artesanos Maestros de Demostración
const INITIAL_ARTESANOS: Artesano[] = [
  {
    id: 'art_1',
    nombre: 'Maestro Carlos Ruiz',
    especialidad: 'Oro 18K & Alta Joyería',
    telefono: '573001234567',
    tarifa_minuto: 180,
    activo: true
  },
  {
    id: 'art_2',
    nombre: 'Tejedora Clara Gómez',
    especialidad: 'Tejido Macramé & Nudos Sacros',
    telefono: '573109876543',
    tarifa_minuto: 150,
    activo: true
  },
  {
    id: 'art_3',
    nombre: 'Artesano Juan Pablo',
    especialidad: 'Engaste & Esmeraldas Muzo',
    telefono: '573205554433',
    tarifa_minuto: 160,
    activo: true
  }
]

// Recetas BOM pre-calculadas por producto
const MOCK_BOM_MAP: Record<string, MaterialInsumoRequerido[]> = {
  manilla_selva_dorada: [
    {
      id: 'bom_1',
      nombre: 'Balín Oro 18K (6mm Pulido Espejo)',
      categoria: 'Metales Preciosos',
      cantidad_por_unidad: 5,
      cantidad_total_requerida: 5,
      unidad: 'unidades',
      costo_unitario: 25000,
      costo_total: 125000,
      proveedor: 'OroNal Colombia S.A.',
      lote_codigo: 'LOTE-OR18K-9902',
      stock_disponible: 45,
      stock_suficiente: true
    },
    {
      id: 'bom_2',
      nombre: 'Esmeralda en Bruto de Muzo (3.5 ct)',
      categoria: 'Gemas Preciosas',
      cantidad_por_unidad: 1,
      cantidad_total_requerida: 1,
      unidad: 'unidades',
      costo_unitario: 75000,
      costo_total: 75000,
      proveedor: 'Minesa Muzo Esmeraldas',
      lote_codigo: 'LOTE-ESM-MUZO-42',
      stock_disponible: 12,
      stock_suficiente: true
    },
    {
      id: 'bom_3',
      nombre: 'Hilo Macramé Italiano (Verde Musgo 1mm)',
      categoria: 'Hilos & Cordones',
      cantidad_por_unidad: 1.5,
      cantidad_total_requerida: 1.5,
      unidad: 'metros',
      costo_unitario: 2000,
      costo_total: 3000,
      proveedor: 'Hilos & Sedas de Colombia',
      lote_codigo: 'LOTE-HIL-VERDE-08',
      stock_disponible: 150,
      stock_suficiente: true
    }
  ],
  rosario_imperial_18k: [
    {
      id: 'bom_4',
      nombre: 'Cruz Sacra Sacramental en Oro 18K',
      categoria: 'Metales Preciosos',
      cantidad_por_unidad: 1,
      cantidad_total_requerida: 1,
      unidad: 'unidades',
      costo_unitario: 90000,
      costo_total: 90000,
      proveedor: 'Joyas & Moldes Sacros Ltda',
      lote_codigo: 'LOTE-CRZ-18K-04',
      stock_disponible: 8,
      stock_suficiente: true
    },
    {
      id: 'bom_5',
      nombre: 'Balín Oro 18K (4mm Tallado)',
      categoria: 'Metales Preciosos',
      cantidad_por_unidad: 10,
      cantidad_total_requerida: 10,
      unidad: 'unidades',
      costo_unitario: 12000,
      costo_total: 120000,
      proveedor: 'OroNal Colombia S.A.',
      lote_codigo: 'LOTE-OR18K-8810',
      stock_disponible: 80,
      stock_suficiente: true
    },
    {
      id: 'bom_6',
      nombre: 'Hilo Cordón Café Imperial (1.2mm)',
      categoria: 'Hilos & Cordones',
      cantidad_por_unidad: 2,
      cantidad_total_requerida: 2,
      unidad: 'metros',
      costo_unitario: 1500,
      costo_total: 3000,
      proveedor: 'Hilos & Sedas de Colombia',
      lote_codigo: 'LOTE-HIL-CAFE-02',
      stock_disponible: 200,
      stock_suficiente: true
    }
  ],
  manilla_elemento_ancestral: [
    {
      id: 'bom_7',
      nombre: 'Balín Oro 18K (5mm Diamantado)',
      categoria: 'Metales Preciosos',
      cantidad_por_unidad: 4,
      cantidad_total_requerida: 4,
      unidad: 'unidades',
      costo_unitario: 18000,
      costo_total: 72000,
      proveedor: 'OroNal Colombia S.A.',
      lote_codigo: 'LOTE-OR18K-7712',
      stock_disponible: 30,
      stock_suficiente: true
    },
    {
      id: 'bom_8',
      nombre: 'Esmeralda Rodada Verde Muzo',
      categoria: 'Gemas Preciosas',
      cantidad_por_unidad: 1,
      cantidad_total_requerida: 1,
      unidad: 'unidades',
      costo_unitario: 50000,
      costo_total: 50000,
      proveedor: 'Minesa Muzo Esmeraldas',
      lote_codigo: 'LOTE-ESM-ROD-12',
      stock_disponible: 15,
      stock_suficiente: true
    },
    {
      id: 'bom_9',
      nombre: 'Hilo Macramé Negro Alta Resistencia',
      categoria: 'Hilos & Cordones',
      cantidad_por_unidad: 1.5,
      cantidad_total_requerida: 1.5,
      unidad: 'metros',
      costo_unitario: 2000,
      costo_total: 3000,
      proveedor: 'Hilos & Sedas de Colombia',
      lote_codigo: 'LOTE-HIL-NEGRO-01',
      stock_disponible: 300,
      stock_suficiente: true
    }
  ]
}

// Órdenes iniciales de demostración
const INITIAL_MOCK_ORDERS: OrdenProduccion[] = [
  {
    id: 'op_1001',
    codigo_op: 'OP-1001',
    producto_id: 'manilla_selva_dorada',
    producto_nombre: 'Manilla Selva Dorada',
    producto_imagen: '/elemento_editorial.jpg',
    cantidad: 3,
    artesano_id: 'art_2',
    artesano_nombre: 'Tejedora Clara Gómez',
    artesano_telefono: '573109876543',
    prioridad: 'URGENTE',
    estado: 'TEJIDO',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_estimada_fin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tiempo_estimado_min: 135,
    costo_mano_obra: 20250,
    costo_estimado_materiales: 609000,
    costo_total_produccion: 629250,
    observaciones: 'Cliente VIP requiere acabado en hilo verde musgo con 5 balines de Oro 18K.',
    insumos_bom: MOCK_BOM_MAP.manilla_selva_dorada.map((item) => ({
      ...item,
      cantidad_total_requerida: item.cantidad_por_unidad * 3,
      costo_total: item.costo_unitario * item.cantidad_por_unidad * 3
    })),
    created_at: new Date().toISOString()
  },
  {
    id: 'op_1002',
    codigo_op: 'OP-1002',
    producto_id: 'rosario_imperial_18k',
    producto_nombre: 'Rosario Imperial Sacro',
    producto_imagen: '/elemento_macro.jpg',
    cantidad: 2,
    artesano_id: 'art_1',
    artesano_nombre: 'Maestro Carlos Ruiz',
    artesano_telefono: '573001234567',
    prioridad: 'ALTA',
    estado: 'CORTE_MATERIAL',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_estimada_fin: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    tiempo_estimado_min: 120,
    costo_mano_obra: 21600,
    costo_estimado_materiales: 426000,
    costo_total_produccion: 447600,
    observaciones: 'Verificar lote de Cruz Sacra en Oro 18K antes del ensamble final.',
    insumos_bom: MOCK_BOM_MAP.rosario_imperial_18k.map((item) => ({
      ...item,
      cantidad_total_requerida: item.cantidad_por_unidad * 2,
      costo_total: item.costo_unitario * item.cantidad_por_unidad * 2
    })),
    created_at: new Date().toISOString()
  }
]

export default function AdminProduccion() {
  const navigate = useNavigate()

  // Estados Principales
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([])
  const [artesanos, setArtesanos] = useState<Artesano[]>([])
  const [productosCat, setProductosCat] = useState<ProductoData[]>([])
  const [materialesInventario, setMaterialesInventario] = useState<Material[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS')

  // Modal para Gestión de Artesanos (CRUD)
  const [isArtesanosModalOpen, setIsArtesanosModalOpen] = useState<boolean>(false)
  const [editingArtesanoId, setEditingArtesanoId] = useState<string | null>(null)
  const [artNombre, setArtNombre] = useState<string>('')
  const [artEspecialidad, setArtEspecialidad] = useState<string>('Tejido Macramé & Nudos Sacros')
  const [artTelefono, setArtTelefono] = useState<string>('')
  const [artTarifaMin, setArtTarifaMin] = useState<number>(150)

  // Modal para Nueva Orden de Producción
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedProdId, setSelectedProdId] = useState<string>('')
  const [cantidadNum, setCantidadNum] = useState<number>(1)
  const [selectedArtesanoId, setSelectedArtesanoId] = useState<string>('')
  const [prioridad, setPrioridad] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL')
  const [observaciones, setObservaciones] = useState<string>('')
  const [tiempoPersonalizadoMin, setTiempoPersonalizadoMin] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Modal para Inspeccionar Insumos BOM & Lotes
  const [inspectingOp, setInspectingOp] = useState<OrdenProduccion | null>(null)
  const [editingLotesMap, setEditingLotesMap] = useState<Record<string, { proveedor: string; lote_codigo: string }>>({})
  // Modal Rápido para Adjuntar / Cambiar Foto de Drive en Orden
  const [editingDrivePhotoOp, setEditingDrivePhotoOp] = useState<OrdenProduccion | null>(null)
  const [drivePhotoUrlInput, setDrivePhotoUrlInput] = useState<string>('')

  // Modal Calculadora BOM Completa & Ficha Técnica de Manilla (Publicar a Catálogo)
  const [isCreateManillaModalOpen, setIsCreateManillaModalOpen] = useState<boolean>(false)
  const [editingManillaId, setEditingManillaId] = useState<string | null>(null)
  const [manillaNombre, setManillaNombre] = useState<string>('')
  const [manillaCategoria, setManillaCategoria] = useState<string>('MANILLA_MACRAME')
  const [manillaDescripcion, setManillaDescripcion] = useState<string>('')
  const [manillaImagenUrl, setManillaImagenUrl] = useState<string>('')
  const [manillaGaleriaUrls, setManillaGaleriaUrls] = useState<string>('')
  const [manillaTiempoMin, setManillaTiempoMin] = useState<number>(35)
  const [manillaArtesanoId, setManillaArtesanoId] = useState<string>('')
  const [manillaRecetaBOM, setManillaRecetaBOM] = useState<Array<{ id: string; material_id: string; cantidad: number }>>([])
  const [manillaGastosPct, setManillaGastosPct] = useState<number>(10)
  const [manillaGananciaInternaPct, setManillaGananciaInternaPct] = useState<number>(25)
  const [manillaGananciaExternaPct, setManillaGananciaExternaPct] = useState<number>(40)
  const [manillaPrecioVentaManual, setManillaPrecioVentaManual] = useState<number>(0)
  const [manillaPrecioManualEditado, setManillaPrecioManualEditado] = useState<boolean>(false)
  const [isSubmittingManilla, setIsSubmittingManilla] = useState<boolean>(false)

  // Cargar Órdenes, Artesanos, Catálogo e Inventario
  const fetchDatosProduccion = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Cargar Artesanos Registrados (Supabase + LocalStorage)
      let artsList: Artesano[] = []
      try {
        const { data: aData } = await (supabase as any)
          .from('artesanos')
          .select('*')
          .order('nombre', { ascending: true })
        if (aData && aData.length > 0) artsList = aData
      } catch {
        console.warn('Tabla artesanos no leída en DB.')
      }

      let localArts: Artesano[] = []
      try {
        localOps: localArts = JSON.parse(localStorage.getItem('jhaular_artesanos') || '[]')
      } catch {
        // ignore
      }

      const mapArts = new Map<string, Artesano>()
      INITIAL_ARTESANOS.forEach((a) => mapArts.set(a.id, a))
      artsList.forEach((a) => mapArts.set(a.id, a))
      localArts.forEach((a) => mapArts.set(a.id, a))

      const artesanosFinales = Array.from(mapArts.values())
      setArtesanos(artesanosFinales)

      if (artesanosFinales.length > 0 && !selectedArtesanoId) {
        setSelectedArtesanoId(artesanosFinales[0].id)
      }

      // 2. Cargar Inventario de Materiales
      let mats: Material[] = []
      try {
        const { data: mData } = await supabase
          .from('materiales')
          .select('*')
          .order('nombre', { ascending: true })
        if (mData) mats = mData
      } catch (err) {
        console.warn('No se pudo leer inventario de materiales:', err)
      }
      setMaterialesInventario(mats)

      // 3. Cargar Catálogo de Productos
      const { data: prodsData } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true })

      let deletedIds: string[] = []
      try {
        deletedIds = JSON.parse(localStorage.getItem('jhaular_deleted_product_ids') || '[]')
      } catch {
        // ignore
      }

      let localProds: ProductoData[] = []
      try {
        localProds = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
      } catch {
        // ignore
      }

      const mapProds = new Map<string, ProductoData>()
      if (prodsData) prodsData.forEach((p) => { if (p.id && !deletedIds.includes(p.id)) mapProds.set(p.id, p) })
      localProds.forEach((p) => { if (p.id && !deletedIds.includes(p.id)) mapProds.set(p.id, p) })

      // Cargar recetas BOM locales guardadas en localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('jhaular_saved_bom_')) {
            const pId = key.replace('jhaular_saved_bom_', '')
            const savedBom = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(savedBom) && savedBom.length > 0) {
              const items = savedBom.map((item: any) => {
                const matObj = mats.find((m) => m.id === item.material_id)
                return {
                  id: item.material_id,
                  nombre: matObj?.nombre || 'Material Jhaular',
                  cantidad_por_unidad: Number(item.cantidad) || 1,
                  unidad: matObj?.unidad || 'unidad',
                  costo_unitario: matObj?.costo_unitario || 20000,
                  stock_disponible: matObj?.stock_actual || 50,
                  proveedor: matObj?.proveedor || 'Proveedor Nacional Jhaular'
                }
              })
              MOCK_BOM_MAP[pId] = items
            }
          }
        }
      } catch (bomErr) {
        console.warn('Error leyendo recetas BOM locales:', bomErr)
      }

      const listaProds = Array.from(mapProds.values())
      setProductosCat(listaProds)

      if (listaProds.length > 0 && !selectedProdId) {
        setSelectedProdId(listaProds[0].id || '')
      }

      // 4. Cargar Órdenes de Producción
      let opsFromDb: OrdenProduccion[] = []
      try {
        const { data: opsData } = await (supabase as any)
          .from('ordenes_produccion')
          .select('*')
          .order('created_at', { ascending: false })

        if (opsData && opsData.length > 0) {
          opsFromDb = opsData as OrdenProduccion[]
        }
      } catch {
        console.warn('Tabla ordenes_produccion no leída.')
      }

      let localOps: OrdenProduccion[] = []
      try {
        localOps = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
      } catch {
        // ignore
      }

      let deletedOpIds: string[] = []
      try {
        deletedOpIds = JSON.parse(localStorage.getItem('jhaular_deleted_orden_ids') || '[]')
      } catch {
        // ignore
      }

      const mapOps = new Map<string, OrdenProduccion>()
      INITIAL_MOCK_ORDERS.forEach((op) => {
        if (!deletedOpIds.includes(op.id) && !deletedIds.includes(op.producto_id)) {
          mapOps.set(op.id, op)
        }
      })
      opsFromDb.forEach((op) => {
        if (!deletedOpIds.includes(op.id) && !deletedIds.includes(op.producto_id)) {
          mapOps.set(op.id, op)
        }
      })
      localOps.forEach((op) => {
        if (!deletedOpIds.includes(op.id) && !deletedIds.includes(op.producto_id)) {
          mapOps.set(op.id, op)
        }
      })

      setOrdenes(Array.from(mapOps.values()))
    } catch (err) {
      console.error('Error cargando datos de producción:', err)
      setOrdenes(INITIAL_MOCK_ORDERS)
    } finally {
      setLoading(false)
    }
  }, [selectedProdId, selectedArtesanoId])

  const location = useLocation()

  useEffect(() => {
    fetchDatosProduccion()
  }, [fetchDatosProduccion])

  // Abrir automáticamente la Calculadora BOM cuando se hace clic en 'Editar BOM' desde Catálogo
  useEffect(() => {
    const editId = (location.state as any)?.editProdId || new URLSearchParams(location.search).get('edit')
    if (editId && productosCat.length > 0) {
      const targetProd = productosCat.find((p) => p.id === editId)
      if (targetProd) {
        handleOpenNuevaManilla(targetProd)
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, location.search, productosCat])

  // Producto Seleccionado en la Creación de OP
  const selectedProdInfo = useMemo(() => {
    return productosCat.find((p) => p.id === selectedProdId) || productosCat[0] || null
  }, [productosCat, selectedProdId])

  // Artesano Seleccionado en la Creación de OP
  const selectedArtesanoInfo = useMemo(() => {
    return artesanos.find((a) => a.id === selectedArtesanoId) || artesanos[0] || null
  }, [artesanos, selectedArtesanoId])

  // Sincronizar tiempo estimado cuando cambia el producto
  useEffect(() => {
    if (selectedProdInfo) {
      const tiempoBase = selectedProdInfo.tiempo_produccion_min || selectedProdInfo.tiempo_produccion || 35
      setTiempoPersonalizadoMin(tiempoBase)
    }
  }, [selectedProdInfo])

  // --- CALCULADORA EN TIEMPO REAL DE LA RECETA BOM E INSUMOS ---
  const insumosRequeridosCalculados = useMemo(() => {
    if (!selectedProdInfo) return []
    const keyId = selectedProdInfo.id || ''
    const baseBom = MOCK_BOM_MAP[keyId] || MOCK_BOM_MAP.manilla_selva_dorada
    const qty = Math.max(1, cantidadNum)

    return baseBom.map((item) => {
      const cantTotal = item.cantidad_por_unidad * qty
      const matReal = materialesInventario.find((m) =>
        m.nombre.toLowerCase().includes(item.nombre.split(' ')[0].toLowerCase())
      )

      const stockActual = matReal ? Number(matReal.stock_actual) || 50 : (item.stock_disponible || 50)
      const proveedor = matReal?.proveedor || item.proveedor || 'Proveedor Nacional Jhaular'
      const loteCodigo = (matReal as any)?.lote_codigo || item.lote_codigo || `LOTE-${Date.now().toString().substring(6)}`

      return {
        ...item,
        cantidad_total_requerida: cantTotal,
        costo_total: item.costo_unitario * cantTotal,
        proveedor,
        lote_codigo: loteCodigo,
        stock_disponible: stockActual,
        stock_suficiente: stockActual >= cantTotal
      }
    })
  }, [selectedProdInfo, cantidadNum, materialesInventario])

  // --- CALCULADORA EN TIEMPO REAL DE COSTO DE MANO DE OBRA Y PRODUCCIÓN ---
  const calculoContableOrden = useMemo(() => {
    const qty = Math.max(1, cantidadNum)
    const tiempoMinTotal = (tiempoPersonalizadoMin || 35) * qty
    const tarifaMin = selectedArtesanoInfo?.tarifa_minuto || 150
    const costoManoObraTotal = tiempoMinTotal * tarifaMin
    const costoMaterialesTotal = insumosRequeridosCalculados.reduce((acc, item) => acc + item.costo_total, 0)
    const costoTotalProduccion = costoMaterialesTotal + costoManoObraTotal

    return {
      tiempoMinTotal,
      costoManoObraTotal,
      costoMaterialesTotal,
      costoTotalProduccion,
      costoUnidad: Math.round(costoTotalProduccion / qty)
    }
  }, [cantidadNum, tiempoPersonalizadoMin, selectedArtesanoInfo, insumosRequeridosCalculados])

  // --- CALCULADORA DE MANILLA / JOYA Y MÁRGENES (FINANCIERA & BOM COMPLETA) ---
  const calculoBOMManilla = useMemo(() => {
    const costoInsumosBOM = manillaRecetaBOM.reduce((acc, item) => {
      const mat = materialesInventario.find((m) => m.id === item.material_id)
      const costUnit = mat?.costo_unitario || 20000
      return acc + (Number(item.cantidad) || 0) * Number(costUnit)
    }, 0)

    const artSelected = artesanos.find((a) => a.id === manillaArtesanoId) || artesanos[0]
    const tarifaMin = artSelected?.tarifa_minuto || 150
    const costoManoObraBOM = Math.max(0, manillaTiempoMin) * tarifaMin

    const costoDirectoBOM = costoInsumosBOM + costoManoObraBOM
    const costoGastosBOM = costoDirectoBOM * (manillaGastosPct / 100)
    const costoTotalBodegaBOM = costoDirectoBOM + costoGastosBOM

    const gananciaInternaCopBOM = costoTotalBodegaBOM * (manillaGananciaInternaPct / 100)

    const margenDecimalExt = Math.min(Math.max(manillaGananciaExternaPct, 0), 99) / 100
    const subtotalConGananciaInterna = costoTotalBodegaBOM + gananciaInternaCopBOM
    const calcPrecioSugerido = subtotalConGananciaInterna / (1 - margenDecimalExt)
    const precioSugeridoBOM = Math.ceil(calcPrecioSugerido / 100) * 100

    const precioVentaFinalBOM = manillaPrecioManualEditado && manillaPrecioVentaManual > 0
      ? manillaPrecioVentaManual
      : precioSugeridoBOM

    const gananciaExternaCopBOM = Math.max(0, precioVentaFinalBOM - costoTotalBodegaBOM - gananciaInternaCopBOM)

    return {
      costoInsumosBOM,
      costoManoObraBOM,
      costoDirectoBOM,
      costoGastosBOM,
      costoTotalBodegaBOM,
      gananciaInternaCopBOM,
      subtotalConGananciaInterna,
      precioSugeridoBOM,
      precioVentaFinalBOM,
      gananciaExternaCopBOM,
      artSelected
    }
  }, [
    manillaRecetaBOM,
    materialesInventario,
    artesanos,
    manillaArtesanoId,
    manillaTiempoMin,
    manillaGastosPct,
    manillaGananciaInternaPct,
    manillaGananciaExternaPct,
    manillaPrecioManualEditado,
    manillaPrecioVentaManual
  ])

  // Abrir Modal de Nueva Manilla / Joya con Valores Predeterminados
  const handleOpenNuevaManilla = (manillaToEdit?: ProductoData | null) => {
    if (manillaToEdit) {
      setEditingManillaId(manillaToEdit.id || null)
      setManillaNombre(manillaToEdit.nombre || '')
      setManillaCategoria(manillaToEdit.categoria || 'MANILLA_MACRAME')
      setManillaDescripcion(manillaToEdit.descripcion || '')
      setManillaImagenUrl(manillaToEdit.imagen_principal_url || manillaToEdit.imagen_url || '')
      setManillaTiempoMin(manillaToEdit.tiempo_produccion_min || manillaToEdit.tiempo_produccion || 35)
      setManillaGastosPct(10)
      setManillaGananciaInternaPct((manillaToEdit as any).margen_ganancia_interna_pct || 25)
      setManillaGananciaExternaPct(manillaToEdit.margen_ganancia_pct || 40)
      setManillaPrecioVentaManual(manillaToEdit.precio_venta || 0)
      setManillaPrecioManualEditado(false)

      // Cargar fotos de galería previas
      try {
        const locImgs = JSON.parse(localStorage.getItem(`jhaular_saved_gallery_${manillaToEdit.id}`) || '[]')
        setManillaGaleriaUrls(locImgs.map((i: any) => i.imagen_url).join('\n'))
      } catch {
        setManillaGaleriaUrls('')
      }

      // Cargar receta BOM previa de forma completa
      let loadedBom: Array<{ id: string; material_id: string; cantidad: number }> = []
      try {
        const savedBom = JSON.parse(localStorage.getItem(`jhaular_saved_bom_${manillaToEdit.id}`) || '[]')
        if (Array.isArray(savedBom) && savedBom.length > 0) {
          loadedBom = savedBom
        }
      } catch {
        // ignore
      }

      if (loadedBom.length === 0 && manillaToEdit.id && MOCK_BOM_MAP[manillaToEdit.id]) {
        loadedBom = MOCK_BOM_MAP[manillaToEdit.id].map((item) => ({
          id: item.id || crypto.randomUUID(),
          material_id: item.id,
          cantidad: item.cantidad_por_unidad || 1
        }))
      }

      if (loadedBom.length === 0 && materialesInventario.length > 0) {
        loadedBom = [
          { id: crypto.randomUUID(), material_id: materialesInventario[0].id, cantidad: 4 },
          { id: crypto.randomUUID(), material_id: materialesInventario[1]?.id || materialesInventario[0].id, cantidad: 1 }
        ]
      }

      setManillaRecetaBOM(loadedBom)
    } else {
      setEditingManillaId(null)
      setManillaNombre('')
      setManillaCategoria('MANILLA_MACRAME')
      setManillaDescripcion('')
      setManillaImagenUrl('')
      setManillaGaleriaUrls('')
      setManillaTiempoMin(35)
      setManillaGastosPct(10)
      setManillaGananciaInternaPct(25)
      setManillaGananciaExternaPct(40)
      setManillaPrecioVentaManual(0)
      setManillaPrecioManualEditado(false)
      if (materialesInventario.length > 0) {
        setManillaRecetaBOM([
          { id: crypto.randomUUID(), material_id: materialesInventario[0].id, cantidad: 4 },
          { id: crypto.randomUUID(), material_id: materialesInventario[1]?.id || materialesInventario[0].id, cantidad: 1 }
        ])
      } else {
        setManillaRecetaBOM([])
      }
    }
    if (artesanos.length > 0 && !manillaArtesanoId) {
      setManillaArtesanoId(artesanos[0].id)
    }
    setIsCreateManillaModalOpen(true)
  }

  // Guardar Manilla Completa y Publicar en Catálogo (con Galería de Fotos & Receta BOM)
  const handleGuardarManillaCompleta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manillaNombre.trim()) {
      alert('Por favor ingresa el nombre de la manilla antes de guardar.')
      return
    }

    try {
      setIsSubmittingManilla(true)
      const imagenLimpia = convertGoogleDriveUrl(manillaImagenUrl) || null
      const slugGenerado = manillaNombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
      const prodId = editingManillaId || `prod_${Date.now()}`

      const payload: Record<string, any> = {
        id: prodId,
        nombre: manillaNombre.trim(),
        slug: slugGenerado,
        categoria: manillaCategoria,
        descripcion: manillaDescripcion.trim() || null,
        imagen_principal_url: imagenLimpia,
        imagen_url: imagenLimpia,
        tiempo_produccion_min: Number(manillaTiempoMin),
        tiempo_produccion: Number(manillaTiempoMin),
        costo_materiales: Math.round(calculoBOMManilla.costoInsumosBOM),
        mano_obra: Math.round(calculoBOMManilla.costoManoObraBOM),
        costo_total_real: Math.round(calculoBOMManilla.costoTotalBodegaBOM),
        margen_ganancia_interna_pct: Number(manillaGananciaInternaPct),
        ganancia_interna_cop: Math.round(calculoBOMManilla.gananciaInternaCopBOM),
        margen_ganancia_pct: Number(manillaGananciaExternaPct),
        ganancia_externa_cop: Math.round(calculoBOMManilla.gananciaExternaCopBOM),
        precio_sugerido: Math.round(calculoBOMManilla.precioSugeridoBOM),
        precio_venta: Math.round(calculoBOMManilla.precioVentaFinalBOM),
        es_publico: true,
        activo: true
      }

      // 1. Guardar producto principal de forma resiliente
      try {
        const { error: upsertErr } = await supabase.from('productos').upsert([payload])
        if (upsertErr) {
          console.warn('Upsert completo falló en Supabase, reintentando con payload básico:', upsertErr)
          const payloadBasico = {
            id: prodId,
            nombre: manillaNombre.trim(),
            slug: slugGenerado,
            categoria: manillaCategoria,
            descripcion: manillaDescripcion.trim() || null,
            imagen_principal_url: imagenLimpia,
            imagen_url: imagenLimpia,
            precio_venta: Math.round(calculoBOMManilla.precioVentaFinalBOM),
            precio_sugerido: Math.round(calculoBOMManilla.precioSugeridoBOM),
            costo_materiales: Math.round(calculoBOMManilla.costoInsumosBOM),
            mano_obra: Math.round(calculoBOMManilla.costoManoObraBOM),
            costo_total_real: Math.round(calculoBOMManilla.costoTotalBodegaBOM),
            es_publico: true,
            activo: true
          }
          await supabase.from('productos').upsert([payloadBasico])
        }
      } catch (err) {
        console.warn('Upsert en Supabase falló, guardando en localStorage:', err)
      }

      // 2. Guardar Receta BOM asociada
      if (manillaRecetaBOM.length > 0) {
        try {
          localStorage.setItem(`jhaular_saved_bom_${prodId}`, JSON.stringify(manillaRecetaBOM))
        } catch (bErr) {
          console.warn('Error guardando receta BOM localmente:', bErr)
        }

        const recetaFormateada: MaterialInsumoRequerido[] = manillaRecetaBOM.map((item) => {
          const matObj = materialesInventario.find((m) => m.id === item.material_id)
          return {
            id: item.material_id,
            nombre: matObj?.nombre || 'Material Jhaular',
            cantidad_por_unidad: Number(item.cantidad) || 1,
            unidad: matObj?.unidad || 'unidad',
            costo_unitario: matObj?.costo_unitario || 20000,
            stock_disponible: matObj?.stock_actual || 50,
            proveedor: matObj?.proveedor || 'Proveedor Nacional Jhaular'
          }
        })
        MOCK_BOM_MAP[prodId] = recetaFormateada
      }

      // 3. Procesar fotos de carrusel adicionales
      const rawLines = manillaGaleriaUrls.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
      const galleryItems = rawLines.map((line) => processMediaUrl(line)).filter((m) => Boolean(m.url))

      if (galleryItems.length > 0) {
        const galleryPayload = galleryItems.map((item) => ({
          id: item.id || crypto.randomUUID(),
          producto_id: prodId,
          imagen_url: item.url
        }))

        try {
          await supabase.from('producto_imagenes').insert(galleryPayload)
        } catch (gErr) {
          console.warn('Guardando galería localmente:', gErr)
        }

        try {
          const locKey = `jhaular_saved_gallery_${prodId}`
          localStorage.setItem(locKey, JSON.stringify(galleryPayload))
        } catch {
          // ignore
        }
      }

      // 4. Guardar en localStorage 'jhaular_saved_productos'
      const prevSaved: ProductoData[] = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
      const filtered = prevSaved.filter((p) => p.id !== payload.id)
      localStorage.setItem('jhaular_saved_productos', JSON.stringify([payload, ...filtered]))

      const nuevaManillaData = payload as ProductoData
      setProductosCat((prev) => {
        const exists = prev.some((p) => p.id === payload.id)
        if (exists) return prev.map((p) => (p.id === payload.id ? nuevaManillaData : p))
        return [nuevaManillaData, ...prev]
      })

      setSelectedProdId(payload.id)
      setIsCreateManillaModalOpen(false)
      alert(`¡Manilla "${payload.nombre}" guardada exitosamente y publicada en el Catálogo y Taller!`)
    } catch (err) {
      console.error('Error guardando manilla:', err)
      alert('Ocurrió un error al guardar la manilla. Por favor intenta de nuevo.')
    } finally {
      setIsSubmittingManilla(false)
    }
  }

  // Guardar Foto de Google Drive en Orden y en Catálogo
  const handleGuardarFotoDriveOrden = async () => {
    if (!editingDrivePhotoOp) return
    const cleanedUrl = convertGoogleDriveUrl(drivePhotoUrlInput) || drivePhotoUrlInput.trim()

    const opActualizada = { ...editingDrivePhotoOp, producto_imagen: cleanedUrl }

    // 1. Actualizar estado de órdenes en Producción
    setOrdenes((prev) => prev.map((o) => (o.id === editingDrivePhotoOp.id ? opActualizada : o)))

    // 2. Persistir en localStorage de órdenes
    try {
      const localSaved: OrdenProduccion[] = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
      const updatedLocal = localSaved.map((o) => (o.id === editingDrivePhotoOp.id ? opActualizada : o))
      localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify(updatedLocal))
    } catch {
      // ignore
    }

    // 3. Sincronizar imagen con el Producto correspondiente en el Catálogo
    const prodId = editingDrivePhotoOp.producto_id
    if (prodId) {
      try {
        await supabase
          .from('productos')
          .update({ imagen_principal_url: cleanedUrl, imagen_url: cleanedUrl })
          .eq('id', prodId)
      } catch (err) {
        console.warn('Actualizando foto en Supabase:', err)
      }

      try {
        const localProds: ProductoData[] = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
        const updatedProds = localProds.map((p) =>
          p.id === prodId ? { ...p, imagen_principal_url: cleanedUrl, imagen_url: cleanedUrl } : p
        )
        localStorage.setItem('jhaular_saved_productos', JSON.stringify(updatedProds))

        setProductosCat((prev) =>
          prev.map((p) => (p.id === prodId ? { ...p, imagen_principal_url: cleanedUrl, imagen_url: cleanedUrl } : p))
        )
      } catch {
        // ignore
      }
    }

    setEditingDrivePhotoOp(null)
    setDrivePhotoUrlInput('')
  }

  // Guardar o Actualizar Artesano (CRUD)
  const handleGuardarArtesano = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artNombre.trim()) return

    const artObj: Artesano = {
      id: editingArtesanoId || `art_${Date.now()}`,
      nombre: artNombre.trim(),
      especialidad: artEspecialidad.trim(),
      telefono: artTelefono.trim() || undefined,
      tarifa_minuto: Math.max(50, artTarifaMin),
      activo: true
    }

    try {
      await (supabase as any).from('artesanos').upsert([artObj])
    } catch (err) {
      console.warn('Guardando artesano en LocalStorage:', err)
    }

    const prevArts = JSON.parse(localStorage.getItem('jhaular_artesanos') || '[]')
    const filtered = prevArts.filter((a: Artesano) => a.id !== artObj.id)
    localStorage.setItem('jhaular_artesanos', JSON.stringify([artObj, ...filtered]))

    setArtesanos((prev) => {
      const exists = prev.some((a) => a.id === artObj.id)
      if (exists) return prev.map((a) => (a.id === artObj.id ? artObj : a))
      return [...prev, artObj]
    })

    setEditingArtesanoId(null)
    setArtNombre('')
    setArtTelefono('')
    setArtTarifaMin(150)
  }

  // Eliminar Artesano
  const handleEliminarArtesano = async (id: string) => {
    if (!confirm('¿Deseas eliminar este artesano de la lista?')) return
    try {
      await (supabase as any).from('artesanos').delete().eq('id', id)
    } catch {
      // ignore
    }
    const prevArts: Artesano[] = JSON.parse(localStorage.getItem('jhaular_artesanos') || '[]')
    const filtered = prevArts.filter((a) => a.id !== id)
    localStorage.setItem('jhaular_artesanos', JSON.stringify(filtered))

    setArtesanos((prev) => prev.filter((a) => a.id !== id))
  }

  // Crear Nueva Orden de Producción Inteligente
  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProdInfo || !selectedArtesanoInfo) return

    try {
      setIsSubmitting(true)
      const newId = `op_${Date.now()}`
      const numCodigo = ordenes.length + 1001
      const codigoOp = `OP-${numCodigo}`

      const nuevaOP: OrdenProduccion = {
        id: newId,
        codigo_op: codigoOp,
        producto_id: selectedProdInfo.id || 'desconocido',
        producto_nombre: selectedProdInfo.nombre,
        producto_imagen: selectedProdInfo.imagen_principal_url || selectedProdInfo.imagen_url,
        cantidad: Math.max(1, cantidadNum),
        artesano_id: selectedArtesanoInfo.id,
        artesano_nombre: selectedArtesanoInfo.nombre,
        artesano_telefono: selectedArtesanoInfo.telefono,
        prioridad,
        estado: 'PENDIENTE',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_estimada_fin: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        tiempo_estimado_min: calculoContableOrden.tiempoMinTotal,
        costo_mano_obra: calculoContableOrden.costoManoObraTotal,
        costo_estimado_materiales: calculoContableOrden.costoMaterialesTotal,
        costo_total_produccion: calculoContableOrden.costoTotalProduccion,
        observaciones: observaciones.trim() || undefined,
        insumos_bom: insumosRequeridosCalculados,
        created_at: new Date().toISOString()
      }

      // Persistir en Supabase
      try {
        await (supabase as any).from('ordenes_produccion').insert([nuevaOP])
      } catch (dbErr) {
        console.warn('Persistiendo OP en LocalStorage por BD:', dbErr)
      }

      // Persistir en LocalStorage
      const prevOps = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
      localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify([nuevaOP, ...prevOps]))

      setOrdenes((prev) => [nuevaOP, ...prev])
      setIsModalOpen(false)
      setObservaciones('')
      setCantidadNum(1)
    } catch (err) {
      console.error('Error creando orden de producción:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enviar Ficha de Producción por WhatsApp al Artesano
  const handleEnviarWhatsAppArtesano = (op: OrdenProduccion) => {
    const tel = op.artesano_telefono ? op.artesano_telefono.replace(/[^0-9]/g, '') : '573215964456'
    const insumosStr = op.insumos_bom
      ?.map((item) => `  • ${item.nombre}: ${item.cantidad_total_requerida} ${item.unidad}`)
      .join('\n')

    const mensaje = encodeURIComponent(
      `¡Hola *${op.artesano_nombre}*! Tienes asignada la Orden de Producción *${op.codigo_op}* en Jhaular Atelier:\n\n` +
      `📦 *ORDEN DE CONFECCIÓN*:\n` +
      `• *Pieza*: ${op.producto_nombre}\n` +
      `• *Cantidad*: ${op.cantidad} unidad(es)\n` +
      `• *Tiempo Estimado*: ${op.tiempo_estimado_min} minutos\n` +
      `• *Prioridad*: ${op.prioridad}\n\n` +
      `🛠️ *INSUMOS REQUERIDOS (BOM)*:\n${insumosStr || '  • Balines de Oro 18K & Hilos'}\n\n` +
      (op.observaciones ? `📝 *NOTAS*: ${op.observaciones}\n\n` : '') +
      `Por favor confirma cuando inicies el tejido de las piezas.`
    )

    window.open(`https://wa.me/${tel}?text=${mensaje}`, '_blank')
  }

  // Avanzar Estado de la Orden
  const handleAvanzarEstado = async (opId: string, proximoEstado: OrdenProduccion['estado']) => {
    try {
      const ordenPrev = ordenes.find((o) => o.id === opId)
      if (!ordenPrev) return

      const updated = { ...ordenPrev, estado: proximoEstado }

      if (proximoEstado === 'CORTE_MATERIAL' || proximoEstado === 'COMPLETADO') {
        for (const insumo of ordenPrev.insumos_bom || []) {
          if (insumo.material_id) {
            try {
              const { data: mRow } = await supabase
                .from('materiales')
                .select('stock_actual')
                .eq('id', insumo.material_id)
                .maybeSingle()

              if (mRow) {
                const stockActual = Number(mRow.stock_actual) || 0
                const nuevoStock = Math.max(0, stockActual - (insumo.cantidad_total_requerida || 0))
                await supabase.from('materiales').update({ stock_actual: nuevoStock }).eq('id', insumo.material_id)
              }
            } catch (invErr) {
              console.warn('Error descontando stock:', invErr)
            }
          }
        }
      }

      try {
        await (supabase as any).from('ordenes_produccion').update({ estado: proximoEstado }).eq('id', opId)
      } catch (err) {
        console.warn('Error actualizando estado:', err)
      }

      const localSaved: OrdenProduccion[] = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
      const updatedLocal = localSaved.map((o) => (o.id === opId ? { ...o, estado: proximoEstado } : o))
      localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify(updatedLocal))

      setOrdenes((prev) => prev.map((o) => (o.id === opId ? updated : o)))
    } catch (err) {
      console.error('Error al avanzar estado:', err)
    }
  }

  // Eliminar Orden
  const handleEliminarOrden = async (opId: string) => {
    if (!confirm('¿Deseas eliminar esta orden de producción?')) return
    try {
      try {
        await (supabase as any).from('ordenes_produccion').delete().eq('id', opId)
      } catch {
        // ignore
      }

      // 1. Guardar en lista de IDs de órdenes eliminadas para persistencia total
      let deletedOpIds: string[] = []
      try {
        deletedOpIds = JSON.parse(localStorage.getItem('jhaular_deleted_orden_ids') || '[]')
      } catch {
        // ignore
      }
      if (!deletedOpIds.includes(opId)) {
        deletedOpIds.push(opId)
        localStorage.setItem('jhaular_deleted_orden_ids', JSON.stringify(deletedOpIds))
      }

      // 2. Filtrar de jhaular_ordenes_produccion en localStorage
      const localSaved: OrdenProduccion[] = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
      const filtered = localSaved.filter((o) => o.id !== opId)
      localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify(filtered))

      setOrdenes((prev) => prev.filter((o) => o.id !== opId))
    } catch (err) {
      console.error('Error eliminando orden:', err)
    }
  }

  // Vaciar Todas las Órdenes de Producción
  const handleVaciarTodasLasOrdenes = async () => {
    if (!confirm('¿Deseas eliminar TODAS las órdenes de producción del taller? Esta acción no se puede deshacer.')) return
    try {
      const opIds = ordenes.map((o) => o.id)
      let deletedOpIds: string[] = []
      try {
        deletedOpIds = JSON.parse(localStorage.getItem('jhaular_deleted_orden_ids') || '[]')
      } catch {
        // ignore
      }
      opIds.forEach((id) => {
        if (id && !deletedOpIds.includes(id)) deletedOpIds.push(id)
      })
      localStorage.setItem('jhaular_deleted_orden_ids', JSON.stringify(deletedOpIds))
      localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify([]))

      try {
        await (supabase as any).from('ordenes_produccion').delete().neq('id', '0')
      } catch {
        // ignore
      }

      setOrdenes([])
      alert('Todas las órdenes de producción han sido eliminadas del taller.')
    } catch (err) {
      console.error('Error vaciando órdenes:', err)
    }
  }

  // Eliminar Producto / Manilla del Catálogo y Producción
  const handleEliminarManilla = async (prodId: string) => {
    const prodObj = productosCat.find((p) => p.id === prodId)
    const nombreProd = prodObj?.nombre || 'esta manilla'

    if (!confirm(`¿Estás seguro de eliminar "${nombreProd}" del catálogo y de la lista de producción?`)) return

    try {
      try {
        await supabase.from('producto_imagenes').delete().eq('producto_id', prodId)
        await supabase.from('productos').delete().eq('id', prodId)
      } catch (dbErr) {
        console.warn('Error eliminando producto de Supabase:', dbErr)
      }

      let deletedIds: string[] = []
      try {
        deletedIds = JSON.parse(localStorage.getItem('jhaular_deleted_product_ids') || '[]')
      } catch {
        // ignore
      }
      if (!deletedIds.includes(prodId)) {
        deletedIds.push(prodId)
        localStorage.setItem('jhaular_deleted_product_ids', JSON.stringify(deletedIds))
      }

      try {
        const localSaved: ProductoData[] = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
        const filtered = localSaved.filter((p) => p.id !== prodId)
        localStorage.setItem('jhaular_saved_productos', JSON.stringify(filtered))
        localStorage.removeItem(`jhaular_saved_bom_${prodId}`)
        localStorage.removeItem(`jhaular_saved_gallery_${prodId}`)
      } catch {
        // ignore
      }

      const nuevosProductos = productosCat.filter((p) => p.id !== prodId)
      setProductosCat(nuevosProductos)

      // Eliminar también las órdenes asociadas a esta manilla de la producción
      const ordenesAsociadas = ordenes.filter(
        (o) => o.producto_id === prodId || (nombreProd && o.producto_nombre === nombreProd)
      )
      if (ordenesAsociadas.length > 0) {
        let deletedOpIds: string[] = []
        try {
          deletedOpIds = JSON.parse(localStorage.getItem('jhaular_deleted_orden_ids') || '[]')
        } catch {
          // ignore
        }
        ordenesAsociadas.forEach((o) => {
          if (!deletedOpIds.includes(o.id)) deletedOpIds.push(o.id)
        })
        localStorage.setItem('jhaular_deleted_orden_ids', JSON.stringify(deletedOpIds))

        try {
          const localSavedOps: OrdenProduccion[] = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
          const filteredOps = localSavedOps.filter(
            (o) => o.producto_id !== prodId && o.producto_nombre !== nombreProd
          )
          localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify(filteredOps))
        } catch {
          // ignore
        }

        try {
          await (supabase as any).from('ordenes_produccion').delete().eq('producto_id', prodId)
        } catch {
          // ignore
        }

        setOrdenes((prev) =>
          prev.filter((o) => o.producto_id !== prodId && o.producto_nombre !== nombreProd)
        )
      }

      if (selectedProdId === prodId) {
        setSelectedProdId(nuevosProductos[0]?.id || '')
      }

      if (isCreateManillaModalOpen && editingManillaId === prodId) {
        setIsCreateManillaModalOpen(false)
      }

      alert(`¡"${nombreProd}" ha sido eliminada correctamente del catálogo y producción!`)
    } catch (err) {
      console.error('Error al eliminar la manilla:', err)
      alert('No se pudo eliminar la manilla.')
    }
  }

  // Métricas y Resumen Contable en Tiempo Real
  const metricas = useMemo(() => {
    const activas = ordenes.filter((o) => o.estado !== 'COMPLETADO')
    const enTejido = ordenes.filter((o) => o.estado === 'TEJIDO')
    const completadas = ordenes.filter((o) => o.estado === 'COMPLETADO')

    const tiempoTotalMin = activas.reduce((acc, o) => acc + (o.tiempo_estimado_min || 0), 0)
    const costoInsumosTotal = activas.reduce((acc, o) => acc + (o.costo_estimado_materiales || 0), 0)
    const costoManoObraTotal = activas.reduce((acc, o) => acc + (o.costo_mano_obra || 0), 0)

    return {
      totalActivas: activas.length,
      enTejidoCount: enTejido.length,
      completadasCount: completadas.length,
      horasTotales: (tiempoTotalMin / 60).toFixed(1),
      costoInsumosTotal,
      costoManoObraTotal
    }
  }, [ordenes])

  // Filtrado de órdenes
  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((op) => {
      const matchSearch =
        op.codigo_op.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.producto_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.artesano_nombre.toLowerCase().includes(searchQuery.toLowerCase())

      const matchEstado = selectedEstado === 'TODOS' || op.estado === selectedEstado

      return matchSearch && matchEstado
    })
  }, [ordenes, searchQuery, selectedEstado])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  const getEstadoBadge = (estado: OrdenProduccion['estado']) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">PENDIENTE DE ENSAMBLE</span>
      case 'CORTE_MATERIAL':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">CORTE DE HILO & LOTES</span>
      case 'TEJIDO':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">EN TEJIDO ARTESANAL</span>
      case 'CONTROL_CALIDAD':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">CONTROL DE CALIDAD & BÓVEDA</span>
      case 'COMPLETADO':
        return <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">PIEZA FINALIZADA</span>
      default:
        return null
    }
  }

  const getPrioridadBadge = (p: OrdenProduccion['prioridad']) => {
    switch (p) {
      case 'URGENTE':
        return <span className="text-[9.5px] font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/50 flex items-center space-x-1"><ShieldAlert className="w-3 h-3" /><span>URGENTE VIP</span></span>
      case 'ALTA':
        return <span className="text-[9.5px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">ALTA</span>
      default:
        return <span className="text-[9.5px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">NORMAL</span>
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Módulo de Producción Inteligente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25221E] pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Factory className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface tracking-wide">
              Órdenes de Producción & Taller de Ensamble
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Calculadora en vivo de insumos BOM (Oro 18K, Esmeraldas), gestión de artesanos y asignación directa por WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsArtesanosModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-md"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>👥 Directorio de Artesanos ({artesanos.length})</span>
          </button>

          <button
            onClick={fetchDatosProduccion}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => handleOpenNuevaManilla(null)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-md cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Calculadora BOM & Nueva Manilla</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Orden de Producción</span>
          </button>
        </div>
      </div>

      {/* Dashboard de Métricas de Ensamble */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Órdenes Activas */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-[#25221E] space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Órdenes Activas</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">{metricas.totalActivas}</p>
          <p className="text-[10px] text-slate-400 font-mono">En taller y mesa de tejido</p>
        </div>

        {/* 2. En Tejido Artesanal */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-[#25221E] space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">En Tejido Activo</span>
            <Scissors className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-300">{metricas.enTejidoCount}</p>
          <p className="text-[10px] text-purple-400/80 font-mono">Artesanos confeccionando</p>
        </div>

        {/* 3. Tiempo Comprometido */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-[#25221E] space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Carga de Trabajo</span>
            <Clock className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-bold font-mono text-secondary">{metricas.horasTotales} Horas</p>
          <p className="text-[10px] text-slate-400 font-mono">Mano de obra: {formatCurrency(metricas.costoManoObraTotal)}</p>
        </div>

        {/* 4. Valor Insumos Comprometidos */}
        <div className="p-4 rounded-2xl bg-[#141418] border border-[#25221E] space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">Insumos BOM Reservados</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-400">
            {formatCurrency(metricas.costoInsumosTotal)}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Balines, esmeraldas & hilos</p>
        </div>
      </div>

      {/* Toolbar de Búsqueda y Filtros de Estado */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#131317] p-3 rounded-xl border border-[#25221E]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (OP-1001), pieza o artesano asignado..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none font-medium cursor-pointer"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="CORTE_MATERIAL">En Corte & Lotes</option>
            <option value="TEJIDO">En Tejido</option>
            <option value="CONTROL_CALIDAD">Control Calidad</option>
            <option value="COMPLETADO">Completadas</option>
          </select>

          {ordenes.length > 0 && (
            <button
              onClick={handleVaciarTodasLasOrdenes}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/40 transition-all cursor-pointer shadow-sm shrink-0"
              title="Vaciar todas las órdenes de producción del taller"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Vaciar Órdenes</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Órdenes de Producción */}
      {loading && ordenes.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-[#131317] border border-[#25221E] rounded-2xl">
          <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">
            Cargando taller de producción...
          </p>
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-[#131317] border border-[#25221E] rounded-2xl">
          <Factory className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
          <p className="text-sm font-medium text-on-surface">No hay órdenes de producción con esos criterios</p>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            Crea una nueva orden de producción con el botón "+ Nueva Orden" para asignar tareas al taller.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ordenesFiltradas.map((op) => {
            const displayImg = convertGoogleDriveUrl(op.producto_imagen) || '/elemento_editorial.jpg'
            const insumosCount = op.insumos_bom?.length || 0

            return (
              <div
                key={op.id}
                className="bg-[#141418] border border-[#2A2723] rounded-2xl overflow-hidden shadow-xl hover:border-secondary/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado Tarjeta OP */}
                  <div className="p-4 bg-[#18181E] border-b border-[#25221E] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-secondary tracking-wider">
                        {op.codigo_op}
                      </span>
                      {getPrioridadBadge(op.prioridad)}
                    </div>
                    {getEstadoBadge(op.estado)}
                  </div>

                  {/* Detalle Producto & Artesano */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                        <img
                          src={displayImg}
                          alt={op.producto_nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/elemento_editorial.jpg'
                          }}
                        />
                      </div>

                      <div className="space-y-1 overflow-hidden flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="font-bold text-sm text-slate-100 line-clamp-1">
                            {op.producto_nombre}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDrivePhotoOp(op)
                              setDrivePhotoUrlInput(op.producto_imagen || '')
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                            title="Adjuntar o cambiar enlace de foto en Google Drive"
                          >
                            <ImageIcon className="w-3 h-3 text-amber-400" />
                            <span>Foto Drive</span>
                          </button>
                        </div>
                        <p className="text-xs font-mono text-emerald-400 font-semibold">
                          Cantidad a confeccionar: {op.cantidad} {op.cantidad === 1 ? 'unidad' : 'unidades'}
                        </p>
                      </div>
                    </div>

                    {/* ARTESANO ASIGNADO + BOTÓN DIRECTO DE WHATSAPP */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
                          <User className="w-3.5 h-3.5" />
                          <span>Artesano:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEnviarWhatsAppArtesano(op)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all text-[10.5px] font-bold flex items-center space-x-1 cursor-pointer"
                          title="Enviar detalles de la orden por WhatsApp al artesano"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                      <p className="text-slate-200 font-bold">{op.artesano_nombre}</p>
                    </div>

                    {/* VISTA PREVIA DE INSUMOS BOM & BALINES */}
                    <div className="p-3 rounded-xl bg-[#18181E] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-amber-300 flex items-center space-x-1">
                          <Box className="w-3.5 h-3.5 text-amber-400" />
                          <span>Insumos BOM ({insumosCount})</span>
                        </span>

                        <button
                          onClick={() => {
                            setInspectingOp(op)
                            const initialMap: Record<string, { proveedor: string; lote_codigo: string }> = {}
                            op.insumos_bom?.forEach((item) => {
                              initialMap[item.id] = {
                                proveedor: item.proveedor || '',
                                lote_codigo: item.lote_codigo || ''
                              }
                            })
                            setEditingLotesMap(initialMap)
                          }}
                          className="text-[10.5px] text-amber-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Ver / Lotes</span>
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono text-slate-300">
                        {op.insumos_bom?.slice(0, 2).map((mat) => (
                          <div key={mat.id} className="flex items-center justify-between text-[10.5px] border-b border-slate-800/60 pb-1">
                            <span className="truncate max-w-[170px]">• {mat.nombre}</span>
                            <span className="font-bold text-emerald-400">{mat.cantidad_total_requerida} {mat.unidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Especificaciones Contables & Tiempos */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-[#18181E] border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400 block uppercase">Tiempo Ensamble</span>
                        <span className="font-bold text-slate-200 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-secondary shrink-0" />
                          <span>{op.tiempo_estimado_min} min</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#18181E] border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400 block uppercase">Costo Insumos BOM</span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(op.costo_estimado_materiales)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones de la Orden */}
                <div className="p-3 bg-[#101014] border-t border-[#25221E] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    {op.estado !== 'COMPLETADO' && (
                      <button
                        onClick={() => {
                          const mapaSiguiente: Record<OrdenProduccion['estado'], OrdenProduccion['estado']> = {
                            PENDIENTE: 'CORTE_MATERIAL',
                            CORTE_MATERIAL: 'TEJIDO',
                            TEJIDO: 'CONTROL_CALIDAD',
                            CONTROL_CALIDAD: 'COMPLETADO',
                            COMPLETADO: 'COMPLETADO'
                          }
                          handleAvanzarEstado(op.id, mapaSiguiente[op.estado])
                        }}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 font-bold transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Avanzar Estado</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {op.estado === 'COMPLETADO' && (
                      <button
                        onClick={() => navigate('/admin/certificados')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>🛡️ Certificar Joya</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleEliminarOrden(op.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all cursor-pointer"
                    title="Eliminar orden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal 1: Crear Nueva Orden de Producción con Calculadora Inteligente en Tiempo Real */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#141418] border border-[#2D2A26] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#18181E] border-b border-[#2D2A26] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-display">
                    Calculadora Inteligente & Nueva Orden de Producción
                  </h3>
                  <p className="text-[11px] font-mono text-amber-400">
                    Cálculo en vivo de Mano de Obra + Insumos BOM + Tiempos de Tejido
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOrden} className="p-6 overflow-y-auto space-y-5">
              {/* PASO 1: Seleccionar Producto del Catálogo */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                  1. Seleccionar Pieza a Confeccionar del Catálogo
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
                  required
                >
                  {productosCat.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {formatCurrency(p.precio_venta)}
                    </option>
                  ))}
                </select>
              </div>

              {/* PASO 2: Cantidad, Prioridad y Asignación de Artesano */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                    Cantidad a Confeccionar
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadNum}
                    onChange={(e) => setCantidadNum(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                    Artesano / Tejedora
                  </label>
                  <select
                    value={selectedArtesanoId}
                    onChange={(e) => setSelectedArtesanoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
                  >
                    {artesanos.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.nombre} (${art.tarifa_minuto}/min)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="ALTA">ALTA</option>
                    <option value="URGENTE">URGENTE VIP</option>
                  </select>
                </div>
              </div>

              {/* PASO 3: CALCULADORA CONTABLE DE ENSAMBLE EN TIEMPO REAL */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-3 font-mono text-xs shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center space-x-1.5">
                    <Calculator className="w-4 h-4" />
                    <span>Calculadora de Producción por Lote ({cantidadNum} pz)</span>
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">
                    Total: {formatCurrency(calculoContableOrden.costoTotalProduccion)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#141418] border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] block">Mano de Obra</span>
                    <span className="font-bold text-slate-200">{formatCurrency(calculoContableOrden.costoManoObraTotal)}</span>
                    <span className="text-[9.5px] text-slate-400 block">{calculoContableOrden.tiempoMinTotal} min × ${selectedArtesanoInfo?.tarifa_minuto || 150}/min</span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#141418] border border-slate-800 space-y-0.5">
                    <span className="text-slate-400 text-[10px] block">Costo Insumos (BOM)</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(calculoContableOrden.costoMaterialesTotal)}</span>
                    <span className="text-[9.5px] text-slate-400 block">Balines, esmeraldas & hilos</span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#141418] border border-slate-800 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 text-[10px] block">Costo Unidad</span>
                    <span className="font-bold text-amber-400 text-sm">{formatCurrency(calculoContableOrden.costoUnidad)}</span>
                    <span className="text-[9.5px] text-slate-400 block">Costo real en bodega</span>
                  </div>
                </div>

                {/* Lista de Insumos Calculados */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Resumen de Materiales a Utilizar:</p>
                  {insumosRequeridosCalculados.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between text-[10.5px] text-slate-300 bg-[#141418] p-1.5 rounded border border-slate-800/80">
                      <span>• {mat.nombre}</span>
                      <span className="font-bold text-emerald-400">{mat.cantidad_total_requerida} {mat.unidad} ({formatCurrency(mat.costo_total)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                  Instrucciones o Notas Especiales
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={2}
                  placeholder="Ej: Calibre de hilo negro, balines en pulido espejo, pedido prioritario cliente Medellín..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-secondary text-on-secondary hover:bg-secondary/90 font-bold font-mono text-xs rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Creando Orden...' : 'Crear Orden de Producción'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Directorio & Gestión CRUD de Artesanos / Tejedores */}
      {isArtesanosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#141418] border border-[#2D2A26] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#18181E] border-b border-[#2D2A26] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-display">
                    Directorio & Gestión de Artesanos / Tejedores
                  </h3>
                  <p className="text-[11px] font-mono text-amber-400">
                    Administración de maestros artesanos, tarifas por minuto y teléfonos para WhatsApp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArtesanosModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
              {/* Formulario Agregar / Editar Artesano */}
              <form onSubmit={handleGuardarArtesano} className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
                <h4 className="font-bold text-amber-300 flex items-center space-x-1.5 text-xs">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{editingArtesanoId ? 'Editar Artesano' : '+ Registrar Nuevo Artesano / Tejedora'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Nombre del Artesano</label>
                    <input
                      type="text"
                      value={artNombre}
                      onChange={(e) => setArtNombre(e.target.value)}
                      placeholder="Ej: Maestro Carlos Ruiz"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Especialidad</label>
                    <input
                      type="text"
                      value={artEspecialidad}
                      onChange={(e) => setArtEspecialidad(e.target.value)}
                      placeholder="Ej: Tejido Macramé & Nudos Sacros"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={artTelefono}
                      onChange={(e) => setArtTelefono(e.target.value)}
                      placeholder="Ej: 573001234567"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Tarifa por Minuto (COP)</label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" />
                      <input
                        type="number"
                        min="50"
                        value={artTarifaMin}
                        onChange={(e) => setArtTarifaMin(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  {editingArtesanoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingArtesanoId(null)
                        setArtNombre('')
                        setArtTelefono('')
                        setArtTarifaMin(150)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-secondary text-on-secondary font-bold text-xs hover:bg-secondary/90 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingArtesanoId ? 'Guardar Cambios' : 'Registrar Artesano'}</span>
                  </button>
                </div>
              </form>

              {/* Lista de Artesanos Registrados */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Artesanos Activos ({artesanos.length})</span>
                </h4>

                <div className="space-y-2">
                  {artesanos.map((art) => (
                    <div
                      key={art.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-sm text-slate-100">{art.nombre}</p>
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            ${art.tarifa_minuto}/min
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400/90">{art.especialidad}</p>
                        {art.telefono && (
                          <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span>{art.telefono}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingArtesanoId(art.id)
                            setArtNombre(art.nombre)
                            setArtEspecialidad(art.especialidad)
                            setArtTelefono(art.telefono || '')
                            setArtTarifaMin(art.tarifa_minuto)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all cursor-pointer"
                          title="Editar artesano"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEliminarArtesano(art.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
                          title="Eliminar artesano"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#18181E] border-t border-[#2D2A26] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsArtesanosModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Inspección y Gestión de Lotes de Materiales BOM */}
      {inspectingOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#141418] border border-[#2D2A26] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#18181E] border-b border-[#2D2A26] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-display">
                    Desglose de Insumos BOM & Lotes ({inspectingOp.codigo_op})
                  </h3>
                  <p className="text-[11px] font-mono text-amber-400">
                    {inspectingOp.producto_nombre} — {inspectingOp.cantidad} unidad(es)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingOp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Puedes verificar y actualizar los lotes de insumos recibidos por el proveedor para el control de inventario de esta orden.
                </span>
              </div>

              {/* Tabla de Materiales e Insumos BOM */}
              <div className="space-y-3">
                {inspectingOp.insumos_bom?.map((mat) => {
                  const currentEdit = editingLotesMap[mat.id] || {
                    proveedor: mat.proveedor || '',
                    lote_codigo: mat.lote_codigo || ''
                  }

                  return (
                    <div
                      key={mat.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div>
                          <p className="font-bold text-sm text-slate-100">{mat.nombre}</p>
                          <p className="text-[10px] text-slate-400">
                            {mat.cantidad_por_unidad} {mat.unidad} / unidad × {inspectingOp.cantidad} piezas ={' '}
                            <span className="text-amber-400 font-bold">{mat.cantidad_total_requerida} {mat.unidad}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">{formatCurrency(mat.costo_total || 0)}</p>
                          <p className="text-[10px] text-slate-400">Costo Unit: {formatCurrency(mat.costo_unitario)}</p>
                        </div>
                      </div>

                      {/* Formulario de Proveedor y Lote por Insumo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-semibold">
                            Proveedor del Insumo
                          </label>
                          <input
                            type="text"
                            value={currentEdit.proveedor}
                            onChange={(e) =>
                              setEditingLotesMap((prev) => ({
                                ...prev,
                                [mat.id]: { ...currentEdit, proveedor: e.target.value }
                              }))
                            }
                            placeholder="Ej: OroNal Colombia, Minesa Muzo..."
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-400 font-semibold">
                            Código / ID de Lote
                          </label>
                          <input
                            type="text"
                            value={currentEdit.lote_codigo}
                            onChange={(e) =>
                              setEditingLotesMap((prev) => ({
                                ...prev,
                                [mat.id]: { ...currentEdit, lote_codigo: e.target.value }
                              }))
                            }
                            placeholder="Ej: LOTE-OR18K-9902"
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 bg-[#18181E] border-t border-[#2D2A26] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setInspectingOp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!inspectingOp) return
                  const insumosActualizados = inspectingOp.insumos_bom.map((item) => {
                    const edit = editingLotesMap[item.id]
                    if (edit) {
                      return {
                        ...item,
                        proveedor: edit.proveedor.trim() || item.proveedor,
                        lote_codigo: edit.lote_codigo.trim() || item.lote_codigo
                      }
                    }
                    return item
                  })

                  const opActualizada = { ...inspectingOp, insumos_bom: insumosActualizados }
                  setOrdenes((prev) => prev.map((o) => (o.id === inspectingOp.id ? opActualizada : o)))

                  try {
                    const localSaved: OrdenProduccion[] = JSON.parse(localStorage.getItem('jhaular_ordenes_produccion') || '[]')
                    const updatedLocal = localSaved.map((o) => (o.id === inspectingOp.id ? opActualizada : o))
                    localStorage.setItem('jhaular_ordenes_produccion', JSON.stringify(updatedLocal))
                  } catch {
                    // ignore
                  }
                  setInspectingOp(null)
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all flex items-center space-x-2 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-on-secondary" />
                <span>Guardar Cambios de Lotes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Calculadora Completa BOM & Nueva Manilla / Joya (Publicar a Catálogo) */}
      {isCreateManillaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#141418] border border-[#2D2A26] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-[#18181E] border-b border-[#2D2A26] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-display">
                    {editingManillaId ? 'Editar Manilla & Receta BOM' : 'Calculadora BOM Completa & Crear Nueva Manilla'}
                  </h3>
                  <p className="text-[11px] font-mono text-amber-400">
                    Definición técnica de insumos, mano de obra artesanal, márgenes y foto (Google Drive / URL) para publicar a Catálogo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateManillaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form & Calculator Body */}
            <form onSubmit={handleGuardarManillaCompleta} className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
              {/* SECCIÓN 1: Ficha del Producto */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>1. Ficha del Producto & Foto (Google Drive)</span>
                  </div>
                  {editingManillaId && (
                    <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      Modificando Modelo Existente
                    </span>
                  )}
                </h4>

                {/* Selector para Cargar / Editar / Eliminar Modelo Existente */}
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase text-amber-300 font-bold flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Seleccionar Modelo Existente (Editar o Eliminar de Producción)</span>
                    </label>
                    {editingManillaId && (
                      <button
                        type="button"
                        onClick={() => handleOpenNuevaManilla(null)}
                        className="text-[9.5px] font-mono text-amber-400 underline hover:text-amber-300 cursor-pointer"
                      >
                        + Crear Nuevo Modelo
                      </button>
                    )}
                  </div>
                  <select
                    value={editingManillaId || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (!val) {
                        handleOpenNuevaManilla(null)
                      } else {
                        const targetProd = productosCat.find((p) => p.id === val)
                        if (targetProd) handleOpenNuevaManilla(targetProd)
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-lg text-xs text-amber-300 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="">-- (+ Crear Nuevo Modelo de Manilla) --</option>
                    {productosCat.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({formatCurrency(p.precio_venta)})
                      </option>
                    ))}
                  </select>

                  {/* Botón Destacado de Eliminación del Modelo */}
                  {editingManillaId && (
                    <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 flex items-center justify-between gap-2 mt-2">
                      <div>
                        <span className="text-[10px] font-bold text-red-300 block">¿No se fabricará más este modelo?</span>
                        <span className="text-[9px] text-red-300/80 font-sans block">
                          Eliminarlo lo remueve del Catálogo, la Calculadora BOM y quita sus órdenes de Producción.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleEliminarManilla(editingManillaId)
                        }}
                        className="px-3 py-1.5 bg-red-900 hover:bg-red-800 border border-red-500/60 text-white font-bold font-mono text-[11px] rounded-lg transition-all shadow-md cursor-pointer flex items-center space-x-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                        <span>Eliminar Modelo</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Nombre de la Manilla / Joya</label>
                    <input
                      type="text"
                      value={manillaNombre}
                      onChange={(e) => setManillaNombre(e.target.value)}
                      placeholder="Ej: Manilla Guardián Dorado 18K"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Categoría</label>
                    <select
                      value={manillaCategoria}
                      onChange={(e) => setManillaCategoria(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
                    >
                      <option value="MANILLA_MACRAME">Manilla Macramé</option>
                      <option value="PULSERA">Pulsera</option>
                      <option value="COLLAR">Collar / Rosario</option>
                      <option value="ARETES">Aretes</option>
                      <option value="SET">Set Especial</option>
                    </select>
                  </div>
                </div>

                {/* Enlace Foto Google Drive / URL Directa con Previsualización */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase text-amber-400 flex items-center space-x-1 font-semibold">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>URL de Imagen o Enlace Compartido de Google Drive</span>
                    </label>
                    <span className="text-[9.5px] text-slate-400">Convierte automáticamente enlaces de Drive</span>
                  </div>

                  <input
                    type="text"
                    value={manillaImagenUrl}
                    onChange={(e) => setManillaImagenUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1A2B3C.../view o URL directa..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                  />

                  {/* Live Preview of Drive Image */}
                  {manillaImagenUrl && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 flex items-center space-x-3 mt-2">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black border border-slate-800 shrink-0">
                        <img
                          src={convertGoogleDriveUrl(manillaImagenUrl) || ''}
                          alt="Previsualización Drive"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="space-y-1 text-[10.5px]">
                        <span className="text-emerald-400 font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Foto principal vinculada desde Google Drive</span>
                        </span>
                        <p className="text-slate-400 line-clamp-1 truncate max-w-md">
                          {convertGoogleDriveUrl(manillaImagenUrl)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fotos Adicionales para el Carrusel */}
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] uppercase text-amber-400 flex items-center space-x-1 font-semibold">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Fotos Adicionales para el Carrusel de Catálogo (Google Drive / URLs)</span>
                    </label>
                    <textarea
                      value={manillaGaleriaUrls}
                      onChange={(e) => setManillaGaleriaUrls(e.target.value)}
                      rows={2}
                      placeholder="Pega aquí URLs o enlaces de Google Drive adicionales (una por línea)..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <p className="text-[9.5px] text-slate-400">
                      Estas fotos se anexarán automáticamente al carrusel editorial de la manilla.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400">Descripción Breve o Concepto</label>
                  <textarea
                    value={manillaDescripcion}
                    onChange={(e) => setManillaDescripcion(e.target.value)}
                    rows={2}
                    placeholder="Ej: Joya ancestral confeccionada en hilo macramé negro con 5 balines de Oro 18K..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>
              </div>

              {/* SECCIÓN 2: Receta de Insumos BOM & Mano de Obra Artesanal */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                  <Box className="w-4 h-4 text-amber-400" />
                  <span>2. Insumos Requeridos (Receta BOM) & Mano de Obra</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Artesano / Tejedora Sugerida</label>
                    <select
                      value={manillaArtesanoId}
                      onChange={(e) => setManillaArtesanoId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-medium cursor-pointer"
                    >
                      {artesanos.map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.nombre} (${art.tarifa_minuto}/min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400">Tiempo de Tejido (Minutos por Unidad)</label>
                    <input
                      type="number"
                      min="5"
                      value={manillaTiempoMin}
                      onChange={(e) => setManillaTiempoMin(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Receta de Insumos Dinámica */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase text-amber-400 font-semibold">
                      Materiales del Inventario (Balines, Gemas, Hilos, Dijes):
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultMatId = materialesInventario[0]?.id || ''
                        setManillaRecetaBOM((prev) => [
                          ...prev,
                          { id: crypto.randomUUID(), material_id: defaultMatId, cantidad: 1 }
                        ])
                      }}
                      className="text-[10.5px] text-amber-300 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3 text-amber-400" />
                      <span>+ Agregar Insumo</span>
                    </button>
                  </div>

                  {manillaRecetaBOM.length === 0 ? (
                    <p className="text-[10.5px] text-slate-400 italic">No has seleccionado insumos aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {manillaRecetaBOM.map((item, idx) => {
                        const matObj = materialesInventario.find((m) => m.id === item.material_id)
                        const costLine = (Number(item.cantidad) || 0) * (matObj?.costo_unitario || 20000)

                        return (
                          <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <div className="col-span-6">
                              <select
                                value={item.material_id}
                                onChange={(e) => {
                                  const newId = e.target.value
                                  setManillaRecetaBOM((prev) =>
                                    prev.map((r) => (r.id === item.id ? { ...r, material_id: newId } : r))
                                  )
                                }}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200"
                              >
                                {materialesInventario.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.nombre} (${m.costo_unitario?.toLocaleString('es-CO')})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="col-span-3 flex items-center space-x-1">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.cantidad}
                                onChange={(e) => {
                                  const newQty = Number(e.target.value)
                                  setManillaRecetaBOM((prev) =>
                                    prev.map((r) => (r.id === item.id ? { ...r, cantidad: newQty } : r))
                                  )
                                }}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] text-emerald-400 font-bold text-center"
                              />
                              <span className="text-[10px] text-slate-400">{matObj?.unidad || 'ud'}</span>
                            </div>

                            <div className="col-span-2 text-right">
                              <span className="text-[10.5px] font-bold text-amber-300">
                                ${costLine.toLocaleString('es-CO')}
                              </span>
                            </div>

                            <div className="col-span-1 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setManillaRecetaBOM((prev) => prev.filter((r) => r.id !== item.id))
                                }}
                                className="p-1 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 3: MODELO FINANCIERA & FIJACIÓN DE MÁRGENES (4 FASES CONTABLES) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1117] border border-amber-500/40 space-y-5 shadow-xl">
                {/* ENCABEZADO DE LA CALCULADORA */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <Calculator className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs">
                        3. Modelo Financiero & Fijación de Márgenes
                      </h4>
                      <p className="text-[10.5px] text-slate-400">
                        Estructura contable secuencial (de costo real de fabricación a precio público).
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    Cálculos en Vivo (COP)
                  </span>
                </div>

                {/* FASE 1: COSTOS DIRECTOS & COSTO DE BODEGA */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase font-bold text-slate-300 tracking-wider flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-[9px] font-mono font-bold">1</span>
                      <span>Fase 1: Costos Directos & de Bodega (Producción / Taller)</span>
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Fórmula: [Insumos] + [Mano de Obra] + [Gastos Indirectos]
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    {/* 1. Insumos BOM */}
                    <div className="p-2.5 rounded-lg bg-[#14161d] border border-slate-800/80 space-y-1">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans font-semibold">1. Insumos BOM</span>
                      <span className="font-bold text-slate-200 block text-xs">{formatCurrency(calculoBOMManilla.costoInsumosBOM)}</span>
                      <span className="text-[8.5px] text-slate-500 block font-normal font-sans">Materiales e insumos</span>
                    </div>

                    {/* 2. Mano de Obra */}
                    <div className="p-2.5 rounded-lg bg-[#14161d] border border-slate-800/80 space-y-1">
                      <span className="text-[9px] text-purple-300/90 block uppercase font-sans font-semibold">2. Mano de Obra</span>
                      <span className="font-bold text-purple-300 block text-xs">{formatCurrency(calculoBOMManilla.costoManoObraBOM)}</span>
                      <span className="text-[8.5px] text-slate-500 block font-normal font-sans">{manillaTiempoMin} min de tejido</span>
                    </div>

                    {/* 3. Gastos Indirectos */}
                    <div className="p-2.5 rounded-lg bg-[#181510] border border-amber-500/30 space-y-1">
                      <span className="text-[9px] text-amber-400 block uppercase font-sans font-semibold">3. Gastos Indirectos</span>
                      <span className="font-bold text-amber-400 block text-xs">{formatCurrency(calculoBOMManilla.costoGastosBOM)}</span>
                      <span className="text-[8.5px] text-amber-400/70 block font-normal font-sans">{manillaGastosPct}% s/ Directos</span>
                    </div>

                    {/* Costo Total Bodega */}
                    <div className="p-2.5 rounded-lg bg-[#1e1b12] border border-amber-400/80 space-y-1 shadow-sm">
                      <span className="text-[9px] text-amber-300 block uppercase font-sans font-bold">Costo Total Bodega</span>
                      <span className="font-bold text-amber-300 block text-sm">{formatCurrency(calculoBOMManilla.costoTotalBodegaBOM)}</span>
                      <span className="text-[8.5px] text-amber-300/80 block font-normal font-sans">Costo real de fabricación</span>
                    </div>
                  </div>
                </div>

                {/* FASE 2 & 3: VALOR INTERNO TALLER & PRECIO MAYORISTA */}
                <div className="p-3.5 rounded-xl bg-[#161410] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase font-bold text-amber-300 tracking-wider flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px] font-mono font-bold">2</span>
                      <span>Fase 2 & 3: Configuración de Taller & Precio Mayorista</span>
                    </span>
                    <span className="text-[9.5px] font-mono text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                      Fórmula: [Costo Bodega] + [Ganancia Interna]
                    </span>
                  </div>

                  {/* INPUTS DE PORCENTAJES CON VALOR EN COP E INFORMACIÓN BASE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Input % Gastos Indirectos */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase text-slate-300 font-semibold">% Gastos Indirectos (Taller)</label>
                        <span className="text-[10.5px] font-mono font-bold text-amber-400">
                          {formatCurrency(calculoBOMManilla.costoGastosBOM)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={manillaGastosPct}
                        onChange={(e) => {
                          setManillaGastosPct(Number(e.target.value))
                          setManillaPrecioManualEditado(false)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[9.5px] text-slate-400 font-sans">
                        Calculado como el <strong className="text-amber-400">{manillaGastosPct}%</strong> sobre Costos Directos (Insumos + Mano de Obra).
                      </p>
                    </div>

                    {/* Input % Ganancia Interna */}
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase text-slate-300 font-semibold">% Ganancia Interna (Taller/Admin)</label>
                        <span className="text-[10.5px] font-mono font-bold text-amber-300">
                          {formatCurrency(calculoBOMManilla.gananciaInternaCopBOM)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={manillaGananciaInternaPct}
                        onChange={(e) => {
                          setManillaGananciaInternaPct(Number(e.target.value))
                          setManillaPrecioManualEditado(false)
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                      <p className="text-[9.5px] text-slate-400 font-sans">
                        Calculado como el <strong className="text-amber-300">{manillaGananciaInternaPct}%</strong> sobre el Costo Total de Bodega.
                      </p>
                    </div>
                  </div>

                  {/* SALIDAS CLAVE DE TALLER: GANANCIA INTERNA Y PRECIO MAYORISTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[9.5px] text-amber-300/90 block uppercase font-sans font-semibold">Ganancia Interna Taller</span>
                        <span className="text-[9px] text-slate-400 font-sans">Utilidad bruta asignada al Taller/Admin</span>
                      </div>
                      <span className="font-bold text-amber-300 text-xs">{formatCurrency(calculoBOMManilla.gananciaInternaCopBOM)}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#1f1b13] border border-amber-400/80 flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[9.5px] text-amber-300 block uppercase font-sans font-bold">Costo Base / Precio Mayorista</span>
                        <span className="text-[9px] text-amber-300/70 font-sans">Precio base de salida del taller</span>
                      </div>
                      <span className="font-bold text-amber-300 text-sm">{formatCurrency(calculoBOMManilla.subtotalConGananciaInterna)}</span>
                    </div>
                  </div>
                </div>

                {/* FASE 4: COMERCIALIZACIÓN & VENTA AL PÚBLICO */}
                <div className="p-3.5 rounded-xl bg-[#0c1813] border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase font-bold text-emerald-300 tracking-wider flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-mono font-bold">3</span>
                      <span>Fase 4: Comercialización & Venta al Público (Utilidad Externa)</span>
                    </span>
                    <span className="text-[9.5px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      Margen Comercial sobre Venta
                    </span>
                  </div>

                  {/* INPUT % GANANCIA EXTERNA */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <label className="text-[10px] uppercase text-slate-300 font-semibold block">
                      % Ganancia Externa (Utilidad Venta Comercial)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={manillaGananciaExternaPct}
                      onChange={(e) => {
                        setManillaGananciaExternaPct(Number(e.target.value))
                        setManillaPrecioManualEditado(false)
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[9.5px] text-slate-400 font-sans">
                      Representa el margen de utilidad neta ({manillaGananciaExternaPct}%) sobre el precio final de venta al cliente en e-commerce/catálogo.
                    </p>
                  </div>

                  {/* CUADRO DESTACADO RESULTADO FINAL DE PRECIO Y GANANCIA NETAS */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-[#0a1e16] to-slate-950 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                    <div>
                      <span className="text-[10px] uppercase text-emerald-400 font-bold block tracking-wider">
                        Precio Oficial Sugerido al Público:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold font-mono text-emerald-300">
                          {formatCurrency(calculoBOMManilla.precioVentaFinalBOM)}
                        </span>
                        {manillaPrecioManualEditado && (
                          <span className="text-[9.5px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/30">
                            (Precio Editado Manualmente)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-800/40 w-full sm:w-auto">
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Utilidad Real Venta Final ($)</span>
                      <span className="text-xl font-bold font-mono text-emerald-400">
                        +{formatCurrency(calculoBOMManilla.gananciaExternaCopBOM)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Guardar y Publicar en Catálogo / Eliminar */}
              <div className="flex items-center gap-3">
                {editingManillaId && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleEliminarManilla(editingManillaId)
                      setIsCreateManillaModalOpen(false)
                    }}
                    className="py-3.5 px-4 bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900 font-bold font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Eliminar Manilla</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingManilla}
                  className="flex-1 py-3.5 px-4 bg-secondary text-on-secondary hover:bg-secondary/90 font-bold font-mono text-xs rounded-xl transition-all shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-on-secondary" />
                  <span>
                    {isSubmittingManilla
                      ? 'Guardando Ficha Técnica...'
                      : 'Guardar Manilla & Publicar en Catálogo'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Adjuntar / Cambiar Foto de Drive en Orden */}
      {editingDrivePhotoOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141418] border border-[#2D2A26] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#18181E] border-b border-[#2D2A26] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-display">
                    Adjuntar Foto de Google Drive
                  </h3>
                  <p className="text-[11px] font-mono text-amber-400">
                    {editingDrivePhotoOp.producto_nombre} ({editingDrivePhotoOp.codigo_op})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDrivePhotoOp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-amber-300 flex items-center space-x-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Pega aquí la URL o enlace compartido de Google Drive:</span>
                </label>
                <input
                  type="text"
                  value={drivePhotoUrlInput}
                  onChange={(e) => setDrivePhotoUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/1A2B3C.../view"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  El sistema convierte automáticamente el enlace de Drive para previsualizar la foto en vivo.
                </p>
              </div>

              {drivePhotoUrlInput && (
                <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2 text-center">
                  <span className="text-[10px] uppercase text-emerald-400 font-bold block">
                    Vista Previa de la Foto Decodificada:
                  </span>
                  <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden bg-black border border-slate-800">
                    <img
                      src={convertGoogleDriveUrl(drivePhotoUrlInput) || ''}
                      alt="Previsualización Drive"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-[#18181E] border-t border-[#2D2A26] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingDrivePhotoOp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGuardarFotoDriveOrden}
                className="px-5 py-2 rounded-xl text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all flex items-center space-x-2 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-on-secondary" />
                <span>Guardar Foto & Sincronizar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
