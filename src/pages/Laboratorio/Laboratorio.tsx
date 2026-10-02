import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Gem,
  ChevronRight,
  X,
  MessageCircle,
  Trash2,
  MousePointer,
  RefreshCw,
  Split,
  CircleDot,
  Wand2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import Canvas3D from '../../components/laboratorio/Canvas3D'
import { hayColisionSolida } from '../../components/laboratorio/BraceletEngine'
import type { ElementoColocado, ElementoInventario } from '../../components/laboratorio/BraceletEngine'

// =========================================================================
// INVENTARIO VISUAL DE ELEMENTOS BESPOKE (ORO 18K & ESMERALDAS COLOMBIANAS)
// =========================================================================

interface OpcionHilo {
  id: string
  nombre: string
  calibre: 'Terlenca' | 'Coreano'
  colorHex: string
  descripcion: string
  recargoInterno: number
}

interface OpcionNudo {
  id: string
  nombre: string
  descripcion: string
  diasManufactura: number
  precioBaseInterno: number
  icono: string
}

const CATALOGO_HILOS: OpcionHilo[] = [
  { id: 'h_negro_terlenca', nombre: 'Negro Bondeado T70', calibre: 'Terlenca', colorHex: '#0a0a0a', descripcion: 'Hilo de nylon T70 de alta tenacidad en negro mate profundo.', recargoInterno: 0 },
  { id: 'h_rojo_terlenca', nombre: 'Rojo Carmesí', calibre: 'Terlenca', colorHex: '#8B1E1E', descripcion: 'Hilo encerado de protección tradicional rojo rubí.', recargoInterno: 0 },
  { id: 'h_beige_terlenca', nombre: 'Beige Arena / Seda', calibre: 'Terlenca', colorHex: '#D8C8B8', descripcion: 'Tonalidad arena clara con acabado satinado suave.', recargoInterno: 0 },
  { id: 'h_dorado_terlenca', nombre: 'Oro Noble Champán', calibre: 'Terlenca', colorHex: '#C5A059', descripcion: 'Reflejos satinados en dorado champán.', recargoInterno: 0 },
  { id: 'h_cafe_terlenca', nombre: 'Café Imperial', calibre: 'Terlenca', colorHex: '#3D2817', descripcion: 'Tonalidad tabaco profunda con matices cobrizos.', recargoInterno: 0 },
  { id: 'h_verde_terlenca', nombre: 'Verde Esmeralda', calibre: 'Terlenca', colorHex: '#084F35', descripcion: 'Tono botánico inspirado en las minas de Muzo.', recargoInterno: 0 },
  { id: 'h_azul_terlenca', nombre: 'Azul Zafiro Real', calibre: 'Terlenca', colorHex: '#0F2042', descripcion: 'Tejido azul profundo de gala.', recargoInterno: 0 },
  { id: 'h_rosa_terlenca', nombre: 'Rosa Palo / Nude', calibre: 'Terlenca', colorHex: '#B28B84', descripcion: 'Tonalidad empolvada delicada y contemporánea.', recargoInterno: 0 },
]

const CATALOGO_NUDOS: OpcionNudo[] = [
  { id: 'plano', nombre: 'Tejido Plano Tradicional', descripcion: 'El clásico nudo cuadrado de orfebrería con ajuste simétrico.', diasManufactura: 2, precioBaseInterno: 45000, icono: '◈' },
  { id: 'espiral', nombre: 'Espiral Salomónico', descripcion: 'Giro continuo helicoidal de 360° con efecto tornasol.', diasManufactura: 3, precioBaseInterno: 58000, icono: '◎' },
  { id: 'cobra', nombre: 'Cobra Real Cuádruple', descripcion: 'Tejido denso y ancho de máxima presencia y cuerpo.', diasManufactura: 4, precioBaseInterno: 68000, icono: '❖' }
]

const INVENTARIO_PALETA: ElementoInventario[] = [
  // 1. Balines en Oro de 18 Kilates (Oro 18K)
  { tipo: 'balin', tamano: '#3', nombre: 'Balín Oro 18K #3', diametroMm: 3, pesoGramos: 0.18, precioInterno: 18000 },
  { tipo: 'balin', tamano: '#4', nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { tipo: 'balin', tamano: '#5', nombre: 'Balín Oro 18K #5', diametroMm: 5, pesoGramos: 0.52, precioInterno: 42000 },
  { tipo: 'balin', tamano: '#6', nombre: 'Balín Oro 18K #6', diametroMm: 6, pesoGramos: 0.78, precioInterno: 56000 },
  { tipo: 'balin', tamano: '#7', nombre: 'Balín Oro 18K #7', diametroMm: 7, pesoGramos: 1.12, precioInterno: 70000 },
  { tipo: 'balin', tamano: '#8', nombre: 'Balín Oro 18K #8', diametroMm: 8, pesoGramos: 1.55, precioInterno: 84000 },

  // 2. Murallas de Esmeralda Colombiana
  { tipo: 'esmeralda', tamano: '#3', nombre: 'Esmeralda #3 Muzo', diametroMm: 3, origen: 'Muzo', precioInterno: 38000 },
  { tipo: 'esmeralda', tamano: '#4', nombre: 'Esmeralda #4 Chivor', diametroMm: 4, origen: 'Chivor', precioInterno: 52000 },
  { tipo: 'esmeralda', tamano: '#5', nombre: 'Esmeralda #5 Muzo', diametroMm: 5, origen: 'Muzo', precioInterno: 72000 },
  { tipo: 'esmeralda', tamano: '#6', nombre: 'Esmeralda #6 Coscuez', diametroMm: 6, origen: 'Coscuez', precioInterno: 95000 },

  // 3. Nudos Franciscanos (Barril de Macramé)
  { tipo: 'nudo', tamano: 'T70', nombre: 'Nudo Franciscano T70', diametroMm: 5, precioInterno: 12000 },

  // 4. Dijes Centrales en Oro 18K
  { tipo: 'dije', tamano: '18K', nombre: 'Cruz Sacra en Oro 18K', precioInterno: 135000, imagenUrl: '/elemento_macro.jpg' },
  { tipo: 'dije', tamano: '18K', nombre: 'Medalla San Benito 18K', precioInterno: 155000, imagenUrl: '/elemento_editorial.jpg' },
  { tipo: 'dije', tamano: '18K', nombre: 'Virgen Milagrosa 18K', precioInterno: 145000, imagenUrl: '/elemento_uso.jpg' },
  { tipo: 'dije', tamano: '18K', nombre: 'Nudo Infinito 18K', precioInterno: 115000, imagenUrl: '/elemento_empaque.jpg' },
  { tipo: 'dije', tamano: '18K', nombre: 'Brújula Ancestral 18K', precioInterno: 138000, imagenUrl: '/coleccion-aventura.jpeg' },
  { tipo: 'dije', tamano: '18K', nombre: 'Jaguar Sagrado 18K', precioInterno: 175000, imagenUrl: '/cortesadorada.jpeg' }
]

// Plantilla inicial clásica de alta joyería en Oro 18K
const PLANTILLA_INICIAL: ElementoColocado[] = [
  { id: 'init-esm-1', tipo: 'esmeralda', tamano: '#4', angulo: Math.PI / 2 - 0.09, nombre: 'Esmeralda #4 Chivor', precioInterno: 52000 },
  { id: 'init-esm-2', tipo: 'esmeralda', tamano: '#4', angulo: Math.PI / 2 + 0.09, nombre: 'Esmeralda #4 Chivor', precioInterno: 52000 },
  { id: 'init-bal-1', tipo: 'balin', tamano: '#4', angulo: Math.PI / 2 - 0.35, nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { id: 'init-bal-2', tipo: 'balin', tamano: '#4', angulo: Math.PI / 2 + 0.35, nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { id: 'init-bal-3', tipo: 'balin', tamano: '#4', angulo: Math.PI / 2 - 0.65, nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { id: 'init-bal-4', tipo: 'balin', tamano: '#4', angulo: Math.PI / 2 + 0.65, nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { id: 'init-bal-5', tipo: 'balin', tamano: '#4', angulo: Math.PI / 2 - 0.95, nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { id: 'init-bal-6', tipo: 'balin', tamano: '#4', angulo: Math.PI / 2 + 0.95, nombre: 'Balín Oro 18K #4', diametroMm: 4, pesoGramos: 0.32, precioInterno: 28000 },
  { id: 'init-nud-1', tipo: 'nudo', tamano: 'T70', angulo: Math.PI / 2 - 1.25, nombre: 'Nudo Franciscano T70', precioInterno: 12000 },
  { id: 'init-nud-2', tipo: 'nudo', tamano: 'T70', angulo: Math.PI / 2 + 1.25, nombre: 'Nudo Franciscano T70', precioInterno: 12000 },
]

export default function Laboratorio() {
  // Código de Autenticidad
  const [codigoAutenticidad] = useState<string>(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `JHA-TEMP-${randomNum}`
  })

  // Nombre de la creación
  const [nombreCreacion, setNombreCreacion] = useState<string>('Manilla Bespoke Jhaular')

  // Configuración de Hilo y Tejido Base
  const [calibreSeleccionado, setCalibreSeleccionado] = useState<'Terlenca' | 'Coreano'>('Terlenca')
  const [hiloSeleccionado, setHiloSeleccionado] = useState<OpcionHilo>(CATALOGO_HILOS[0])
  const [nudoSeleccionado, setNudoSeleccionado] = useState<OpcionNudo>(CATALOGO_NUDOS[0])

  // Piezas en la manilla
  const [piezasColocadas, setPiezasColocadas] = useState<ElementoColocado[]>(PLANTILLA_INICIAL)

  // Herramienta Activa
  const [herramientaActiva, setHerramientaActiva] = useState<ElementoInventario | null>(INVENTARIO_PALETA[1])

  // Pieza Seleccionada
  const [piezaSeleccionadaId, setPiezaSeleccionadaId] = useState<string | null>(null)

  // Modo Auto-Armonizar Posiciones al eliminar
  const [autoArmonizar, setAutoArmonizar] = useState<boolean>(true)

  // Filtro de Categoría en la Paleta
  const [categoriaPaleta, setCategoriaPaleta] = useState<'todos' | 'balin' | 'esmeralda' | 'nudo' | 'dije'>('todos')

  // WhatsApp oficial
  const NUMERO_WHATSAPP_REAL = '573215964456'
  const [whatsappNumero, setWhatsappNumero] = useState<string>(NUMERO_WHATSAPP_REAL)

  // Checkout y UI
  const [mostrarModalResumen, setMostrarModalResumen] = useState<boolean>(false)
  const [procesandoCheckout, setProcesandoCheckout] = useState<boolean>(false)
  const [toastMensaje, setToastMensaje] = useState<string | null>(null)

  // Sincronización Supabase
  useEffect(() => {
    async function sincronizarConfiguracion() {
      try {
        const { data: configData, error: configError } = await (supabase as any)
          .from('configuracion')
          .select('valor')
          .eq('clave', 'whatsapp_numero')
          .maybeSingle()

        if (!configError && configData?.valor) {
          const digitos = String(configData.valor).replace(/[^0-9]/g, '')
          if (digitos) {
            setWhatsappNumero(digitos.startsWith('57') ? digitos : `57${digitos}`)
          }
        }
      } catch (err) {
        console.warn('Sincronización Supabase.', err)
      }
    }
    sincronizarConfiguracion()
  }, [])

  // =========================================================================
  // MANEJADORES DE ELEMENTOS (COLOCAR, MOVER, ELIMINACIÓN INSTANTÁNEA SILENCIOSA)
  // =========================================================================

  const handleColocarPieza = (nuevaPieza: Omit<ElementoColocado, 'id'>) => {
    if (hayColisionSolida(nuevaPieza.angulo, nuevaPieza.tipo, nuevaPieza.tamano, piezasColocadas)) {
      return
    }
    const id = `pieza-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    const elemento: ElementoColocado = { ...nuevaPieza, id }
    setPiezasColocadas((prev) => [...prev, elemento])
    setPiezaSeleccionadaId(id)
  }

  const handleMoverPieza = (id: string, nuevoAngulo: number) => {
    setPiezasColocadas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, angulo: nuevoAngulo } : p))
    )
  }

  // ELIMINACIÓN INSTANTÁNEA Y SILENCIOSA SIN MENSAJES NI ALERTAS
  const handleEliminarPieza = (id: string, forzarArmonizar = autoArmonizar) => {
    const filtradas = piezasColocadas.filter((p) => p.id !== id)
    if (forzarArmonizar && filtradas.length > 0) {
      const total = filtradas.length
      const span = Math.min(Math.PI * 1.5, total * 0.28)
      const armonizadas = filtradas.map((pieza, i) => {
        const angulo = Math.PI / 2 + (i - (total - 1) / 2) * (span / Math.max(1, total - 1 || 1))
        return { ...pieza, angulo }
      })
      setPiezasColocadas(armonizadas)
    } else {
      setPiezasColocadas(filtradas)
    }
    if (piezaSeleccionadaId === id) setPiezaSeleccionadaId(null)
  }

  const handleLimpiarManilla = () => {
    setPiezasColocadas([])
    setPiezaSeleccionadaId(null)
  }

  const handleCargarPlantilla = () => {
    setPiezasColocadas(PLANTILLA_INICIAL)
    setPiezaSeleccionadaId(null)
  }

  // Reacomodar y Armonizar Perímetro Completo
  const handleArmonizarPerimetro = () => {
    if (piezasColocadas.length === 0) return
    const total = piezasColocadas.length
    const span = Math.min(Math.PI * 1.55, total * 0.26)
    const actualizadas = piezasColocadas.map((pieza, i) => {
      const angulo = Math.PI / 2 + (i - (total - 1) / 2) * (span / Math.max(1, total - 1 || 1))
      return { ...pieza, angulo }
    })
    setPiezasColocadas(actualizadas)
  }

  // Distribución Equidistante 360°
  const handleDistribuirEquidistante = () => {
    if (piezasColocadas.length === 0) return
    const total = piezasColocadas.length
    const actualizadas = piezasColocadas.map((pieza, i) => {
      const angulo = (i / total) * Math.PI * 2 - Math.PI / 2 + 0.3
      return { ...pieza, angulo }
    })
    setPiezasColocadas(actualizadas)
  }

  // Reflejo Espejo (Simetría Bilateral)
  const handleSimetriaEspejo = () => {
    if (piezasColocadas.length === 0) return
    const piezasLadoDer = piezasColocadas.filter((p) => p.angulo >= Math.PI / 2 || p.angulo <= -Math.PI / 2)
    const reflejadas = piezasLadoDer.map((p, idx) => ({
      ...p,
      id: `mirror-${Date.now()}-${idx}`,
      angulo: Math.PI - p.angulo
    }))
    setPiezasColocadas((prev) => [...prev, ...reflejadas])
  }

  // =========================================================================
  // CÁLCULO DE COSTOS CONSOLIDADO & GRAMOS DE ORO 18K
  // =========================================================================

  const subtotalBase = Number(nudoSeleccionado?.precioBaseInterno || 45000) + Number(hiloSeleccionado?.recargoInterno || 0)
  const subtotalPiezas = useMemo(() => {
    return piezasColocadas.reduce((acc, p) => acc + (Number(p.precioInterno) || 0), 0)
  }, [piezasColocadas])

  const precioTotalFinal = useMemo(() => {
    return subtotalBase + subtotalPiezas
  }, [subtotalBase, subtotalPiezas])

  const pesoOroTotalGramos = useMemo(() => {
    const total = piezasColocadas
      .filter((p) => p.tipo === 'balin' || p.tipo === 'dije')
      .reduce((acc, p) => acc + (Number(p.pesoGramos) || 0.4), 0)
    return total.toFixed(2)
  }, [piezasColocadas])

  const diasManufactura = useMemo(() => {
    let diasMin = nudoSeleccionado?.diasManufactura || 2
    if (piezasColocadas.length > 8) diasMin += 1
    if (piezasColocadas.length > 14) diasMin += 1
    const diasMax = diasMin + 2
    return `${diasMin} a ${diasMax} días hábiles`
  }, [nudoSeleccionado, piezasColocadas])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Filtro del inventario
  const inventarioFiltrado = useMemo(() => {
    if (categoriaPaleta === 'todos') return INVENTARIO_PALETA
    return INVENTARIO_PALETA.filter((item) => item.tipo === categoriaPaleta)
  }, [categoriaPaleta])

  // Checkout WhatsApp
  const handleConfirmarCompraWhatsApp = async () => {
    setProcesandoCheckout(true)
    setToastMensaje('¡Gracias por su compra! Redirigiendo a nuestro taller...')

    const desglose = piezasColocadas.map((p) => `• ${p.nombre || p.tipo} (${p.tamano})`).join('\n')

    const ordenPayload = {
      codigo_autenticidad: codigoAutenticidad,
      nombre_creacion: nombreCreacion,
      hilo: `${hiloSeleccionado.nombre} (${hiloSeleccionado.calibre})`,
      tejido: nudoSeleccionado.nombre,
      piezas_totales: piezasColocadas.length,
      desglose_piezas: desglose,
      oro_total_gramos: pesoOroTotalGramos,
      total_cop: precioTotalFinal,
      estado: 'pendiente_aprobacion',
      created_at: new Date().toISOString()
    }

    try {
      await (supabase as any).from('pedidos_personalizados').insert(ordenPayload)
    } catch (err) {
      console.info('Orden lista para coordinación en taller:', err)
    }

    const numeroDestino = whatsappNumero || NUMERO_WHATSAPP_REAL
    const mensajeTexto = `Hola Jhaular, deseo confirmar la compra de mi diseño personalizado creado en el Atelier 3D.\n\n` +
      `• Orden: #${codigoAutenticidad}\n` +
      `• Creación: ${nombreCreacion}\n` +
      `• Tejido: ${nudoSeleccionado.nombre} (${hiloSeleccionado.nombre} - ${hiloSeleccionado.calibre})\n` +
      `• Oro 18K Estimado: ${pesoOroTotalGramos}g\n` +
      `• Elementos incrustados (${piezasColocadas.length}):\n${desglose}\n\n` +
      `• Valor Total: ${formatCurrency(precioTotalFinal)}\n` +
      `• Tiempo estimado: ${diasManufactura}\n\n` +
      `Quedo atento/a para coordinar el pago y envío.`

    const urlWhatsApp = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensajeTexto)}`

    setTimeout(() => {
      window.open(urlWhatsApp, '_blank')
      setProcesandoCheckout(false)
      setMostrarModalResumen(false)
      setToastMensaje(null)
    }, 1200)
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] dark:bg-[#0D0D10] text-[#1F1C18] dark:text-[#E8E2D8] font-sans selection:bg-[#D4AF37] selection:text-black flex flex-col transition-colors duration-300">
      
      {/* TOAST FLOTANTE SOLO PARA REDIRECCIÓN FINAL */}
      <AnimatePresence>
        {toastMensaje && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 inset-x-0 mx-auto z-50 max-w-md w-[90%] bg-zinc-950/95 text-[#D4AF37] border-2 border-[#D4AF37]/50 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3"
          >
            <Wand2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <p className="text-xs sm:text-sm font-mono font-bold truncate">{toastMensaje}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. NAVBAR SUPERIOR */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border-b border-[#EAE5DC] dark:border-[#25221E] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shrink-0 transition-colors">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <img src="/logo.png" alt="Jhaular" className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-serif text-xl font-bold tracking-wider text-[#1F1C18] dark:text-[#D4AF37] block leading-none">
                JHAULAR
              </span>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#8C8275] uppercase block mt-0.5">
                Atelier Virtual · Creación Libre 3D
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/catalogo"
            className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#736E65] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] hover:bg-[#F2ECE1] dark:hover:bg-[#18181E] transition-all cursor-pointer"
          >
            Catálogo
          </Link>
          <Link
            to="/certificados"
            className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#736E65] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] hover:bg-[#F2ECE1] dark:hover:bg-[#18181E] transition-all cursor-pointer"
          >
            Autenticidad
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* 2. LAYOUT DIVIDIDO (42% PALETA LATERAL + 58% LIENZO 3D) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
        
        {/* ========================================================================= */}
        {/* PANEL LATERAL: ATELIER BESPOKE DE ALTA JOYERÍA */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-5 xl:col-span-5 bg-[#0D0C10]/95 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-65px)] shadow-2xl transition-colors order-2 lg:order-1 select-none">
          
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* 1. Encabezado del Atelier */}
            <div className="border-b border-white/[0.06] pb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-serif tracking-tight text-white/95 font-medium">
                    Atelier Bespoke
                  </h1>
                  <p className="text-[11px] font-sans text-zinc-400">
                    Diseño a medida en Oro 18K y Esmeraldas Colombianas
                  </p>
                </div>
                <span className="text-[9.5px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-full border border-[#C5A059]/20 font-medium">
                  {codigoAutenticidad}
                </span>
              </div>

              <input
                type="text"
                value={nombreCreacion}
                onChange={(e) => setNombreCreacion(e.target.value)}
                maxLength={45}
                className="w-full px-3.5 py-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 focus:bg-zinc-900/90 text-zinc-100 text-xs font-sans placeholder-zinc-500 focus:outline-hidden focus:border-[#C5A059]/60 transition-all"
                placeholder="Nombra tu pieza bespoke..."
              />
            </div>

            {/* 2. Paleta de Elementos Bespoke (Filtros por Categoría) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-semibold text-zinc-300 tracking-wide uppercase text-[10px]">
                  Piezas Disponibles
                </span>
                <span className="text-[10px] font-sans text-zinc-500 flex items-center space-x-1">
                  <MousePointer className="w-3 h-3" />
                  <span>Arrastra o haz clic para incrustar</span>
                </span>
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'balin', label: 'Balines 18K' },
                  { id: 'esmeralda', label: 'Esmeraldas' },
                  { id: 'dije', label: 'Dijes 18K' },
                  { id: 'nudo', label: 'Nudos' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoriaPaleta(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-sans transition-all cursor-pointer shrink-0 ${
                      categoriaPaleta === tab.id
                        ? 'bg-[#C5A059] text-black font-semibold shadow-xs'
                        : 'bg-zinc-900/60 border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Cuadrícula Visual de Miniaturas (3 Columnas Minimalistas) */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {inventarioFiltrado.map((item, idx) => {
                  const isSelected = herramientaActiva?.nombre === item.nombre
                  return (
                    <div
                      key={`${item.tipo}-${item.tamano}-${idx}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(item))
                        setHerramientaActiva(item)
                      }}
                      onClick={() => {
                        setHerramientaActiva(item)
                        // Inserción directa fluida al hacer clic
                        let anguloLibre = Math.PI / 2
                        const offsets = [0, 0.26, -0.26, 0.52, -0.52, 0.78, -0.78, 1.04, -1.04, 1.30, -1.30, 1.56, -1.56]
                        for (const off of offsets) {
                          const cand = Math.PI / 2 + off
                          if (!hayColisionSolida(cand, item.tipo, item.tamano, piezasColocadas)) {
                            anguloLibre = cand
                            break
                          }
                        }
                        handleColocarPieza({
                          tipo: item.tipo,
                          tamano: item.tamano,
                          angulo: anguloLibre,
                          nombre: item.nombre,
                          diametroMm: item.diametroMm,
                          pesoGramos: item.pesoGramos,
                          precioInterno: item.precioInterno,
                          imagenUrl: item.imagenUrl,
                        })
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all duration-150 cursor-grab active:cursor-grabbing flex flex-col items-center justify-between relative group ${
                        isSelected
                          ? 'bg-[#C5A059]/10 border-[#C5A059] ring-1 ring-[#C5A059]/40 shadow-xs'
                          : 'bg-zinc-900/50 hover:bg-zinc-800/70 border-white/[0.06] hover:border-[#C5A059]/30'
                      }`}
                    >
                      {/* Miniatura renderizada de alta gama */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center my-1">
                        {item.tipo === 'balin' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B6508] via-[#E5C158] to-[#FFF6C8] shadow-md shadow-black/40 flex items-center justify-center text-[9px] font-mono font-bold text-black/80">
                            {item.tamano}
                          </div>
                        )}
                        {item.tipo === 'esmeralda' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#042817] via-[#0A5C36] to-[#34D399] shadow-md shadow-emerald-950/40 flex items-center justify-center text-[9px] font-mono font-bold text-emerald-100">
                            {item.tamano}
                          </div>
                        )}
                        {item.tipo === 'nudo' && (
                          <div className="w-9 h-4 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[8px] font-mono text-zinc-300">
                            |||||
                          </div>
                        )}
                        {item.tipo === 'dije' && (
                          item.imagenUrl ? (
                            <img src={item.imagenUrl} alt={item.nombre} className="w-9 h-9 rounded-lg object-cover shadow-sm" />
                          ) : (
                            <Gem className="w-6 h-6 text-[#C5A059]" />
                          )
                        )}
                      </div>

                      {/* Talla y Peso en Sans-Serif Limpia */}
                      <div className="w-full text-center mt-1">
                        <span className="text-[11px] font-sans font-medium text-zinc-200 block truncate">
                          {item.tipo === 'balin' ? `Balín ${item.tamano}` : item.tipo === 'esmeralda' ? `Esmeralda ${item.tamano}` : item.nombre}
                        </span>
                        <span className="text-[9.5px] font-sans text-zinc-400 block truncate mt-0.5">
                          {item.pesoGramos ? `${item.pesoGramos}g · 18K` : item.origen ? `Mina ${item.origen}` : 'Macramé'}
                        </span>
                      </div>

                      {/* Indicador sutil de arrastre al hover */}
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="w-4 h-4 rounded-full bg-white/[0.08] text-zinc-300 flex items-center justify-center text-[9px]">
                          +
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3. Color y Calibre del Hilo (Nylon Bondeado T70) */}
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-semibold text-zinc-300 tracking-wide uppercase text-[10px]">
                  Color del Hilo
                </span>
                <span className="text-[10px] font-sans text-[#C5A059] font-medium">
                  {hiloSeleccionado.nombre}
                </span>
              </div>

              {/* Muestrario de Tonos */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {CATALOGO_HILOS.map((h) => {
                  const isSelected = hiloSeleccionado.id === h.id
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setHiloSeleccionado(h)}
                      className={`group flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#C5A059]/10 border-[#C5A059] ring-1 ring-[#C5A059]/40'
                          : 'bg-zinc-900/50 border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                      title={`${h.nombre} - ${h.descripcion}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border shadow-sm transition-transform group-hover:scale-110 ${
                          isSelected ? 'scale-105 border-white ring-2 ring-[#C5A059]' : 'border-black/30'
                        }`}
                        style={{ backgroundColor: h.colorHex }}
                      />
                      <span className="text-[8.5px] font-sans text-center truncate w-full text-zinc-400">
                        {h.nombre.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Calibre & Nudo */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <span className="text-[9.5px] font-sans text-zinc-400 block">Calibre:</span>
                  <div className="grid grid-cols-2 gap-1">
                    {(['Terlenca', 'Coreano'] as const).map((cal) => (
                      <button
                        key={cal}
                        type="button"
                        onClick={() => setCalibreSeleccionado(cal)}
                        className={`py-1 rounded-lg text-[10px] font-sans font-medium transition-all cursor-pointer ${
                          calibreSeleccionado === cal
                            ? 'bg-[#C5A059] text-black font-semibold'
                            : 'bg-zinc-900/50 border border-white/[0.06] text-zinc-400'
                        }`}
                      >
                        {cal === 'Terlenca' ? '0.8mm T70' : '1.0mm'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] font-sans text-zinc-400 block">Tejido:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {CATALOGO_NUDOS.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setNudoSeleccionado(n)}
                        className={`py-1 px-1 rounded-lg text-[9.5px] font-sans font-medium border transition-colors cursor-pointer truncate ${
                          nudoSeleccionado.id === n.id
                            ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#C5A059]'
                            : 'bg-zinc-900/50 border-white/[0.06] text-zinc-400'
                        }`}
                      >
                        {n.nombre.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Elementos en tu Manilla (Gestión de Capas Minimalista) */}
            <div className="border-t border-white/[0.06] pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-sans font-semibold text-zinc-300 tracking-wide uppercase text-[10px]">
                    Composición ({piezasColocadas.length})
                  </span>
                  <span className="text-[10px] font-sans text-[#C5A059]">
                    {pesoOroTotalGramos}g Oro 18K
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoArmonizar(!autoArmonizar)}
                    className={`px-2 py-0.5 rounded-md text-[9.5px] font-sans border transition-colors cursor-pointer ${
                      autoArmonizar
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-900 border-white/[0.06] text-zinc-500'
                    }`}
                    title="Auto-armonizar al borrar"
                  >
                    {autoArmonizar ? 'Auto' : 'Libre'}
                  </button>

                  <button
                    type="button"
                    onClick={handleArmonizarPerimetro}
                    className="px-2 py-1 rounded-lg bg-zinc-900/60 border border-white/[0.08] hover:border-[#C5A059] text-[10px] font-sans text-zinc-300 hover:text-[#C5A059] flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Armonizar espaciado en la curva"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Armonizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLimpiarManilla}
                    className="px-2 py-1 rounded-lg bg-zinc-900/60 border border-red-500/20 hover:border-red-500 text-[10px] font-sans text-red-400 flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Vaciar diseño"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vaciar</span>
                  </button>
                </div>
              </div>

              {/* Acciones Rápidas de Simetría & Plantilla */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={handleSimetriaEspejo}
                  className="py-1.5 px-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] hover:border-[#C5A059]/40 text-zinc-300 hover:text-[#C5A059] text-[10px] font-sans flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                >
                  <Split className="w-3 h-3 text-[#C5A059]" />
                  <span>Simetría</span>
                </button>
                <button
                  type="button"
                  onClick={handleDistribuirEquidistante}
                  className="py-1.5 px-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] hover:border-[#C5A059]/40 text-zinc-300 hover:text-[#C5A059] text-[10px] font-sans flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                >
                  <CircleDot className="w-3 h-3 text-[#C5A059]" />
                  <span>Equidistante</span>
                </button>
                <button
                  type="button"
                  onClick={handleCargarPlantilla}
                  className="py-1.5 px-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] hover:border-[#C5A059]/40 text-zinc-300 hover:text-[#C5A059] text-[10px] font-sans flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                >
                  <Wand2 className="w-3 h-3 text-emerald-400" />
                  <span>Clásica</span>
                </button>
              </div>

              {/* Lista Compacta de Piezas */}
              {piezasColocadas.length === 0 ? (
                <div className="p-3.5 rounded-2xl border border-dashed border-white/[0.08] text-center text-xs font-sans text-zinc-500">
                  Manilla libre. Selecciona elementos de la paleta para diseñar.
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {piezasColocadas.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => setPiezaSeleccionadaId(p.id)}
                      className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-xs font-sans flex items-center justify-between gap-2 hover:border-[#C5A059]/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                          {p.tipo === 'balin' && <span className="w-2.5 h-2.5 rounded-full bg-[#E5C158]" />}
                          {p.tipo === 'esmeralda' && <Gem className="w-3 h-3 text-emerald-400" />}
                          {p.tipo === 'nudo' && <span className="text-[8px] text-zinc-400">|||</span>}
                          {p.tipo === 'dije' && <Gem className="w-3 h-3 text-[#C5A059]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-zinc-200 truncate">
                            #{i + 1} {p.nombre || p.tipo}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEliminarPieza(p.id)
                        }}
                        className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                        title="Eliminar elemento"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 5. TARJETA STICKY INFERIOR: RECIBO BESPOKE FLOTANTE DE ALTA GAMA */}
          <div className="sticky bottom-0 z-20 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/[0.08] p-4 sm:p-5 space-y-3 shadow-2xl">
            
            {/* Especificaciones de Garantía y Tiempos */}
            <div className="flex items-center justify-between text-[10.5px] font-sans text-zinc-400">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Oro 18K: <strong className="text-zinc-200">{pesoOroTotalGramos}g</strong></span>
              </span>
              <span>Manufactura: <strong className="text-zinc-200">{diasManufactura}</strong></span>
              <span className="text-emerald-400">Envío 2-3 días</span>
            </div>

            {/* Precio Total & Botón Primario de Manufactura */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                  Total Estimado
                </span>
                <span className="font-mono text-xl font-bold text-[#85E3B3] leading-none block">
                  {precioTotalFinal > 0 ? (
                    formatCurrency(precioTotalFinal)
                  ) : (
                    <span className="text-[#C5A059] text-base">Calculando...</span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModalResumen(true)}
                className="py-3 px-5 rounded-xl text-xs font-sans font-semibold bg-gradient-to-r from-[#C5A059] via-[#DFBA6B] to-[#B8860B] text-black hover:brightness-105 transition-all shadow-lg flex items-center space-x-2 cursor-pointer shrink-0 group"
              >
                <Wand2 className="w-3.5 h-3.5 text-black" />
                <span>Solicitar Manufactura</span>
                <ChevronRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

        </aside>

        {/* ========================================================================= */}
        {/* LIENZO 3D INTERACTIVO CON SELECCIÓN Y BOTÓN FLOTANTE DE ELIMINACIÓN */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 xl:col-span-7 bg-[#1E1E24] relative flex flex-col items-center justify-center min-h-[500px] overflow-hidden order-1 lg:order-2 select-none">
          
          {/* Badge de Estado del Lienzo 3D */}
          <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-mono text-zinc-300 shadow-xs flex items-center space-x-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>Lienzo 3D Interactivo · Haz clic en una pieza para seleccionarla y borrarla</span>
          </div>

          {/* Canvas de React Three Fiber */}
          <Canvas3D
            piezasColocadas={piezasColocadas}
            herramientaActiva={herramientaActiva}
            piezaSeleccionadaId={piezaSeleccionadaId}
            hiloColor={hiloSeleccionado.colorHex}
            hiloCalibre={hiloSeleccionado.calibre}
            nudoTipo={nudoSeleccionado.id}
            onColocarPieza={handleColocarPieza}
            onSeleccionarPieza={setPiezaSeleccionadaId}
            onMoverPieza={handleMoverPieza}
            onEliminarPieza={handleEliminarPieza}
          />

          {/* Guía de Navegación 3D */}
          <div className="absolute bottom-6 inset-x-0 mx-auto w-max z-10 pointer-events-none bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10.5px] font-mono text-zinc-300 shadow-xs flex items-center space-x-2">
            <Wand2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Haz clic en cualquier pieza para ver el botón ✕ de eliminación · Tecla Supr</span>
          </div>

          {/* Sello de Autenticidad */}
          <div className="absolute bottom-6 right-6 z-10 hidden sm:flex items-center space-x-2 text-[10px] font-mono text-zinc-400 pointer-events-none">
            <span className="text-[#D4AF37] font-bold">{codigoAutenticidad}</span>
          </div>

        </section>

      </div>

      {/* 3. MODAL DE RESUMEN Y CHECKOUT DE COMPRA */}
      <AnimatePresence>
        {mostrarModalResumen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#100F14] border border-white/[0.08] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative text-zinc-100"
            >
              <button
                type="button"
                onClick={() => setMostrarModalResumen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1.5">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#C5A059] font-medium block">
                  Orden de Manufactura Bespoke
                </span>
                <h3 className="font-serif text-2xl font-normal text-white">
                  {nombreCreacion}
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  Serial de Autenticidad: <strong className="text-[#C5A059]">#{codigoAutenticidad}</strong>
                </p>
              </div>

              {/* Desglose de Piezas */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-2.5 text-xs font-sans max-h-48 overflow-y-auto">
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Hilo & Tejido:</span>
                  <span className="text-zinc-200 font-medium">{nudoSeleccionado.nombre} ({hiloSeleccionado.nombre})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Piezas Incrustadas:</span>
                  <span className="text-zinc-200 font-medium">{piezasColocadas.length} elementos</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-zinc-400">Oro 18K Total:</span>
                  <span className="text-zinc-200 font-medium">{pesoOroTotalGramos} gramos</span>
                </div>
                <div className="pt-1 space-y-1">
                  <span className="text-[10.5px] text-zinc-500 block uppercase font-mono text-[9px]">Detalle de Elementos:</span>
                  {piezasColocadas.map((p, idx) => (
                    <div key={idx} className="text-[11px] text-zinc-300 flex justify-between">
                      <span>• {p.nombre || p.tipo}</span>
                      <span className="text-[#C5A059] font-mono">{p.tamano}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Final */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-[#C5A059]/30 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-wider">Precio Total Consolidado</span>
                  <span className="font-mono text-xl font-bold text-[#85E3B3]">
                    {formatCurrency(precioTotalFinal)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-wider">Tiempo de Atelier</span>
                  <span className="font-sans text-xs font-semibold text-zinc-200">{diasManufactura}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmarCompraWhatsApp}
                  disabled={procesandoCheckout}
                  className="w-full py-3.5 rounded-xl text-xs font-sans font-semibold bg-gradient-to-r from-[#C5A059] via-[#DFBA6B] to-[#B8860B] text-black hover:brightness-105 transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4 text-black" />
                  <span>{procesandoCheckout ? 'Conectando con Atelier...' : 'Sí, la compro'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarModalResumen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-sans text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
                >
                  Seguir Diseñando
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  )
}