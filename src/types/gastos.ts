export interface Gasto {
  id: string
  fecha: string
  categoria: string
  descripcion: string
  monto: number
  comprobante_url?: string | null
  created_at?: string
}

export interface GastoFormData {
  fecha: string
  categoria: string
  descripcion: string
  monto: number
  comprobante_url: string
}

export const CATEGORIAS_GASTOS = [
  'Telefonía/Internet',
  'Transporte',
  'Papelería/Empaques',
  'Publicidad',
  'Otros'
] as const

export type CategoriaGasto = typeof CATEGORIAS_GASTOS[number]
