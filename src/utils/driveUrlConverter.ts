/**
 * Utilidad para transformar enlaces compartidos de Google Drive en URLs de imagen directa embebible.
 * Usa el CDN de miniatura de alta resolución de Google Drive (drive.google.com/thumbnail) que no sufre de bloqueos CORS.
 */
export function convertGoogleDriveUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()

  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com') || trimmed.includes('googleusercontent.com')) {
    const match = trimmed.match(/(?:file\/d\/|id=|open\?id=|\/d\/)([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      const fileId = match[1]
      // Servidor CDN lh3.googleusercontent.com para renderizado directo de imágenes de Drive sin CORS
      return `https://lh3.googleusercontent.com/d/${fileId}`
    }
  }

  return trimmed
}
