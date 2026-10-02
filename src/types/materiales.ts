export type Role = 'ADMIN' | 'CLIENTE' | string

export interface Profile {
  id: string
  email: string
  nombre_completo: string | null
  role: Role
  created_at?: string
}

export interface Material {
  id: string
  nombre: string
  unidad: string
  costo_unitario: number
  stock_actual: number
  stock_minimo: number
  proveedor: string | null
  color: string | null
  codigo: string | null
  imagen_url: string | null
  categoria: string
  activo: boolean
  created_at?: string
}

export interface LoteMaterial {
  id?: string
  material_id: string
  cantidad: number
  costo_total: number
  costo_unitario?: number
  proveedor?: string | null
  numero_factura?: string | null
  created_at?: string
}

export interface MaterialFormData {
  nombre: string
  codigo: string
  categoria: string
  unidad: string
  costo_unitario: number
  stock_actual: number
  stock_minimo: number
  proveedor: string
  color: string
  imagen_url: string
}

export interface FacturaFormData {
  material_id: string
  cantidad: number
  costo_total: number
  proveedor: string
  numero_factura: string
}

export const CATEGORIAS_MATERIALES = [
  'HILO',
  'BALIN',
  'DIJE',
  'ESMERALDA',
  'EMPAQUE',
  'HILERAS',
  'HERRAJE',
  'OTROS'
] as const

export type CategoriaMaterial = typeof CATEGORIAS_MATERIALES[number]
