import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Heart,
  Star,
  ArrowRight,
  Compass,
  MessageCircle,
  Send,
  User,
  Phone,
  MapPin,
  Gift,
  X
} from 'lucide-react'
import ThemeToggle from '../../components/ThemeToggle'
import { supabase } from '../../lib/supabase'
import { convertGoogleDriveUrl } from '../../utils/driveUrlConverter'
import type { ProductoData } from '../../types/productos'

// Fallback de respaldo para la sección de Más Vendidos si la BD está vacía
const PRODUCTOS_STORE_FALLBACK: ProductoData[] = [
  {
    id: 'manilla_elemento_ancestral',
    nombre: 'Manilla Elemento Ancestral',
    categoria: 'Ediciones Especiales',
    descripcion: 'Macramé Negro, Oro 18K Certificado, Esmeralda en Bruto',
    precio_venta: 185000,
    imagen_principal_url: '/elemento_editorial.jpg',
    bonds_tag: 'MÁS VENDIDO'
  },
  {
    id: 'rosario_imperial_18k',
    nombre: 'Rosario Imperial Sacro',
    categoria: 'Religiosa',
    descripcion: 'Macramé Café, Cruz Sacra en Oro 18K',
    precio_venta: 280000,
    imagen_principal_url: '/elemento_macro.jpg',
    bonds_tag: 'COLECCIÓN SACRA'
  },
  {
    id: 'brazalete_selva_sagrada',
    nombre: 'Brazalete Selva Sagrada',
    categoria: 'Aventura',
    descripcion: 'Hilo Verde Musgo, Esmeralda & Balines de Oro 18K',
    precio_venta: 210000,
    imagen_principal_url: '/elemento_uso.jpg',
    bonds_tag: 'LÍNEA AVENTURA'
  },
  {
    id: 'nudo_infinito_oro',
    nombre: 'Nudo Infinito Tradicional',
    categoria: 'Tradicional',
    descripcion: 'Tejido Cobra Negro, Balines Oro 18K',
    precio_venta: 165000,
    imagen_principal_url: '/elemento_empaque.jpg',
    bonds_tag: 'LÍNEA TRADICIONAL'
  }
]

const CATEGORIAS_PILLS = [
  'Todos',
  'Religiosa',
  'Tradicional',
  'Aventura',
  'Ediciones Especiales'
]

export default function Catalogo() {
  const [productos, setProductos] = useState<ProductoData[]>(PRODUCTOS_STORE_FALLBACK)
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos')
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  // Estados para Modal de Compra Directa por WhatsApp & Captura VIP (Recompra)
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<ProductoData | null>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false)
  const [nombreCliente, setNombreCliente] = useState<string>('')
  const [telefonoCliente, setTelefonoCliente] = useState<string>('')
  const [ciudadCliente, setCiudadCliente] = useState<string>('')

  const handleAbrirModalCompra = (prod: ProductoData) => {
    setSelectedProductForBuy(prod)
    setIsBuyModalOpen(true)
  }

  const handleEnviarPedidoWhatsApp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductForBuy) return

    const precio = formatCurrency(
      selectedProductForBuy.precio_venta || (selectedProductForBuy as any).precio || 0
    )

    // Guardar lead localmente para fidelización y recompensas
    if (telefonoCliente.trim()) {
      try {
        const lead = {
          nombre: nombreCliente.trim() || 'Cliente VIP',
          telefono: telefonoCliente.trim(),
          ciudad: ciudadCliente.trim() || 'Colombia',
          producto: selectedProductForBuy.nombre,
          fecha: new Date().toISOString()
        }
        const prevLeads = JSON.parse(localStorage.getItem('jhaular_vip_leads') || '[]')
        localStorage.setItem('jhaular_vip_leads', JSON.stringify([...prevLeads, lead]))
      } catch (err) {
        console.warn('Error guardando lead VIP:', err)
      }
    }

    const saludo = nombreCliente.trim() ? `¡Hola Jhaular Atelier! Mi nombre es *${nombreCliente.trim()}*` : '¡Hola Jhaular Atelier!'
    const ciudadStr = ciudadCliente.trim() ? ` de *${ciudadCliente.trim()}*` : ''
    const telStr = telefonoCliente.trim() ? ` (Tel: ${telefonoCliente.trim()})` : ''

    const mensaje = encodeURIComponent(
      `${saludo}${ciudadStr}${telStr}.\n\n` +
      `🛒 *PEDIDO DE COMPRA DIRECTA*:\n` +
      `• *Producto*: ${selectedProductForBuy.nombre}\n` +
      `• *Precio*: ${precio}\n\n` +
      `¿Tienen disponibilidad inmediata para realizar el envío hoy mismo?`
    )

    window.open(`https://wa.me/573215964456?text=${mensaje}`, '_blank')
    setIsBuyModalOpen(false)
  }

  useEffect(() => {
    const fetchPublicProducts = async () => {
      try {
        setLoading(true)

        // 1. Consultar base de datos Supabase
        const { data: prodsData, error } = await supabase
          .from('productos')
          .select('*')
          .order('created_at', { ascending: false })

        // 2. Leer productos guardados en localStorage local
        let localProds: ProductoData[] = []
        try {
          localProds = JSON.parse(localStorage.getItem('jhaular_saved_productos') || '[]')
        } catch (e) {
          console.warn('Error leyendo productos locales:', e)
        }

        const mapaUnico = new Map<string, ProductoData>()

        // 3. Fallbacks locales por defecto
        PRODUCTOS_STORE_FALLBACK.forEach((p) => {
          if (p.id) mapaUnico.set(p.id, p)
        })

        // 4. Productos reales de Supabase
        if (!error && prodsData && prodsData.length > 0) {
          prodsData.forEach((p) => {
            if (p.id) mapaUnico.set(p.id, p)
          })
        }

        // 5. Aplicar las ediciones locales más recientes realizadas por el admin
        localProds.forEach((p) => {
          if (p.id) {
            const prev = mapaUnico.get(p.id) || {}
            mapaUnico.set(p.id, { ...prev, ...p })
          }
        })

        setProductos(Array.from(mapaUnico.values()))
      } catch (err) {
        console.warn('Cargando catálogo público con productos local:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPublicProducts()
  }, [])

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  // Filtrado dinámico flexible
  const productosFiltrados = useMemo(() => {
    return productos.filter((prod) => {
      const catStr = (
        prod.categoria ||
        (prod as any).categoria_id ||
        prod.bonds_tag ||
        prod.meta_keywords ||
        ''
      ).toLowerCase()

      const selectedStr = selectedCategoria.toLowerCase()

      const matchCategory =
        selectedCategoria === 'Todos' ||
        catStr.includes(selectedStr) ||
        selectedStr.includes(catStr) ||
        (selectedStr.includes('aventura') && (catStr.includes('aventura') || catStr.includes('selva') || catStr.includes('manilla'))) ||
        (selectedStr.includes('ediciones') && (catStr.includes('edicion') || catStr.includes('especial') || catStr.includes('ancestral'))) ||
        (selectedStr.includes('religiosa') && (catStr.includes('religiosa') || catStr.includes('sacra') || catStr.includes('rosario'))) ||
        (selectedStr.includes('tradicional') && (catStr.includes('tradicional') || catStr.includes('nudo') || catStr.includes('clasico')))

      const matchSearch =
        prod.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchCategory && matchSearch
    })
  }, [productos, selectedCategoria, searchQuery])

  // Obtener la manilla / pieza más costosa de cada colección dinámicamente
  const piezasMasCostosas = useMemo(() => {
    const findMostExpensive = (keywords: string[]) => {
      const match = productos.filter((p) => {
        const text = (
          p.categoria ||
          (p as any).categoria_id ||
          p.bonds_tag ||
          p.meta_keywords ||
          p.nombre ||
          ''
        ).toLowerCase()

        return keywords.some((kw) => text.includes(kw.toLowerCase()))
      })

      if (match.length === 0) return null
      return match.reduce((max, item) => (item.precio_venta > max.precio_venta ? item : max), match[0])
    }

    const rel = findMostExpensive(['religiosa', 'sacra', 'rosario'])
    const ave = findMostExpensive(['aventura', 'selva', 'sagrada', 'brazalete'])
    const tra = findMostExpensive(['tradicional', 'nudo', 'clasico', 'cobra'])
    const bes = findMostExpensive(['especial', 'ancestral', 'bespoke', 'edicion'])

    return {
      religiosa: {
        nombre: rel?.nombre || 'Rosario Imperial Sacro 18K',
        precio: rel?.precio_venta || 280000,
        descripcion: rel?.descripcion || 'Símbolos de fe tejidos con devoción imperecedera y cruces sacras en oro de 18K.',
        imagen: convertGoogleDriveUrl(rel?.imagen_principal_url || rel?.imagen_url) || '/elemento_editorial.jpg',
        catalogo: 'COLECCIÓN RELIGIOSA / SACRA'
      },
      aventura: {
        nombre: ave?.nombre || 'Brazalete Selva Sagrada Gold',
        precio: ave?.precio_venta || 210000,
        descripcion: ave?.descripcion || 'Hilo verde musgo, esmeralda en bruto y balines macizos en oro 18K.',
        imagen: convertGoogleDriveUrl(ave?.imagen_principal_url || ave?.imagen_url) || '/coleccion-aventura.jpeg',
        catalogo: 'LÍNEA AVENTURA'
      },
      tradicional: {
        nombre: tra?.nombre || 'Nudo Infinito Tradicional',
        precio: tra?.precio_venta || 250000,
        descripcion: tra?.descripcion || 'El arte clásico del macramé colombiano enaltecido con esferas de oro de 18K.',
        imagen: convertGoogleDriveUrl(tra?.imagen_principal_url || tra?.imagen_url) || '/cortesadorada.jpeg',
        catalogo: 'LÍNEA TRADICIONAL'
      },
      bespoke: {
        nombre: bes?.nombre || 'Manilla Elemento Ancestral Bespoke',
        precio: bes?.precio_venta || 320000,
        descripcion: bes?.descripcion || 'Pieza exclusiva de máxima joyería con dijes magnéticos en oro 18K certificado.',
        imagen: convertGoogleDriveUrl(bes?.imagen_principal_url || bes?.imagen_url) || '/elemento_macro.jpg',
        catalogo: 'EDICIONES ESPECIALES & BESPOKE'
      }
    }
  }, [productos])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] dark:bg-[#0D0D10] text-[#1F1C18] dark:text-[#E8E2D8] font-sans selection:bg-[#D4AF37] selection:text-white pb-24 transition-colors duration-300">
      {/* 1. NAVEGACIÓN PRINCIPAL SUPERIOR */}
      <nav className="sticky top-0 z-40 bg-[#FDFBF7]/90 dark:bg-[#0D0D10]/90 backdrop-blur-md border-b border-[#EAE5DC] dark:border-[#25221E] px-4 sm:px-8 py-4 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/logo.png"
              alt="Jhaular"
              className="h-9 w-9 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-serif text-2xl font-bold tracking-wider text-[#1F1C18] dark:text-[#D4AF37] block leading-none transition-colors">
                JHAULAR
              </span>
              <span className="text-[9px] font-mono tracking-[0.25em] text-[#8C8275] uppercase block mt-1">
                Catálogo de Joyería
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/laboratorio"
              className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#14261C] text-[#85E3B3] hover:bg-[#084F35] transition-all shadow-sm"
            >
              <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Laboratorio 3D</span>
            </Link>

            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#6E6659] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] hover:bg-[#F2ECE1] dark:hover:bg-[#18181E] transition-all"
            >
              Inicio
            </Link>

            <Link
              to="/certificados"
              className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#6E6659] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] hover:bg-[#F2ECE1] dark:hover:bg-[#18181E] transition-all"
            >
              Autenticidad
            </Link>

            {/* Interruptor de Modo Claro / Modo Oscuro */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-14">
        {/* 2. BARRA SUPERIOR DE FILTROS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-[#141418] rounded-2xl border border-[#EAE5DC] dark:border-[#25221E] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-colors">
          {/* A la izquierda: Input de búsqueda con icono de lupa */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8275]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, materiales o dijes..."
              className="w-full pl-9 pr-4 py-2 bg-[#F4EFE6] dark:bg-[#1D1C22] border border-[#E3DCcf] dark:border-[#2D2A26] rounded-full text-xs text-[#1F1C18] dark:text-[#E8E2D8] placeholder:text-[#8C8275] focus:outline-none focus:border-[#B8860B] dark:focus:border-[#D4AF37] focus:bg-white dark:focus:bg-[#18181E] transition-all font-medium"
            />
          </div>

          {/* En el centro: Botones tipo "Píldora" (Pills) con fondo blanco y borde sutil */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIAS_PILLS.map((cat) => {
              const isActive = selectedCategoria === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-[#1F1C18] dark:bg-[#D4AF37] text-[#FDFBF7] dark:text-black border-[#1F1C18] dark:border-[#D4AF37] shadow-sm font-semibold'
                      : 'bg-white dark:bg-[#1D1C22] text-[#6E6659] dark:text-[#A89E90] border-[#E3DCcf] dark:border-[#2D2A26] hover:bg-[#F2ECE1] dark:hover:bg-[#25221E] hover:text-[#1F1C18] dark:hover:text-[#E8E2D8]'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* A la derecha: Botón oscuro redondeado "Ver todo" */}
          <button
            onClick={() => {
              setSelectedCategoria('Todos')
              setSearchQuery('')
            }}
            className="w-full md:w-auto px-5 py-2 rounded-full text-xs font-mono font-bold bg-[#1F1C18] dark:bg-[#D4AF37] text-white dark:text-black hover:bg-[#38332C] dark:hover:bg-[#E5C158] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
          >
            <span>Ver todo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. SECCIÓN "MÁS VENDIDOS" */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-[#EAE5DC] dark:border-[#25221E] pb-4 transition-colors">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#B8860B] dark:text-[#D4AF37] font-bold block mb-1">
                Colección Destacada
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1C18] dark:text-white">
                MÁS VENDIDOS
              </h2>
            </div>

            <button
              onClick={() => {
                setSelectedCategoria('Todos')
                setSearchQuery('')
              }}
              className="text-xs font-mono font-bold text-[#8C8275] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span>Ver colección</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cuadrícula de 4 Columnas (grid-cols-1 md:grid-cols-2 lg:grid-cols-4) */}
          {loading && productos.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#141418] rounded-3xl border border-[#EAE5DC] dark:border-[#25221E] space-y-2">
              <Compass className="w-8 h-8 text-[#D4AF37] mx-auto animate-spin" />
              <p className="font-serif font-bold text-lg text-[#1F1C18] dark:text-white">Cargando colección de lujo...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#141418] rounded-3xl border border-[#EAE5DC] dark:border-[#25221E] space-y-2">
              <Compass className="w-8 h-8 text-[#8C8275] mx-auto" />
              <p className="font-serif font-bold text-lg text-[#1F1C18] dark:text-white">No se encontraron productos</p>
              <p className="text-xs text-[#736E65] dark:text-[#A89E90]">Prueba seleccionando otra categoría en las píldoras superiores.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productosFiltrados.map((item, idx) => {
                const itemId = item.id || `prod_${idx}`
                const isFav = favorites[itemId] || false
                const rawImg = item.imagen_principal_url || item.imagen_url || (item as any).imagen || '/elemento_editorial.jpg'
                const displayImg = convertGoogleDriveUrl(rawImg)
                const badge = item.bonds_tag || item.meta_keywords || (item as any).etiqueta || (item.destacado ? 'MÁS VENDIDO' : null)
                const retailPrice = item.precio_venta || (item as any).precio || 0

                return (
                  <motion.div
                    key={itemId}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white dark:bg-[#141418] rounded-2xl p-3.5 border border-[#EAE5DC] dark:border-[#25221E] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Imagen con Icono de Corazón en la esquina superior derecha */}
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#F4F0E8] dark:bg-[#1E1C22] flex items-center justify-center">
                        <img
                          src={displayImg}
                          alt={item.nombre}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            const cSrc = target.src
                            if (cSrc.includes('lh3.googleusercontent.com/d/')) {
                              const fId = cSrc.split('/d/')[1]
                              if (fId) {
                                target.src = `https://drive.google.com/thumbnail?id=${fId}&sz=w1000`
                                return
                              }
                            }
                            target.src = '/elemento_editorial.jpg'
                          }}
                        />

                        {/* Etiqueta de la tarjeta */}
                        {badge && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-[#1F1C18]/90 text-[#FDFBF7] backdrop-blur-md border border-white/10 shadow-sm">
                            {badge}
                          </span>
                        )}

                        {/* Icono de Corazón (Favorito) */}
                        <button
                          onClick={() => toggleFavorite(itemId)}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer ${
                            isFav
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-white/80 dark:bg-black/60 text-[#1F1C18] dark:text-white hover:bg-white hover:text-red-500 border border-black/5'
                          }`}
                          title="Guardar favorito"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Textos de la tarjeta: Título, Subtítulo con descripción y Calificación de estrellas */}
                      <div className="pt-4 pb-2 space-y-1.5">
                        {/* Calificación de Estrellas */}
                        <div className="flex items-center space-x-1 text-[11px] text-[#B8860B] dark:text-[#D4AF37]">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          <span className="font-mono text-[#736E65] dark:text-[#A89E90] text-[10px] ml-1">
                            (5.0)
                          </span>
                        </div>

                        {/* Título del Producto */}
                        <h3 className="font-serif font-bold text-base text-[#1F1C18] dark:text-white group-hover:text-[#B8860B] dark:group-hover:text-[#D4AF37] transition-colors leading-snug line-clamp-1">
                          {item.nombre}
                        </h3>

                        {/* Subtítulo / Descripción */}
                        <p className="text-xs text-[#736E65] dark:text-[#A89E90] font-sans line-clamp-2 leading-relaxed">
                          {item.descripcion || 'Pieza de macramé de alta joyería y oro 18K certificado.'}
                        </p>
                      </div>
                    </div>

                    {/* Precio en COP y Botón Comprar por WhatsApp */}
                    <div className="pt-3 border-t border-[#F2ECE1] dark:border-[#25221E] flex items-center justify-between transition-colors">
                      <div>
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#8C8275] block font-bold">
                          PRECIO
                        </span>
                        <span className="text-base font-bold font-mono text-[#0F4332] dark:text-[#85E3B3]">
                          {formatCurrency(retailPrice)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAbrirModalCompra(item)}
                        className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#14261C] hover:bg-[#084F35] text-[#85E3B3] transition-all shadow-md flex items-center space-x-1.5 cursor-pointer hover:scale-105"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Comprar</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* 4. PIEZAS MAESTRAS DE ALTA GAMA POR COLECCIÓN (MANILLAS MÁS COSTOSAS CON SU CATÁLOGO) */}
        <section className="space-y-6 pt-6 border-t border-[#EAE5DC] dark:border-[#25221E]">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#B8860B] dark:text-[#D4AF37] font-bold block">
              Selección Suprema de Alta Joyería
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1C18] dark:text-white uppercase">
              Piezas Maestras por Colección
            </h2>
            <p className="text-xs text-[#736E65] dark:text-[#A89E90]">
              Las creaciones más exclusivas y valiosas de cada línea de catálogo Jhaular Atelier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner 1: RELIGIOSA (Pieza Más Costosa) */}
            <div className="relative rounded-3xl overflow-hidden h-96 shadow-xl group border border-[#D4AF37]/30">
              <img
                src={piezasMasCostosas.religiosa.imagen}
                alt={piezasMasCostosas.religiosa.nombre}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/elemento_editorial.jpg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:from-black/98 transition-all" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D4AF37] font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40">
                    {piezasMasCostosas.religiosa.catalogo}
                  </span>
                  <span className="text-sm font-bold font-mono text-[#85E3B3] bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                    {formatCurrency(piezasMasCostosas.religiosa.precio)}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight">
                  {piezasMasCostosas.religiosa.nombre}
                </h3>
                <p className="text-xs text-white/85 font-sans max-w-md leading-relaxed line-clamp-2">
                  {piezasMasCostosas.religiosa.descripcion}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategoria('Religiosa')
                      window.scrollTo({ top: 120, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-[#D4AF37] text-black hover:bg-white transition-all shadow-md cursor-pointer"
                  >
                    <span>Ver Colección Religiosa →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 2: AVENTURA (Pieza Más Costosa) */}
            <div className="relative rounded-3xl overflow-hidden h-96 shadow-xl group border border-emerald-500/30">
              <img
                src={piezasMasCostosas.aventura.imagen}
                alt={piezasMasCostosas.aventura.nombre}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/coleccion-aventura.jpeg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:from-black/98 transition-all" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#85E3B3] font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/40">
                    {piezasMasCostosas.aventura.catalogo}
                  </span>
                  <span className="text-sm font-bold font-mono text-[#85E3B3] bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                    {formatCurrency(piezasMasCostosas.aventura.precio)}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight">
                  {piezasMasCostosas.aventura.nombre}
                </h3>
                <p className="text-xs text-white/85 font-sans max-w-md leading-relaxed line-clamp-2">
                  {piezasMasCostosas.aventura.descripcion}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategoria('Aventura')
                      window.scrollTo({ top: 120, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-[#85E3B3] text-black hover:bg-white transition-all shadow-md cursor-pointer"
                  >
                    <span>Ver Línea Aventura →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 3: TRADICIONAL (Pieza Más Costosa) */}
            <div className="relative rounded-3xl overflow-hidden h-96 shadow-xl group border border-[#D4AF37]/30">
              <img
                src={piezasMasCostosas.tradicional.imagen}
                alt={piezasMasCostosas.tradicional.nombre}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/cortesadorada.jpeg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:from-black/98 transition-all" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D4AF37] font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40">
                    {piezasMasCostosas.tradicional.catalogo}
                  </span>
                  <span className="text-sm font-bold font-mono text-[#85E3B3] bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                    {formatCurrency(piezasMasCostosas.tradicional.precio)}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight">
                  {piezasMasCostosas.tradicional.nombre}
                </h3>
                <p className="text-xs text-white/85 font-sans max-w-md leading-relaxed line-clamp-2">
                  {piezasMasCostosas.tradicional.descripcion}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategoria('Tradicional')
                      window.scrollTo({ top: 120, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-white text-black hover:bg-[#D4AF37] transition-all shadow-md cursor-pointer"
                  >
                    <span>Ver Línea Tradicional →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner 4: EDICIONES ESPECIALES & BESPOKE (Pieza Más Costosa) */}
            <div className="relative rounded-3xl overflow-hidden h-96 shadow-xl group border border-amber-500/40">
              <img
                src={piezasMasCostosas.bespoke.imagen}
                alt={piezasMasCostosas.bespoke.nombre}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/elemento_macro.jpg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#082218]/95 via-black/50 to-black/20 group-hover:from-[#082218] transition-all" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D4AF37] font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40">
                    {piezasMasCostosas.bespoke.catalogo}
                  </span>
                  <span className="text-sm font-bold font-mono text-[#85E3B3] bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                    {formatCurrency(piezasMasCostosas.bespoke.precio)}
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide leading-tight">
                  {piezasMasCostosas.bespoke.nombre}
                </h3>
                <p className="text-xs text-white/85 font-sans max-w-md leading-relaxed line-clamp-2">
                  {piezasMasCostosas.bespoke.descripcion}
                </p>
                <div className="pt-2">
                  <Link
                    to="/laboratorio"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black hover:opacity-95 transition-all shadow-md"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Personalizar en Laboratorio 3D →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL DE COMPRA DIRECTA POR WHATSAPP & CAPTURA PARA RECOMPRA */}
      {isBuyModalOpen && selectedProductForBuy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#141418] border border-[#D4AF37]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-[#18181E] border-b border-[#25221E] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white leading-none">
                    Comprar por WhatsApp
                  </h3>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mt-1">
                    Atención Inmediata & Envío Seguro
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario & Producto */}
            <form onSubmit={handleEnviarPedidoWhatsApp} className="p-6 space-y-4">
              {/* Tarjeta del Producto Seleccionado */}
              <div className="p-3 bg-[#1B1B22] border border-[#2D2A26] rounded-2xl flex items-center space-x-3">
                <img
                  src={convertGoogleDriveUrl(selectedProductForBuy.imagen_principal_url || selectedProductForBuy.imagen_url) || '/elemento_editorial.jpg'}
                  alt={selectedProductForBuy.nombre}
                  className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/elemento_editorial.jpg'
                  }}
                />
                <div className="space-y-0.5">
                  <span className="text-[9.5px] font-mono uppercase tracking-widest text-amber-400 block font-semibold">
                    {selectedProductForBuy.bonds_tag || 'DISPONIBLE'}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-white line-clamp-1">
                    {selectedProductForBuy.nombre}
                  </h4>
                  <span className="text-base font-bold font-mono text-emerald-400 block">
                    {formatCurrency(selectedProductForBuy.precio_venta || (selectedProductForBuy as any).precio || 0)}
                  </span>
                </div>
              </div>

              {/* Formulario para Captura de Datos (Recompra & Descuentos VIP) */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tu Nombre Completo</span>
                  </label>
                  <input
                    type="text"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    placeholder="Ej: Carlos Mendoza"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>WhatsApp / Celular</span>
                    </label>
                    <input
                      type="tel"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      placeholder="3001234567"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ciudad</span>
                    </label>
                    <input
                      type="text"
                      value={ciudadCliente}
                      onChange={(e) => setCiudadCliente(e.target.value)}
                      placeholder="Ej: Bogotá"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                    />
                  </div>
                </div>

                <p className="text-[10.5px] text-amber-300/80 font-mono flex items-center space-x-1 pt-1">
                  <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>¡Al registrarte recibes 10% OFF en tu próxima recompra!</span>
                </p>
              </div>

              {/* Botón Principal CTA: Comprar por WhatsApp */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer border border-emerald-400/40 hover:scale-[1.02]"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Enviar Pedido a WhatsApp de Inmediato</span>
              </button>

              {/* Enlace secundario: Personalizar */}
              <div className="text-center pt-1">
                <Link
                  to="/laboratorio"
                  onClick={() => setIsBuyModalOpen(false)}
                  className="text-xs font-mono text-slate-400 hover:text-amber-400 underline transition-colors"
                >
                  ¿Deseas personalizar esta pieza con dijes en 3D? Haz clic aquí
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
