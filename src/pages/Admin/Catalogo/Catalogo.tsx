import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  RefreshCw,
  Search,
  Clock,
  Trash2,
  PackageCheck,
  Camera,
  Image as ImageIcon,
  Pencil,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
  Layers,
  ZoomIn,
  Package,
  Eye,
  Tag,
  Video,
  Film,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { processMediaUrl } from '../../../utils/mediaConverter'
import type { ProductoData } from '../../../types/productos'
import ConfirmModal from '../../../components/Admin/ConfirmModal'

interface ProductoImagen {
  id: string
  producto_id: string
  imagen_url: string
  orden?: number
}

// 4 Enfoques Narrativos Editoriales con Fallbacks a las 4 Imágenes de Prueba en /public
const SLIDES_NARRATIVOS = [
  {
    key: 'editorial',
    title: 'Foto Editorial / Campaña',
    subtitle: 'Enfoque inspiracional & concepto de marca Jhaular',
    tag: '1/4 · Campaña',
    fallbackImg: '/elemento_editorial.jpg',
    icon: Camera
  },
  {
    key: 'macro',
    title: 'Detalle Macro del Producto',
    subtitle: 'Textura del tejido, nudos artesanales & oro 18K',
    tag: '2/4 · Macro',
    fallbackImg: '/elemento_macro.jpg',
    icon: ZoomIn
  },
  {
    key: 'on_body',
    title: 'Foto en Uso / On-Body',
    subtitle: 'Cómo luce la manilla puesta en la muñeca',
    tag: '3/4 · On-Body',
    fallbackImg: '/elemento_uso.jpg',
    icon: Eye
  },
  {
    key: 'unboxing',
    title: 'Experiencia de Empaque / Unboxing',
    subtitle: 'Estuche de lujo Jhaular & certificado de autenticidad',
    tag: '4/4 · Unboxing',
    fallbackImg: '/elemento_empaque.jpg',
    icon: Package
  }
]

// Producto Falso (Mock) de Alta Joyería para evitar pantalla en blanco
const MOCK_PRODUCTO_ANCESTRAL: ProductoData & { badges: string[]; imagenes_editoriales: string[] } = {
  id: 'mock_elemento_ancestral',
  nombre: 'Manilla Elemento Ancestral',
  categoria: 'MANILLA_MACRAME',
  descripcion:
    'Pieza de alta joyería que entrelaza la resistencia del tejido artesanal en macramé con el brillo imperecedero del oro de 18K y el misterio de las esmeraldas en bruto.',
  imagen_url: '/elemento_editorial.jpg',
  tiempo_produccion_min: 45,
  costo_materiales: 38000,
  mano_obra: 6750,
  margen_operativo: 4475,
  costo_total_real: 68000,
  margen_ganancia_pct: 40,
  precio_sugerido: 185000,
  precio_venta: 185000,
  es_publico: true,
  activo: true,
  badges: ['Macramé Negro', 'Oro 18K', 'Esmeralda'],
  imagenes_editoriales: [
    '/elemento_editorial.jpg',
    '/elemento_macro.jpg',
    '/elemento_uso.jpg',
    '/elemento_empaque.jpg'
  ]
}

// Subcomponente: Carrusel Fotográfico & Multimedia Narrativo (Editorial)
function EditorialProductCarousel({
  imagenPrincipal,
  imagenesAdicionales = [],
  imagenesPersonalizadas = [],
  nombreProducto
}: {
  imagenPrincipal?: string | null
  imagenesAdicionales?: ProductoImagen[]
  imagenesPersonalizadas?: string[]
  nombreProducto: string
}) {
  // Construir slides fijos
  const slides = useMemo(() => {
    // 1. Si el producto tiene un arreglo directo de fotos editoriales (ej: Mock)
    if (imagenesPersonalizadas && imagenesPersonalizadas.length > 0) {
      return SLIDES_NARRATIVOS.map((narrativa, idx) => ({
        id: `slide_${narrativa.key}`,
        ...narrativa,
        url: imagenesPersonalizadas[idx] || narrativa.fallbackImg,
        isVideo: false,
        isRealPhoto: true
      }))
    }

    // 2. Si viene de Supabase con fotos/videos cargados
    const elementosReales: Array<{ url: string; isVideo: boolean }> = []
    if (imagenPrincipal) {
      const processed = processMediaUrl(imagenPrincipal)
      if (processed.url) elementosReales.push({ url: processed.url, isVideo: processed.type === 'video' })
    }
    imagenesAdicionales.forEach((img) => {
      if (img.imagen_url) {
        const processed = processMediaUrl(img.imagen_url)
        if (processed.url && !elementosReales.some((f) => f.url === processed.url)) {
          elementosReales.push({ url: processed.url, isVideo: processed.type === 'video' })
        }
      }
    })

    const hasRealPhotos = elementosReales.length > 0

    return SLIDES_NARRATIVOS.map((narrativa, index) => {
      const itemReal = hasRealPhotos
        ? elementosReales[index] || elementosReales[0]
        : { url: narrativa.fallbackImg, isVideo: false }

      return {
        id: `slide_${narrativa.key}`,
        ...narrativa,
        url: itemReal.url,
        isVideo: itemReal.isVideo,
        isRealPhoto: hasRealPhotos
      }
    })
  }, [imagenPrincipal, imagenesAdicionales, imagenesPersonalizadas])

  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const activeSlide = slides[currentIndex] || slides[0]
  const IconComp = activeSlide.icon

  return (
    <div className="h-64 w-full bg-[#0D0D10] border-b border-[#25221E] relative overflow-hidden group select-none flex items-center justify-center">
      {/* Slide Activo con Transición Fluida */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="w-full h-full flex items-center justify-center relative"
        >
          {activeSlide.isVideo ? (
            <div className="w-full h-full relative bg-black">
              <iframe
                src={activeSlide.url}
                className="w-full h-full border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${nombreProducto} Video`}
              />
            </div>
          ) : activeSlide.url ? (
            <img
              src={activeSlide.url}
              alt={`${nombreProducto} - ${activeSlide.title}`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#16161B] via-[#111115] to-[#0A0A0D] flex flex-col items-center justify-center p-5 text-center space-y-2 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A22] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg">
                <IconComp className="w-6 h-6 opacity-90" />
              </div>
              <div className="space-y-0.5 z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]/80 block font-semibold">
                  {activeSlide.subtitle}
                </span>
                <h4 className="font-display text-sm font-bold text-on-surface tracking-wide">
                  {activeSlide.title}
                </h4>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Flechas de Navegación */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10 z-20 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md border border-white/10 z-20 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Indicadores de Puntos */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-20 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`transition-all duration-300 rounded-full ${
              i === currentIndex ? 'w-4 h-1 bg-[#D4AF37]' : 'w-1 h-1 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Subcomponente: Modal para Gestionar Galería Multimedia (Fotos & Videos Editoriales)
function GestionarFotosModal({
  isOpen,
  producto,
  onClose,
  onRefresh
}: {
  isOpen: boolean
  producto: ProductoData | null
  onClose: () => void
  onRefresh: () => void
}) {
  const [nuevaUrlText, setNuevaUrlText] = useState<string>('')
  const [imagenesGuardadas, setImagenesGuardadas] = useState<ProductoImagen[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)

  const fetchFotos = useCallback(async () => {
    if (!producto?.id) return
    try {
      setLoading(true)
      let dbImgs: ProductoImagen[] = []
      try {
        const { data, error } = await supabase
          .from('producto_imagenes')
          .select('*')
          .eq('producto_id', producto.id)
          .order('created_at', { ascending: true })
        if (!error && data) dbImgs = data
      } catch {
        // ignore
      }

      let localImgs: ProductoImagen[] = []
      try {
        localImgs = JSON.parse(localStorage.getItem(`jhaular_saved_gallery_${producto.id}`) || '[]')
      } catch {
        // ignore
      }

      const mapImg = new Map<string, ProductoImagen>()
      dbImgs.forEach((i) => mapImg.set(i.imagen_url, i))
      localImgs.forEach((i) => mapImg.set(i.imagen_url, i))

      setImagenesGuardadas(Array.from(mapImg.values()))
    } catch (err) {
      console.warn('No se pudieron leer imágenes:', err)
    } finally {
      setLoading(false)
    }
  }, [producto])

  useEffect(() => {
    if (isOpen && producto) {
      fetchFotos()
      setNuevaUrlText('')
      setModalFeedback(null)
    }
  }, [isOpen, producto, fetchFotos])

  if (!isOpen || !producto) return null

  const handleAgregarMultimedia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const prodId = producto?.id
    if (!prodId || !nuevaUrlText.trim()) return []

    setModalFeedback(null)

    try {
      setIsSaving(true)

      // Procesar URLs (soporta una o varias URLs separadas por línea o coma, convirtiendo Google Drive automáticamente)
      const rawLines = nuevaUrlText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
      const processedItems = rawLines.map((line) => processMediaUrl(line)).filter((m) => Boolean(m.url))

      if (processedItems.length === 0) return []

      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      if (isUuid(prodId)) {
        const payload = processedItems.map((item) => ({
          producto_id: prodId,
          imagen_url: item.url
        }))

        const { error: insertError } = await supabase
          .from('producto_imagenes')
          .insert(payload)

        if (insertError) {
          console.warn('Respaldo en memoria local por error en DB:', insertError)
        }

        // Si el producto no tiene foto principal o usa una por defecto, actualizar su imagen_principal_url en Supabase
        if (processedItems[0]?.url && (!producto.imagen_principal_url || producto.imagen_principal_url.includes('unsplash') || producto.imagen_principal_url.includes('placeholder'))) {
          await supabase
            .from('productos')
            .update({
              imagen_principal_url: processedItems[0].url,
              imagen_url: processedItems[0].url
            })
            .eq('id', prodId)
        }
      }

      const newSaved: ProductoImagen[] = processedItems.map((item) => ({
        id: item.id || Math.random().toString(),
        producto_id: prodId,
        imagen_url: item.url
      }))

      // Persistencia local de respaldo para galerías
      try {
        const key = `jhaular_saved_gallery_${prodId}`
        const localCurrent = JSON.parse(localStorage.getItem(key) || '[]')
        localStorage.setItem(key, JSON.stringify([...localCurrent, ...newSaved]))
      } catch (err) {
        console.warn('Error guardando galería local:', err)
      }

      setImagenesGuardadas((prev) => [...prev, ...newSaved])
      setNuevaUrlText('')
      setModalFeedback(`¡${newSaved.length} elemento(s) multimedia guardado(s) con éxito!`)
      setTimeout(() => setModalFeedback(null), 4000)

      fetchFotos()
      onRefresh()
      return newSaved
    } catch (err: any) {
      console.error('Error agregando contenido multimedia:', err)
      return []
    } finally {
      setIsSaving(false)
    }
  }

  // Acción del botón principal "Guardar Galería / Guardar Cambios"
  const handleGuardarYSalir = async () => {
    try {
      setIsSaving(true)
      if (nuevaUrlText.trim()) {
        await handleAgregarMultimedia()
      }
      onRefresh()
      onClose()
    } catch (err) {
      console.error('Error guardando galería:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEliminarFoto = async (imagenId: string) => {
    try {
      setImagenesGuardadas((prev) => prev.filter((img) => img.id !== imagenId))

      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

      if (isUuid(producto?.id)) {
        await supabase.from('producto_imagenes').delete().eq('id', imagenId)
      }

      if (producto?.id) {
        try {
          const locKey = `jhaular_saved_gallery_${producto.id}`
          const localCurrent: ProductoImagen[] = JSON.parse(localStorage.getItem(locKey) || '[]')
          const filteredLocal = localCurrent.filter((img) => img.id !== imagenId)
          localStorage.setItem(locKey, JSON.stringify(filteredLocal))
        } catch {
          // ignore
        }
      }

      fetchFotos()
      onRefresh()
    } catch (err: any) {
      console.warn('Error al eliminar imagen:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141418] border border-[#2D2A26] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-[#18181E] border-b border-[#2D2A26] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-display">
                Gestionar Galería Multimedia (Fotos & Videos)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {producto.nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {modalFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{modalFeedback}</span>
            </div>
          )}

          {/* Formulario Agregar Multimedia (Fotos o Videos Múltiples) */}
          <form onSubmit={handleAgregarMultimedia} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold flex items-center space-x-1">
                <Video className="w-3.5 h-3.5" />
                <span>Agregar URLs de Fotos o Videos (Google Drive, YouTube, MP4)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Puedes pegar varias líneas</span>
            </div>

            <textarea
              value={nuevaUrlText}
              onChange={(e) => setNuevaUrlText(e.target.value)}
              rows={3}
              placeholder="Pega aquí los enlaces (Google Drive, YouTube, Vimeo, MP4)... Puedes agregar varios separándolos por línea."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
            />

            <button
              type="submit"
              disabled={isSaving || !nuevaUrlText.trim()}
              className="w-full py-2.5 px-4 bg-secondary/20 text-secondary border border-secondary/40 hover:bg-secondary/30 font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSaving ? 'Procesando Enlaces...' : 'Adjuntar Fotos & Videos a la Galería'}</span>
            </button>
          </form>

          {/* Galería Multimedia Registrada */}
          <div className="space-y-3 pt-3 border-t border-[#2D2A26]">
            <h4 className="text-xs font-mono uppercase text-secondary font-bold tracking-wider flex items-center justify-between">
              <span>Galería Activa del Producto ({imagenesGuardadas.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Soporta Carrusel & Video</span>
            </h4>

            {loading ? (
              <p className="text-xs font-mono text-slate-400">Cargando galería multimedia...</p>
            ) : imagenesGuardadas.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 text-center text-xs text-slate-400 space-y-1 border border-slate-800">
                <ImageIcon className="w-6 h-6 mx-auto text-slate-500" />
                <p>No hay archivos multimedia adicionales registrados aún.</p>
                <p className="text-[10px] text-slate-500">
                  Agrega enlaces de fotos o videos arriba para habilitar el carrusel completo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imagenesGuardadas.map((img, idx) => {
                  const media = processMediaUrl(img.imagen_url)
                  return (
                    <div
                      key={img.id || idx}
                      className="relative group rounded-xl border border-slate-800 overflow-hidden bg-slate-900 h-28 flex items-center justify-center"
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center text-amber-300 p-2 text-center relative">
                          <Film className="w-6 h-6 mb-1 text-amber-400 animate-pulse" />
                          <span className="text-[9.5px] font-mono truncate w-full">Video Adicional</span>
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`Multimedia ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://images.unsplash.com/photo-1611591475140-420456108139?auto=format&fit=crop&q=80&w=400'
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminarFoto(img.id)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 cursor-pointer z-10"
                        title="Eliminar elemento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal con Botón "Guardar Galería" y "Cerrar" */}
        <div className="px-6 py-3.5 bg-[#18181E] border-t border-[#2D2A26] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleGuardarYSalir}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all flex items-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-on-secondary" />
            <span>{isSaving ? 'Guardando Fotos...' : 'Guardar Galería'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCatalogo() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<ProductoData[]>([MOCK_PRODUCTO_ANCESTRAL])
  const [imagenesAdicionalesMap, setImagenesAdicionalesMap] = useState<Record<string, ProductoImagen[]>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS')

  // Modal para eliminar producto
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [productoToDelete, setProductoToDelete] = useState<ProductoData | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  // Modal para gestionar fotos
  const [isFotosModalOpen, setIsFotosModalOpen] = useState<boolean>(false)
  const [productoForFotos, setProductoForFotos] = useState<ProductoData | null>(null)

  const fetchProductos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let deletedIds: string[] = []
      try {
        deletedIds = JSON.parse(localStorage.getItem('jhaular_deleted_product_ids') || '[]')
      } catch {
        // ignore
      }

      // 1. Consultar base de datos Supabase
      const { data: prodsData } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false })

      // 2. Leer productos de respaldo en localStorage
      let localProds: ProductoData[] = []
      try {
        localProds = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
      } catch (e) {
        console.warn('Error leyendo prods locales:', e)
      }

      const mapaUnico = new Map<string, ProductoData>()

      // Mock inicial solo si no ha sido eliminado
      if (MOCK_PRODUCTO_ANCESTRAL.id && !deletedIds.includes(MOCK_PRODUCTO_ANCESTRAL.id)) {
        mapaUnico.set(MOCK_PRODUCTO_ANCESTRAL.id, MOCK_PRODUCTO_ANCESTRAL)
      }

      // 1. Cargar productos desde Supabase
      if (prodsData && prodsData.length > 0) {
        prodsData.forEach((p) => {
          if (p.id && !deletedIds.includes(p.id)) mapaUnico.set(p.id, p)
        })
      }

      // 2. Aplicar sobreposición con las ediciones locales más recientes guardadas por el admin
      localProds.forEach((p) => {
        if (p.id && !deletedIds.includes(p.id)) {
          const prev = mapaUnico.get(p.id) || {}
          mapaUnico.set(p.id, { ...prev, ...p })
        }
      })

      const listaProds = Array.from(mapaUnico.values())
      setProductos(listaProds)

      // 3. Obtener fotos adicionales asociadas (Supabase + LocalStorage)
      const mapImgs: Record<string, ProductoImagen[]> = {}

      try {
        const { data: imgsData } = await supabase
          .from('producto_imagenes')
          .select('*')

        if (imgsData) {
          imgsData.forEach((img) => {
            if (img.producto_id) {
              if (!mapImgs[img.producto_id]) mapImgs[img.producto_id] = []
              mapImgs[img.producto_id].push(img)
            }
          })
        }
      } catch (imgsErr) {
        console.warn('Tabla opcional producto_imagenes no leída:', imgsErr)
      }

      // Incorporar galerías locales
      listaProds.forEach((p) => {
        const pId = p.id
        if (pId) {
          try {
            const locKey = `jhaular_saved_gallery_${pId}`
            const locImgs: ProductoImagen[] = JSON.parse(localStorage.getItem(locKey) || '[]')
            if (locImgs.length > 0) {
              if (!mapImgs[pId]) mapImgs[pId] = []
              const existingUrls = new Set((mapImgs[pId] || []).map((i) => i.imagen_url))
              locImgs.forEach((img) => {
                if (!existingUrls.has(img.imagen_url)) {
                  mapImgs[pId].push(img)
                }
              })
            }
          } catch {
            // ignore
          }
        }
      })

      setImagenesAdicionalesMap(mapImgs)
    } catch (err: unknown) {
      console.error('Error al cargar catálogo:', err)
      setProductos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  // Confirmar eliminación permanente de producto (CRUD)
  const handleConfirmDelete = async () => {
    if (!productoToDelete || !productoToDelete.id) return
    const prodId = productoToDelete.id

    try {
      setIsDeleting(true)

      // 1. Borrar de Supabase (si aplica)
      try {
        await supabase.from('producto_imagenes').delete().eq('producto_id', prodId)
        await supabase.from('productos').delete().eq('id', prodId)
      } catch (e) {
        console.warn('Error borrando en Supabase:', e)
      }

      // 2. Limpiar de localStorage y agregar a la lista negra de borrados
      try {
        const localSaved: ProductoData[] = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
        const filteredSaved = localSaved.filter((p) => p.id !== prodId)
        localStorage.setItem('jhaular_saved_productos', JSON.stringify(filteredSaved))

        localStorage.removeItem(`jhaular_saved_gallery_${prodId}`)

        const deletedIds: string[] = JSON.parse(localStorage.getItem('jhaular_deleted_product_ids') || '[]')
        if (!deletedIds.includes(prodId)) {
          deletedIds.push(prodId)
          localStorage.setItem('jhaular_deleted_product_ids', JSON.stringify(deletedIds))
        }
      } catch (e) {
        console.warn('Error actualizando localStorage al borrar:', e)
      }

      setProductos((prev) => prev.filter((p) => p.id !== prodId))
      setIsDeleteModalOpen(false)
      setProductoToDelete(null)
      fetchProductos()
    } catch (err: unknown) {
      console.error('Error eliminando producto:', err)
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el producto.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtrado de productos por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchCategory =
        selectedCategoria === 'TODAS' || p.categoria === selectedCategoria

      return matchSearch && matchCategory
    })
  }, [productos, searchQuery, selectedCategoria])

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25221E] pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-on-surface tracking-wide">
              Catálogo de Colecciones
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Presentación editorial de pulseras, manillas de macramé y alta joyería Jhaular.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProductos}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Actualizar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {/* Botón Primario: Redirigir a Producción donde reside la Calculadora BOM */}
          <Link
            to="/admin/produccion"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono bg-secondary text-on-secondary hover:bg-secondary/90 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Manilla en Producción</span>
          </Link>
        </div>
      </div>

      {/* Toolbar Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#131317] p-3 rounded-xl border border-[#25221E]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar colección o producto por nombre o descripción..."
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-all font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:outline-none font-medium cursor-pointer"
          >
            <option value="TODAS" className="bg-surface-container-low text-on-surface">
              Todas las Colecciones
            </option>
            <option value="PULSERA">Pulsera</option>
            <option value="MANILLA_MACRAME">Manilla Macramé</option>
            <option value="COLLAR">Collar</option>
            <option value="ARETES">Aretes</option>
            <option value="SET">Set</option>
            <option value="OTROS">Otros</option>
          </select>
        </div>
      </div>

      {/* Mensaje de conexión opcional */}
      {error && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs font-mono text-amber-300 flex items-center justify-between">
          <span>{error} (Visualizando catálogo con producto ancestral local)</span>
          <button onClick={() => fetchProductos()} className="underline hover:text-amber-100 cursor-pointer">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid Responsivo de Productos (Estructura Editorial de Lujo) */}
      {loading && productos.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-[#131317] border border-[#25221E] rounded-2xl">
          <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
          <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">
            Cargando catálogo de colecciones...
          </p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-[#131317] border border-[#25221E] rounded-2xl">
          <PackageCheck className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
          <p className="text-sm font-medium text-on-surface">No se encontraron productos con esos filtros</p>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            Prueba modificando tus términos de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {productosFiltrados.map((item) => {
            const fotosAdicionales = item.id ? imagenesAdicionalesMap[item.id] || [] : []
            const fotosMock = (item as any).imagenes_editoriales || []
            const badges = (item as any).badges || ['Macramé Negro', 'Oro 18K', 'Esmeralda']

            const costoRealBodega = item.costo_total_real || (item.costo_materiales ? (item.costo_materiales || 0) + (item.mano_obra || 0) : Math.round(item.precio_venta * 0.5))
            const gananciaInternaPct = (item as any).margen_ganancia_interna_pct || 25
            const gananciaInternaCop = (item as any).ganancia_interna_cop || Math.round(costoRealBodega * (gananciaInternaPct / 100))
            const precioVenta = item.precio_venta || item.precio_sugerido || 185000
            const gananciaExternaCop = (item as any).ganancia_externa_cop || Math.max(0, precioVenta - costoRealBodega - gananciaInternaCop)
            const gananciaExternaPct = item.margen_ganancia_pct || Math.round((gananciaExternaCop / (precioVenta || 1)) * 100)

            return (
              <div
                key={item.id}
                className="bg-[#141418] border border-[#2A2723] rounded-2xl overflow-hidden shadow-xl hover:border-[#D4AF37]/50 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out flex flex-col justify-between group"
              >
                <div>
                  {/* 1. CARRUSEL FOTOGRÁFICO NARRATIVO (ZONA SUPERIOR) */}
                  <div className="relative">
                    <EditorialProductCarousel
                      imagenPrincipal={item.imagen_principal_url || item.imagen_url}
                      imagenesAdicionales={fotosAdicionales}
                      imagenesPersonalizadas={fotosMock}
                      nombreProducto={item.nombre}
                    />

                    {/* Categoría Badge flotante en esquina superior izquierda */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[9.5px] font-mono uppercase tracking-wider bg-black/80 text-secondary backdrop-blur-md border border-secondary/30 font-bold z-10">
                      {(item.categoria || 'PRODUCTO').replace('_', ' ')}
                    </span>
                  </div>

                  {/* 2. FICHA DE INFORMACIÓN ELEGANTE (ZONA INFERIOR) */}
                  <div className="p-5 space-y-3.5">
                    {/* Título */}
                    <h3 className="font-display font-bold text-on-surface text-lg group-hover:text-amber-300 transition-colors duration-300 leading-snug">
                      {item.nombre}
                    </h3>

                    {/* Precio de Venta Destacado */}
                    <div className="flex items-baseline justify-between border-b border-[#25221E] pb-2.5">
                      <div>
                        <span className="text-[9.5px] font-mono uppercase tracking-widest text-slate-400 block">
                          Precio Oficial Público
                        </span>
                        <span className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
                          {formatCurrency(precioVenta)}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                        Publicado
                      </span>
                    </div>

                    {/* DESGLOSE DE MÁRGENES: GANANCIA INTERNA & GANANCIA EXTERNA */}
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10.5px]">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/25 space-y-0.5">
                        <span className="text-[9.5px] text-amber-400 font-bold block uppercase tracking-wider">Ganancia Interna</span>
                        <p className="font-bold text-amber-300">{formatCurrency(gananciaInternaCop)}</p>
                        <span className="text-[9px] text-slate-400 block">+{gananciaInternaPct}% Retenido Taller</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/90 border border-emerald-500/25 space-y-0.5">
                        <span className="text-[9.5px] text-emerald-400 font-bold block uppercase tracking-wider">Ganancia Externa</span>
                        <p className="font-bold text-emerald-300">{formatCurrency(gananciaExternaCop)}</p>
                        <span className="text-[9px] text-slate-400 block">+{gananciaExternaPct}% Utilidad Venta</span>
                      </div>
                    </div>

                    {/* Descripción Corta / Narrativa de la Pieza */}
                    <p className="text-xs text-on-surface-variant/80 line-clamp-2 leading-relaxed font-sans">
                      {item.descripcion ||
                        'Pieza de alta joyería que entrelaza la resistencia del tejido artesanal en macramé con el brillo imperecedero del oro de 18K y el misterio de las esmeraldas en bruto.'}
                    </p>

                    {/* ESPECIFICACIONES TÉCNICAS (BADGES / ETIQUETAS DE MATERIALES) */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {badges.map((badgeStr: string) => (
                        <span
                          key={badgeStr}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#1A1A22] text-amber-300 border border-amber-500/20"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{badgeStr}</span>
                        </span>
                      ))}

                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-[#1A1A22] text-slate-300 border border-slate-700/40">
                        <Clock className="w-3 h-3 text-secondary shrink-0" />
                        <span>{item.tiempo_produccion_min || item.tiempo_produccion || 0} min tejido</span>
                      </span>
                    </div>

                    {/* Resumen Contable Sutil */}
                    <div className="pt-2 flex items-center justify-between text-[10.5px] font-mono text-slate-400 border-t border-[#25221E]">
                      <span>Costo Real en Bodega:</span>
                      <span className="font-bold text-amber-400/90">
                        {formatCurrency(costoRealBodega)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. ACCIONES Y BOTONES DE GESTIÓN */}
                <div className="px-4 py-2.5 bg-[#101014] border-t border-[#25221E] flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => navigate('/admin/produccion', { state: { editProdId: item.id } })}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-amber-400 bg-amber-500/10 hover:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all duration-300 cursor-pointer font-bold"
                    title="Editar Ficha Técnica y Calculadora BOM en Producción"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-400" />
                    <span>Editar BOM</span>
                  </button>

                  <button
                    onClick={() => navigate('/admin/certificados')}
                    className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/60 transition-all cursor-pointer font-bold border border-emerald-500/20"
                    title="Registrar Certificado de Venta & Trazabilidad"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Certificar</span>
                  </button>

                  <button
                    onClick={() => {
                      setProductoForFotos(item)
                      setIsFotosModalOpen(true)
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-secondary hover:bg-secondary/15 transition-all duration-300 cursor-pointer font-semibold"
                    title="Gestionar fotos editoriales"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Fotos</span>
                  </button>

                  <button
                    onClick={() => {
                      setProductoToDelete(item)
                      setIsDeleteModalOpen(true)
                    }}
                    className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-slate-400 hover:text-error hover:bg-error/10 transition-all duration-300 cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setProductoToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar "${productoToDelete?.nombre}"?`}
        message="Se eliminará este producto del catálogo."
        isDeleting={isDeleting}
      />

      {/* Modal Gestionar Fotos */}
      <GestionarFotosModal
        isOpen={isFotosModalOpen}
        onClose={() => {
          setIsFotosModalOpen(false)
          setProductoForFotos(null)
        }}
        producto={productoForFotos}
        onRefresh={fetchProductos}
      />
    </div>
  )
}
