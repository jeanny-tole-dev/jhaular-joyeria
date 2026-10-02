import { convertGoogleDriveUrl } from './driveUrlConverter'

export interface ProcessedMedia {
  id: string
  url: string
  type: 'image' | 'video'
}

/**
 * Analiza y procesa una URL devolviendo si es una Imagen o un Video (YouTube, MP4, Drive Video, etc.)
 */
export function processMediaUrl(rawUrl: string): ProcessedMedia {
  const url = rawUrl.trim()
  if (!url) return { id: crypto.randomUUID(), url: '', type: 'image' }

  // 1. Detectar YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch && ytMatch[1]) {
    return {
      id: crypto.randomUUID(),
      url: `https://www.youtube.com/embed/${ytMatch[1]}`,
      type: 'video'
    }
  }

  // 2. Detectar Google Drive Video explícito
  if ((url.includes('drive.google.com') || url.includes('docs.google.com')) && url.includes('type=video')) {
    const driveMatch = url.match(/(?:file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]+)/)
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1]
      return {
        id: crypto.randomUUID(),
        url: `https://drive.google.com/file/d/${fileId}/preview`,
        type: 'video'
      }
    }
  }

  // 3. Detectar archivos de video MP4, WebM o MOV directos
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return {
      id: crypto.randomUUID(),
      url,
      type: 'video'
    }
  }

  // 4. Procesar como Imagen (convierte Google Drive automático si aplica)
  const convertedImageUrl = convertGoogleDriveUrl(url)
  return {
    id: crypto.randomUUID(),
    url: convertedImageUrl,
    type: 'image'
  }
}
