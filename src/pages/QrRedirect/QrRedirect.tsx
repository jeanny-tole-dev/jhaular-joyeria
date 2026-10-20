import { useEffect, useState } from 'react'
import { Gem, ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const DEFAULT_PHONE = '573215964456'
const DEFAULT_MESSAGE = '¡Hola Jhaular Atelier! Me gustaría solicitar información sobre sus piezas personalizadas en Oro 18K.'
const DEFAULT_WEB_URL = 'https://jhaular.com/catalogo'
const LOCAL_STORAGE_CONFIG_KEY = 'jhaular_qr_config_v1'
const LOCAL_STORAGE_SCANS_KEY = 'jhaular_qr_scans_v1'

interface QrConfigGuardada {
  tipo_destino?: string | null
  telefono?: string | null
  mensaje?: string | null
  url_destino?: string | null
  id?: string
  total_escaneos?: number | null
}

function soloDigitos(valor: string): string {
  return valor.replace(/[^0-9]/g, '')
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms)
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      }
    )
  })
}

function urlHttpSegura(raw: string | null | undefined): string | null {
  const trimmed = (raw || '').trim()
  if (!trimmed) return null

  let candidate = trimmed
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(candidate)) {
      candidate = `https://${candidate}`
    } else {
      return null
    }
  }

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

export default function QrRedirect() {
  const [redirecting, setRedirecting] = useState<boolean>(true)
  const [targetUrl, setTargetUrl] = useState<string>('')
  const [destinationType, setDestinationType] = useState<string>('whatsapp')

  useEffect(() => {
    let isMounted = true

    const processRedirect = async () => {
      let config: QrConfigGuardada | null = null
      const nowIso = new Date().toISOString()

      try {
        const respuesta = await withTimeout(
          supabase.from('qr_config').select('*').limit(1).maybeSingle(),
          4000
        )
        const data = respuesta?.data
        const error = respuesta?.error

        if (!error && data) {
          config = data

          const currentTotal = Number(data.total_escaneos || 0) + 1
          supabase
            .from('qr_config')
            .update({
              total_escaneos: currentTotal,
              updated_at: nowIso
            })
            .eq('id', data.id)
            .then(() => {})

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

      if (!config) {
        try {
          const storedRaw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)
          if (storedRaw) {
            config = JSON.parse(storedRaw) as QrConfigGuardada
          }
        } catch {
          config = null
        }
      }

      const targetType = config?.tipo_destino === 'web' ? 'web' : 'whatsapp'
      const phone = soloDigitos(config?.telefono || '') || DEFAULT_PHONE
      const message = (config?.mensaje || '').trim() || DEFAULT_MESSAGE

      try {
        const localScans = Number(localStorage.getItem(LOCAL_STORAGE_SCANS_KEY) || '0') + 1
        localStorage.setItem(LOCAL_STORAGE_SCANS_KEY, localScans.toString())
      } catch {
        // Ignorar
      }

      const finalTargetUrl =
        targetType === 'web'
          ? urlHttpSegura(config?.url_destino) || DEFAULT_WEB_URL
          : `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

      if (isMounted) {
        setTargetUrl(finalTargetUrl)
        setDestinationType(targetType)
        setRedirecting(false)
        window.location.replace(finalTargetUrl)
      }
    }

    processRedirect()

    return () => {
      isMounted = false
    }
  }, [])

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
