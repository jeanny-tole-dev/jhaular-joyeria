// Configuración centralizada y escalable de Categorías, Estados y QA para Producción JHAULAR

export interface CategoriaProduccion {
  id: string
  nombre: string
  descripcion: string
}

export const CATEGORIAS_PRODUCCION: CategoriaProduccion[] = [
  {
    id: 'oro-18k-diamantado',
    nombre: 'Oro 18K Diamantado',
    descripcion: 'Piezas exclusivas con balines e incrustaciones en oro de 18 kilates diamantado.'
  },
  {
    id: 'esmeralda-oro',
    nombre: 'Esmeralda & Oro',
    descripcion: 'Gemas sagradas esmeraldas colombianas combinadas con detalles finos en oro.'
  },
  {
    id: 'religiosas',
    nombre: 'Religiosas',
    descripcion: 'Diseños con simbología espiritual, San Benito, cruces y elementos sagrados.'
  },
  {
    id: 'linea-esencial',
    nombre: 'Línea Esencial',
    descripcion: 'Modelos delicados, sencillos y accesibles para uso cotidiano.'
  }
]

export const ESTADOS_PRODUCCION = [
  'Disponible',
  'Agotado',
  'En producción',
  'Pausado',
  'No disponible'
] as const

export type EstadoProduccion = typeof ESTADOS_PRODUCCION[number]

export const CONTROL_CALIDAD_QA = [
  'Aprobado',
  'Pendiente',
  'Revisión'
] as const

export type ControlCalidadQA = typeof CONTROL_CALIDAD_QA[number]
