import type { EstadoProduccion, ControlCalidadQA } from '../constants/categorias'

export interface ItemProduccion {
  id?: string
  sku: string
  nombre: string
  categoria: string
  material: string
  colorHilo: string
  precioBase: number
  precioPublico: number
  ganancia: number
  stock: number
  estado: EstadoProduccion | string
  qa: ControlCalidadQA | string
  imagenUrl?: string
  tiempoProduccionMin?: number
  created_at?: string
  updated_at?: string
}

export interface GoogleSheetsSyncResult {
  exito: boolean
  totalProcesados: number
  nuevos: number
  actualizados: number
  errores: string[]
  items: ItemProduccion[]
}
