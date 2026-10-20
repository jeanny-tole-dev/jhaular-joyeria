export const RADIO_PULSERA = 1.6
export const GROSOR_HILO = 0.016 // Hilo fino y delicado

export interface ElementoParaColision {
  id: string
  tipo: 'balin' | 'esmeralda' | 'nudo' | 'dije'
  tamano: string
  angulo: number
}

// Función geométrica para calcular distancia angular mínima en círculo 360°
export function distanciaAngular(a: number, b: number): number {
  const diff = Math.abs(a - b) % (Math.PI * 2)
  return diff > Math.PI ? Math.PI * 2 - diff : diff
}

// Cálculo dinámico de radio volumétrico según calibre físico real
export function calcularRadioVolumetrico(tipo: string, tamano: string): number {
  if (tipo === 'nudo') return 0.065
  if (tipo === 'dije') return 0.045
  switch (tamano) {
    case '#3': return 0.095 // ~3.0mm
    case '#4': return 0.130 // ~4.0mm
    case '#5': return 0.165 // ~5.0mm
    case '#6': return 0.200 // ~6.0mm
    case '#7': return 0.235 // ~7.0mm
    case '#8': return 0.270 // ~8.0mm
    default: return 0.130
  }
}

// Separación angular mínima requerida entre dos piezas según su volumen
export function distanciaAngularMinima(
  piezaA: { tipo: string; tamano: string },
  piezaB: { tipo: string; tamano: string }
): number {
  if (piezaA.tipo === 'dije' || piezaB.tipo === 'dije') {
    if (piezaA.tipo === 'dije' && piezaB.tipo === 'dije') {
      return 0.14
    }
    return 0.0
  }

  const radioA = calcularRadioVolumetrico(piezaA.tipo, piezaA.tamano)
  const radioB = calcularRadioVolumetrico(piezaB.tipo, piezaB.tamano)
  return (radioA + radioB) / RADIO_PULSERA + 0.015
}

// Verificador estricto de ocupación de ranuras (Colisiones Dinámicas)
export function hayColisionSolida(
  angulo: number,
  tipoNuevo: 'balin' | 'esmeralda' | 'nudo' | 'dije',
  tamanoNuevo: string,
  piezas: ElementoParaColision[],
  ignorarId?: string | null
): boolean {
  const nueva = { tipo: tipoNuevo, tamano: tamanoNuevo }
  return piezas.some((p) => {
    if (p.id === ignorarId) return false
    const sepMin = distanciaAngularMinima(nueva, p)
    if (sepMin === 0) return false
    return distanciaAngular(p.angulo, angulo) < sepMin
  })
}
