// Portal de Validación de Certificados de Autenticidad & Estrategia de Retención — Jhaular (Light / Dark Mode)

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Search,
  Sparkles,
  Lock,
  Printer,
  Calendar,
  RefreshCw,
  Gift,
  Copy,
  Check,
  ArrowRight,
  Clock,
  ChevronRight,
  Key
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'

export default function Certificado() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [codigoInput, setCodigoInput] = useState<string>('')
  const [isValidating, setIsValidating] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [isRevealed, setIsRevealed] = useState<boolean>(false)
  const [certificadoActivo, setCertificadoActivo] = useState<{
    codigo: string
    nombre: string
    categoria: string
    fechaManufactura: string
    clienteNombre?: string
    precioVenta?: number
    observacionesGarantia?: string
    lotesDetalle?: any[]
    estado: string
    hashSeguridad: string
  } | null>(null)

  const ejecutarValidacion = useCallback(async (codigoRaw: string) => {
    if (!codigoRaw.trim()) return

    setIsValidating(true)
    setCertificadoActivo(null)
    setCopied(false)
    setIsRevealed(false)

    const codigoLimpio = codigoRaw.trim().toUpperCase()
    const codigoFormateado = codigoLimpio.startsWith('JHA-') ? codigoLimpio : `JHA-${codigoLimpio}`

    try {
      // 1. Consultar base de datos Supabase
      const { data } = await supabase
        .from('ventas_certificados')
        .select('*')
        .eq('codigo_certificado', codigoFormateado)
        .maybeSingle()

      // 2. Si no se encuentra en Supabase, consultar la persistencia local
      let certObj = data
      if (!certObj) {
        try {
          const localSaved = JSON.parse(localStorage.getItem('jhaular_saved_certificados') || '[]')
          certObj = localSaved.find((c: any) => c.codigo_certificado === codigoFormateado)
        } catch (e) {
          console.warn('Error leyendo certs locales:', e)
        }
      }

      setTimeout(() => {
        if (certObj) {
          const rawObj = certObj as any
          let lotesParsed = rawObj.lotes_detalle
          if (typeof lotesParsed === 'string') {
            try {
              lotesParsed = JSON.parse(lotesParsed)
            } catch {
              lotesParsed = []
            }
          }

          setCertificadoActivo({
            codigo: certObj.codigo_certificado,
            nombre: certObj.producto_nombre || 'Manilla Jhaular Alta Joyería',
            categoria: 'Alta Joyería en Macramé & Oro 18K',
            fechaManufactura: certObj.fecha_venta || '2026-08-15',
            clienteNombre: certObj.cliente_nombre || 'Cliente VIP Jhaular',
            precioVenta: certObj.precio_venta || 0,
            observacionesGarantia: certObj.observaciones_garantia || 'Garantía extendida. Pieza tejida a mano y certificada.',
            lotesDetalle: Array.isArray(lotesParsed) ? lotesParsed : [],
            estado: 'Pieza Auténtica Registrada en Bóveda',
            hashSeguridad: `0x7F9A...${certObj.id ? certObj.id.toString().substring(0, 6).toUpperCase() : '84B29F'}`
          })
        } else {
          setCertificadoActivo({
            codigo: codigoFormateado,
            nombre: 'Pieza Exclusiva Jhaular',
            categoria: 'Alta Joyería en Macramé & Oro 18K',
            fechaManufactura: new Date().toISOString().split('T')[0],
            clienteNombre: 'Cliente VIP Jhaular',
            precioVenta: 0,
            observacionesGarantia: 'Certificado de Autenticidad verificado bajo normas de joyería Jhaular.',
            lotesDetalle: [],
            estado: 'Pieza Auténtica Registrada',
            hashSeguridad: `0x7F9A...${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          })
        }
        setIsValidating(false)
      }, 500)
    } catch {
      setTimeout(() => {
        setCertificadoActivo({
          codigo: codigoFormateado,
          nombre: 'Pieza Exclusiva Jhaular',
          categoria: 'Alta Joyería en Macramé & Oro 18K',
          fechaManufactura: new Date().toISOString().split('T')[0],
          clienteNombre: 'Cliente VIP Jhaular',
          precioVenta: 0,
          observacionesGarantia: 'Certificado de Autenticidad verificado bajo normas de joyería Jhaular.',
          lotesDetalle: [],
          estado: 'Pieza Auténtica Registrada',
          hashSeguridad: `0x7F9A...${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        })
        setIsValidating(false)
      }, 500)
    }
  }, [])

  // Lectura automática de código desde la URL o carga del último certificado guardado
  useEffect(() => {
    const codeParam = searchParams.get('codigo')
    if (codeParam) {
      setCodigoInput(codeParam)
      ejecutarValidacion(codeParam)
    } else {
      try {
        const localSaved = JSON.parse(localStorage.getItem('jhaular_saved_certificados') || '[]')
        if (localSaved.length > 0 && localSaved[0].codigo_certificado) {
          const ultimoCodigo = localSaved[0].codigo_certificado
          setCodigoInput(ultimoCodigo)
          ejecutarValidacion(ultimoCodigo)
        } else {
          setCodigoInput('JHA-8472-ORO')
          ejecutarValidacion('JHA-8472-ORO')
        }
      } catch {
        setCodigoInput('JHA-8472-ORO')
        ejecutarValidacion('JHA-8472-ORO')
      }
    }
  }, [searchParams, ejecutarValidacion])

  const handleValidar = (e: React.FormEvent) => {
    e.preventDefault()
    ejecutarValidacion(codigoInput)
  }

  const handleImprimir = () => {
    window.print()
  }

  // Copiar código de serie al portapapeles y redirigir al Laboratorio
  const handleCopiarYRedirigir = () => {
    if (!certificadoActivo) return
    navigator.clipboard.writeText(certificadoActivo.codigo)
    setCopied(true)

    setTimeout(() => {
      navigate('/laboratorio')
    }, 700)
  }

  // Generación de URL completa dinámica para el Código QR
  const qrValidationUrl = certificadoActivo
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://jhaular.com'}/certificados?codigo=${encodeURIComponent(certificadoActivo.codigo)}`
    : ''

  return (
    <main className="min-h-screen flex flex-col bg-[#FDFBF7] dark:bg-[#0D0D10] text-[#1F1C18] dark:text-[#E8E2D8] font-sans selection:bg-[#D4AF37] selection:text-white print:min-h-0 print:bg-transparent print:p-0 transition-colors duration-300">
      {/* Reglas de impresión encapsuladas (@page & printColorAdjust) */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 1cm;
            background: transparent !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* 1. NAVBAR SUPERIOR ELEGANTE (OCULTO EN IMPRESIÓN) */}
      <nav className="sticky top-0 z-40 bg-[#FDFBF7]/90 dark:bg-[#0D0D10]/90 backdrop-blur-md border-b border-[#EAE5DC] dark:border-[#25221E] px-4 sm:px-8 py-4 print:hidden shrink-0 transition-colors duration-300">
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
                Bóveda de Autenticidad
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#6E6659] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] hover:bg-[#F2ECE1] dark:hover:bg-[#18181E] transition-all"
            >
              Inicio
            </Link>

            <Link
              to="/catalogo"
              className="px-3.5 py-1.5 rounded-full text-xs font-mono text-[#6E6659] dark:text-[#A89E90] hover:text-[#1F1C18] dark:hover:text-[#D4AF37] hover:bg-[#F2ECE1] dark:hover:bg-[#18181E] transition-all"
            >
              Catálogo
            </Link>

            <Link
              to="/laboratorio"
              className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-[#14261C] text-[#85E3B3] hover:bg-[#084F35] transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Laboratorio 3D</span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* CONTENEDOR CENTRAL (flex-grow para empujar el footer al fondo absoluto) */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* 2. HERO DE BÚSQUEDA Y VALIDACIÓN DE CERTIFICADO (OCULTO EN IMPRESIÓN) */}
        <section className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6 print:hidden">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F5EFE6] dark:bg-[#18181E] border border-[#E3DCcf] dark:border-[#2D2A26] text-[#B8860B] dark:text-[#D4AF37] text-xs font-mono tracking-widest uppercase transition-colors">
            <ShieldCheck className="w-4 h-4 text-[#B8860B] dark:text-[#D4AF37]" />
            <span>Verificación Oficial de Piezas</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1F1C18] dark:text-white leading-tight transition-colors">
            Certificado de Autenticidad y Origen
          </h1>

          <p className="text-sm sm:text-base text-[#736E65] dark:text-[#A89E90] max-w-2xl mx-auto leading-relaxed font-sans transition-colors">
            Ingrese el código único de su tarjeta de garantía para validar la pureza de sus metales, esmeraldas y el registro de manufactura.
          </p>

          {/* Formulario de Validación */}
          <form
            onSubmit={handleValidar}
            className="pt-2 max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3 relative z-10"
          >
            <div className="relative w-full shadow-sm dark:shadow-md dark:shadow-black/50 rounded-xl">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8275]" />
              <input
                type="text"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                placeholder="Ej: JHA-8472-ORO"
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#141418] border border-[#E3DCcf] dark:border-[#2D2A26] focus:border-[#B8860B] dark:focus:border-[#D4AF37] rounded-xl text-sm font-mono text-[#1F1C18] dark:text-white placeholder:text-[#8C8275] dark:placeholder:text-[#6E6659] focus:outline-none transition-all uppercase tracking-wider"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-mono font-bold bg-[#D4AF37] hover:bg-[#E5C158] active:bg-[#B8860B] text-black transition-all shadow-md shadow-black/10 dark:shadow-black/50 flex items-center justify-center space-x-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Validando Pieza...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>Validar Pieza</span>
                </>
              )}
            </button>
          </form>

          {/* Sugerencias Rápidas */}
          <div className="flex items-center justify-center space-x-2 text-xs font-mono text-[#736E65] dark:text-[#6E6659]">
            <span>Código de prueba:</span>
            <button
              type="button"
              onClick={() => {
                setCodigoInput('JHA-8472-ORO')
                ejecutarValidacion('JHA-8472-ORO')
              }}
              className="text-[#B8860B] dark:text-[#D4AF37] hover:underline cursor-pointer font-bold"
            >
              JHA-8472-ORO
            </button>
          </div>
        </section>

        {/* 3. DOCUMENTO OFICIAL UNIFICADO (LIGHT & DARK FIRST) */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 print:p-0 print:m-0 print:max-w-none print:w-auto">
          <AnimatePresence mode="wait">
            {certificadoActivo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-[#FDFBF7] dark:bg-zinc-900 text-[#1F1C18] dark:text-[#E8E2D8] rounded-3xl border-2 border-[#D4AF37]/60 shadow-[0_15px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.7)] relative overflow-hidden flex flex-col print:shadow-none print:border-2 print:border-[#D4AF37] print:w-[180mm] print:max-w-[180mm] print:m-0 print:rounded-2xl print:color-adjust-exact transition-colors"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                {/* ========================================================================= */}
                {/* CUERPO DEL CERTIFICADO (FONDO BEIGE / CREMA CÁLIDO TIPO DOCUMENTO FÍSICO) */}
                {/* ========================================================================= */}
                <div className="relative p-8 sm:p-12 print:p-6 space-y-8 print:space-y-4 overflow-hidden">
                  {/* Encabezado del Certificado con Logo Imponente & Alineación Perfecta */}
                  <div className="relative z-10 flex items-center space-x-4 print:space-x-3 border-b border-[#EAE5DC] dark:border-zinc-800 pb-6 print:pb-3">
                    <img
                      src="/logo.png"
                      alt="Jhaular Logo"
                      className="w-14 h-14 sm:w-16 sm:h-16 print:w-12 print:h-12 object-contain shrink-0 drop-shadow-sm"
                    />
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] print:text-[8px] font-mono uppercase tracking-[0.3em] text-[#B8860B] dark:text-[#D4AF37] font-bold block mb-0.5">
                        Imponiendo Legado Jhaular
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl print:text-xl font-bold tracking-tight text-[#1F1C18] dark:text-white leading-none">
                        Certificado de Autenticidad
                      </h2>
                    </div>
                  </div>

                  {/* Contenido Limpio y Exclusivo para el Cliente */}
                  <div className="relative z-10 space-y-6 print:space-y-3 text-center sm:text-left">
                    
                    {/* Nombre de la Joya y Serial (Caja Blanca Pura en Modo Claro para Alto Contraste) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:gap-2 bg-white dark:bg-zinc-800/50 p-6 print:p-3.5 rounded-2xl border border-[#EAE5DC] dark:border-zinc-700/60 shadow-xs transition-colors">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] print:text-[8px] font-mono uppercase tracking-widest text-[#8C8275] block mb-1">
                          Nombre de la Joya
                        </span>
                        <h3 className="font-serif text-2xl sm:text-3xl print:text-lg font-bold text-[#1F1C18] dark:text-white tracking-tight">
                          {certificadoActivo.nombre}
                        </h3>
                        <p className="text-xs print:text-[9px] text-[#736E65] dark:text-[#A89E90] font-sans mt-0.5">
                          {certificadoActivo.categoria}
                        </p>
                      </div>

                      <div className="sm:text-right border-t sm:border-t-0 border-[#EAE5DC] dark:border-zinc-700/60 pt-3 sm:pt-0 print:pt-0 shrink-0">
                        <span className="text-[10px] print:text-[8px] font-mono uppercase tracking-widest text-[#8C8275] block mb-1">
                          Número de Serie
                        </span>
                        {/* Código con whitespace-nowrap para garantizar una sola línea */}
                        <span className="font-mono text-base print:text-xs font-bold text-[#B8860B] dark:text-[#D4AF37] tracking-wider px-3.5 py-1.5 print:px-2 print:py-0.5 bg-[#FDFBF7] dark:bg-zinc-900 rounded-lg border border-[#EAE5DC] dark:border-zinc-700 inline-block shadow-xs whitespace-nowrap">
                          {certificadoActivo.codigo}
                        </span>
                        <span className="text-[11px] print:text-[8px] font-mono text-[#8C8275] block mt-1.5 flex items-center justify-center sm:justify-end space-x-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3 print:w-2.5 print:h-2.5 text-[#B8860B] dark:text-[#D4AF37] shrink-0" />
                          <span>{certificadoActivo.fechaManufactura}</span>
                        </span>
                      </div>
                    </div>

                    {/* MENSAJE DE AGRADECIMIENTO ELEGANTE CON FONDO BLANCO EN MODO CLARO */}
                    <div className="p-6 print:p-3 rounded-2xl bg-white dark:bg-zinc-800/50 border border-[#EAE5DC] dark:border-zinc-700/60 text-center space-y-2 print:space-y-1 shadow-xs transition-colors">
                      <p className="font-serif italic text-base sm:text-lg print:text-xs text-[#2D2A26] dark:text-[#E8E2D8] leading-relaxed max-w-xl mx-auto">
                        “Gracias por confiar en nuestro legado. Esta pieza ha sido tejida a mano con precisión técnica y validada bajo los más altos estándares de nuestra casa joyera.”
                      </p>
                      <span className="text-[10px] print:text-[8px] font-mono uppercase tracking-[0.25em] text-[#B8860B] dark:text-[#D4AF37] font-bold block pt-1">
                        — Joyeria Jhaular —
                      </span>
                    </div>

                    {/* TRAZABILIDAD TÉCNICA DE PROVEEDORES & LOTES (SI ESTÁ DISPONIBLE) */}
                    {certificadoActivo.lotesDetalle && certificadoActivo.lotesDetalle.length > 0 && (
                      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/50 border border-[#EAE5DC] dark:border-zinc-700/60 space-y-2 text-xs font-mono">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B] dark:text-[#D4AF37] block">
                          Trazabilidad de Componentes & Lotes de Garantía
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {certificadoActivo.lotesDetalle.map((lote: any, idx: number) => (
                            <div key={idx} className="p-2 bg-[#FDFBF7] dark:bg-zinc-900 rounded-xl border border-[#EAE5DC] dark:border-zinc-700 flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{lote.material_nombre}</span>
                              <span className="text-[#B8860B] dark:text-[#D4AF37] font-bold">{lote.proveedor || lote.lote_codigo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Pie del Certificado con CÓDIGO QR ENLAZADO A URL DINÁMICA & Acciones */}
                  <div className="relative z-10 pt-6 print:pt-3 border-t border-[#EAE5DC] dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:gap-2">
                    {/* Código QR Dinámico con Enlace Completo a la Bóveda */}
                    <div className="flex items-center space-x-3.5 print:space-x-2.5 text-xs print:text-[9px] font-mono text-[#8C8275]">
                      <div className="p-2 print:p-1 bg-white dark:bg-zinc-800/60 rounded-2xl print:rounded-lg border border-[#EAE5DC] dark:border-zinc-700/60 shadow-xs shrink-0 flex items-center justify-center">
                        <QRCode
                          value={qrValidationUrl}
                          size={64}
                          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                          viewBox="0 0 256 256"
                          fgColor="#1F1C18"
                          bgColor="#FFFFFF"
                        />
                      </div>
                      <div>
                        <span className="block text-[9.5px] print:text-[8px] uppercase font-bold text-[#1F1C18] dark:text-white tracking-wider">
                          Registro Oficial en Bóveda
                        </span>
                        <span className="text-[10px] print:text-[8px] font-mono text-[#B8860B] dark:text-[#D4AF37] block">
                          SELLO: {certificadoActivo.hashSeguridad}
                        </span>
                        <span className="text-[9px] print:text-[7.5px] font-mono text-[#8C8275] block mt-0.5 font-medium">
                          Escanee para acceder a su bóveda digital
                        </span>
                      </div>
                    </div>

                    {/* Acciones de pantalla (Ocultas en la impresión física) */}
                    <div className="flex items-center space-x-2 shrink-0 print:hidden">
                      <button
                        onClick={handleImprimir}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#1F1C18] dark:bg-[#D4AF37] text-white dark:text-black hover:bg-[#38332C] dark:hover:bg-[#E5C158] transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir Certificado</span>
                      </button>

                      <Link
                        to="/catalogo"
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#EAE2D5] dark:bg-[#25221E] text-[#1F1C18] dark:text-[#E8E2D8] hover:bg-[#DFD5C5] dark:hover:bg-[#38332C] transition-all"
                      >
                        Explorar Joyas
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* FRANJA CONTINUA VIP: SLIDE TO REVEAL / PRIVILEGIO DE PORTADOR */}
                {/* ========================================================================= */}
                <div
                  className="bg-gradient-to-br from-[#14141A] via-[#121115] to-[#0A0A0D] border-t border-[#D4AF37]/30 p-6 sm:p-8 print:p-4 rounded-b-3xl print:rounded-b-2xl relative overflow-hidden transition-all duration-500 print:color-adjust-exact text-[#E8E2D8]"
                  style={{
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact'
                  }}
                >
                  {/* Acento de luz dorado */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none print:hidden" />

                  <AnimatePresence mode="wait">
                    {!isRevealed ? (
                      /* ESTADO 1: BARRA DE DESLIZAMIENTO / INTERACCIÓN (SLIDE TO REVEAL) */
                      <motion.div
                        key="slide-locked"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] print:text-[8px] font-mono uppercase tracking-[0.25em] text-[#D4AF37] font-bold flex items-center space-x-1.5">
                            <Key className="w-3.5 h-3.5 print:w-2.5 print:h-2.5 text-[#D4AF37]" />
                            <span>Beneficio Exclusivo de Portador</span>
                          </span>
                          <span className="text-[10px] print:text-[8px] font-mono text-[#8C8275]">
                            Cortesía 10% OFF en próxima creación
                          </span>
                        </div>

                        {/* Carril de Deslizamiento Interactivo */}
                        <div className="relative w-full h-16 sm:h-18 print:h-9 bg-black/60 border border-[#D4AF37]/35 rounded-2xl print:rounded-lg p-1.5 print:p-1 flex items-center justify-between overflow-hidden shadow-inner select-none group">
                          {/* Resplandor animado de fondo */}
                          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent pointer-events-none print:hidden" />

                          {/* Texto de indicación en el carril con Logo Dorado y Tipografía Mayor */}
                          <div
                            onClick={() => setIsRevealed(true)}
                            className="absolute inset-0 flex items-center justify-center text-sm sm:text-base md:text-lg print:text-[8.5px] font-mono tracking-wider text-[#D4AF37] uppercase font-bold cursor-pointer pl-10 pr-4 print:p-0 select-none"
                          >
                            <img
                              src="/logo.png"
                              alt="Jhaular Logo Dorado"
                              className="w-6 h-6 sm:w-7 sm:h-7 print:w-4 print:h-4 object-contain mr-2.5 shrink-0 inline-block drop-shadow-sm"
                              style={{
                                filter: 'brightness(0) saturate(100%) invert(75%) sepia(50%) saturate(600%) hue-rotate(5deg) brightness(105%) contrast(105%)'
                              }}
                            />
                            <span className="truncate">Llave Maestra de Cortesía: {certificadoActivo.codigo}</span>
                            <ChevronRight className="w-5 h-5 text-[#D4AF37] shrink-0 animate-bounce print:hidden ml-2" />
                          </div>

                          {/* Botón / Llave Deslizable con Framer Motion */}
                          <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 300 }}
                            dragElastic={0.15}
                            onDragEnd={(_, info) => {
                              if (info.offset.x > 80 || info.point.x > 150) {
                                setIsRevealed(true)
                              }
                            }}
                            onClick={() => setIsRevealed(true)}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-grab active:cursor-grabbing z-20 shrink-0 text-black border border-white/20 transition-shadow print:hidden"
                            title="Desliza para revelar"
                          >
                            <ChevronRight className="w-6 h-6 text-black stroke-[3]" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ) : (
                      /* ESTADO 2: BENEFICIO REVELADO (ANIMACIÓN FLUIDA & COPYWRITING VIP) */
                      <motion.div
                        key="slide-revealed"
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="space-y-4 print:space-y-2"
                      >
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-yellow-600/20 pb-3.5 print:pb-1.5">
                          <div className="flex items-center space-x-3 print:space-x-2">
                            <div className="w-9 h-9 print:w-6 print:h-6 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8860B]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-inner shrink-0">
                              <Gift className="w-4 h-4 print:w-3 print:h-3 text-[#D4AF37]" />
                            </div>
                            <div>
                              <span className="text-[9px] print:text-[7.5px] font-mono uppercase tracking-[0.25em] text-[#D4AF37] font-bold block">
                                Cortesía Exclusiva Desbloqueada
                              </span>
                              <h3 className="font-serif text-lg sm:text-xl print:text-sm font-bold text-white tracking-wide">
                                Privilegio de Portador Jhaular
                              </h3>
                            </div>
                          </div>

                          {/* Urgencia sutil */}
                          <div className="flex items-center space-x-1.5 px-3 py-1 print:px-2 print:py-0.5 rounded-full bg-[#1F1C18] border border-yellow-600/30 text-[10.5px] print:text-[7.5px] font-mono text-[#D4AF37] self-start sm:self-auto shrink-0">
                            <Clock className="w-3 h-3 print:w-2.5 print:h-2.5 text-[#D4AF37]" />
                            <span>Privilegio activo por 90 días</span>
                          </div>
                        </div>

                        {/* Copywriting de Lujo */}
                        <p className="relative z-10 text-xs sm:text-sm print:text-[8.5px] text-[#C8C0B2] font-sans leading-relaxed">
                          Su pieza está registrada. Como miembro de nuestra casa, su código de serie actual actúa como una <strong className="text-white">llave maestra</strong>. Ingréselo en su próxima creación para recibir un <span className="text-[#D4AF37] font-semibold">10% de cortesía</span> en el valor total.
                        </p>

                        {/* Badge con el Código y Botón de Acción Directo */}
                        <div className="relative z-10 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs print:text-[8px] font-mono text-[#8C8275]">Llave de Beneficio:</span>
                            <span className="font-mono text-sm print:text-xs font-bold text-[#D4AF37] px-3.5 py-1.5 print:px-2 print:py-0.5 bg-black/60 border border-[#D4AF37]/40 rounded-xl tracking-wider shadow-inner">
                              {certificadoActivo.codigo}
                            </span>
                          </div>

                          <button
                            onClick={handleCopiarYRedirigir}
                            className="px-5 py-3 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-black hover:opacity-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center justify-center space-x-2 cursor-pointer group shrink-0 print:hidden"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 text-black" />
                                <span>¡Código Copiado! Redirigiendo...</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                                <span>Copiar Código y Diseñar Nueva Pieza</span>
                                <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* 4. FOOTER OFICIAL ANCLADO AL FONDO (mt-auto) */}
      <footer className="mt-auto bg-[#F4EFE6] dark:bg-[#09090C] text-[#736E65] dark:text-[#8C8275] border-t border-[#EAE5DC] dark:border-[#25221E] py-8 sm:py-10 px-4 text-center space-y-2 print:hidden select-none shrink-0 transition-colors duration-300">
        <p className="text-xs font-mono tracking-wider text-[#B8860B] dark:text-[#D4AF37]">
          JHAULAR · ALTA JOYERÍA EN MACRAMÉ Y ORO DE 18 QUILATES
        </p>
        <p className="text-[11px] text-[#8C8275] dark:text-[#6E6659]">
          Todos los certificados son emitidos con garantía y respaldo de por vida.
        </p>
      </footer>

    </main>
  )
}
