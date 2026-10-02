import type { Material } from './materiales'

export interface RecetaItem {
  id: string // Identificador local de la fila
  material_id: string
  material?: Material | null
  cantidad: number
}

export interface ProductoData {
  id?: string
  nombre: string
  slug?: string
  categoria_id?: string | null
  categoria?: string
  descripcion?: string | null
  imagen_url?: string | null
  imagen_principal_url?: string | null
  tiempo_produccion?: number
  tiempo_produccion_min?: number
  costo_materiales?: number
  mano_obra?: number
  margen_operativo?: number
  costo_total_real?: number
  margen_ganancia_pct?: number
  precio_sugerido?: number
  precio_venta: number
  destacado?: boolean
  meta_keywords?: string | null
  badge_tag?: string | null
  bonds_tag?: string | null
  es_publico?: boolean
  activo?: boolean
  created_at?: string
}

export const CATEGORIAS_PRODUCTOS = [
  'Religiosa / Sacra',
  'Tradicional',
  'Aventura',
  'Ediciones Especiales',
  'MANILLA_MACRAME',
  'PULSERA',
  'COLLAR',
  'OTROS'
] as const

export type CategoriaProducto = typeof CATEGORIAS_PRODUCTOS[number]

export const ETIQUETAS_BADGES = [
  'MÁS VENDIDO',
  'NUEVO',
  'LÍNEA AVENTURA',
  'LÍNEA TRADICIONAL',
  'COLECCIÓN SACRA',
  'EDICIÓN ESPECIAL',
  'EDICIÓN LIMITADA',
  'CLÁSICO JHAULAR',
  'ÚLTIMAS UNIDADES',
  'HECHO A MANO',
  'ORO 18K CERTIFICADO',
  'OFERTA ESPECIAL',
  'RECOMENDADO'
] as const

export type EtiquetaBadge = typeof ETIQUETAS_BADGES[number]
