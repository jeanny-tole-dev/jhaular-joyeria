import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Gem, ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DEFAULT_PHONE = '573215964456'
const DEFAULT_MESSAGE = '¡Hola Jhaular Atelier! Me gustaría solicitar información sobre sus piezas personalizadas en Oro 18K.'
const DEFAULT_WEB_URL = 'https://jhaular.com/catalogo'
const LOCAL_STORAGE_CONFIG_KEY = 'jhaular_qr_config_v1'
const LOCAL_STORAGE_SCANS_KEY = 'jhaular_qr_scans_v1'

export default function QrRedirect() {
  const [searchParams] = useSearchParams()
  const [redirecting, setRedirecting] = useState<boolean>(true)
  const [targetUrl, setTargetUrl] = useState<string>('')
  const [destinationType, setDestinationType] = useState<string>('whatsapp')

  useEffect(() => {
    let isMounted = true

    const processRedirect = async () => {
      let phone = searchParams.get('phone') || searchParams.get('p') || ''
      let message = searchParams.get('message') || searchParams.get('m') || ''
      let customUrl = searchParams.get('url') || searchParams.get('u') || ''
      let targetType = 'whatsapp'

      const nowIso = new Date().toISOString()

      try {
        // 1. Obtener la configuración maestra activa de Supabase
        const { data, error } = await supabase
          .from('qr_config')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          if (data.tipo_destino) targetType = data.tipo_destino
          if (!phone && data.telefono) phone = data.telefono
          if (!message && data.mensaje) message = data.mensaje
          if (!customUrl && data.url_destino) customUrl = data.url_destino

          const currentTotal = Number(data.total_escaneos || 0) + 1

          // 2. Incrementar +1 a los Escaneos Históricos y registrar última hora de escaneo
          supabase
            .from('qr_config')
            .update({
              total_escaneos: currentTotal,
              updated_at: nowIso
            })
            .eq('id', data.id)
            .then(() => {})

          // 3. Registrar evento individual de escaneo para analíticas de hoy y dispositivo
          supabase
            .from('qr_scans')
            .insert([
              {
                qr_config_id: data.id,
                user_agent: navigator.userAgent || 'Desconocido',
                created_at: nowIso
              }
            ])
            .then(() => {})
        }
      } catch (err) {
        console.warn('Procesando redirección mediante fallback de configuración:', err)
      }

      // Fallback a localStorage si no hay respuesta de Supabase
      if (!phone || !message || !customUrl) {
        try {
          const storedRaw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)
          if (storedRaw) {
            const parsed = JSON.parse(storedRaw)
            if (parsed.tipo_destino) targetType = parsed.tipo_destino
            if (!phone && parsed.telefono) phone = parsed.telefono
            if (!message && parsed.mensaje) message = parsed.mensaje
            if (!customUrl && parsed.url_destino) customUrl = parsed.url_destino
          }
        } catch {
          // Ignorar error de parsing
        }
      }

      // Valores por defecto finales de respaldo
      if (!phone) phone = DEFAULT_PHONE
      if (!message) message = DEFAULT_MESSAGE
      if (!customUrl) customUrl = DEFAULT_WEB_URL

      // Respaldo de contador local
      try {
        const localScans = Number(localStorage.getItem(LOCAL_STORAGE_SCANS_KEY) || '0') + 1
        localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, localScans.toString())
      } catch {
        // Ignorar
      }

      // Construcción del enlace de destino final según el tipo seleccionado
      let finalTargetUrl = ''

      if (targetType === 'web' || customUrl.startsWith('http://') || customUrl.startsWith('https://')) {
        let cleanUrl = customUrl.trim()
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = `https://${cleanUrl}`
        }
        finalTargetUrl = cleanUrl
        targetType = 'web'
      } else {
        const cleanPhone = phone.replace(/[^0-9]/g, '')
        const finalPhone = cleanPhone.length > 0 ? cleanPhone : DEFAULT_PHONE
        finalTargetUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
        targetType = 'whatsapp'
      }

      if (isMounted) {
        setTargetUrl(finalTargetUrl)
        setDestinationType(targetType)
        setRedirecting(false)

        // Redirección instantánea al enlace activo
        window.location.replace(finalTargetUrl)
      }
    }

    processRedirect()

    return () => {
      isMounted = false
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#0D0C10] text-[#E8DCC4] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Fondo de lujo con resplandor dorado */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="relative z-10 max-w-sm w-full bg-[#14121A]/80 backdrop-blur-2xl border border-amber-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-black/80">
        {/* Isotipo Jhaular con animación */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/10 relative">
          <Gem className="w-8 h-8 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping"></span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-wider text-amber-200 uppercase">
            JHAULAR
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">
            Luxury Bespoke Atelier
          </p>
        </div>

        <div className="pt-2 pb-4 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {redirecting
                ? 'Conectando con el Atelier...'
                : destinationType === 'web'
                ? 'Redirigiendo a la página web...'
                : 'Redirigiendo a WhatsApp...'}
            </span>
          </div>

          <div className="w-full bg-surface-container-highest/30 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 w-full animate-pulse"></div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            {destinationType === 'web'
              ? 'Conectándote directamente con nuestra tienda y catálogo digital.'
              : 'Conectándote con nuestro equipo de atención personalizada en WhatsApp.'}
          </p>
        </div>

        {targetUrl && (
          <a
            href={targetUrl}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all duration-300 shadow-lg shadow-amber-400/20 group"
          >
            <span>{destinationType === 'web' ? 'Abrir Página Web Ahora' : 'Abrir WhatsApp Ahora'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        )}
      </div>

      <div className="mt-8 flex items-center space-x-1.5 text-[10px] font-mono text-slate-500">
        <ExternalLink className="w-3 h-3" />
        <span>Enlace Maestro Seguro • Jhaular Atelier</span>
      </div>
    </div>
  )
}
