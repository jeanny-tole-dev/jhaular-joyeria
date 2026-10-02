export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      gastos: {
        Row: {
          id: string
          fecha: string
          categoria: string
          descripcion: string
          monto: number
          comprobante_url: string | null
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      materiales: {
        Row: {
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
        Insert: any
        Update: any
        Relationships: []
      }
      materiales_catalogo: {
        Row: {
          id: string
          nombre: string
          categoria: string
          subcategoria?: string | null
          imagen_url?: string | null
          precio_base?: number
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          nombre_completo: string | null
          role: string
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      lotes_materiales: {
        Row: {
          id: string
          material_id: string
          cantidad: number
          costo_total: number
          costo_unitario?: number
          proveedor?: string | null
          numero_factura?: string | null
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      categorias: {
        Row: {
          id: string
          nombre: string
          descripcion?: string | null
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      productos: {
        Row: {
          id: string
          nombre: string
          slug: string
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
        Insert: any
        Update: any
        Relationships: []
      }
      producto_materiales: {
        Row: {
          id: string
          producto_id: string
          material_id: string
          cantidad: number
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      producto_imagenes: {
        Row: {
          id: string
          producto_id: string
          imagen_url: string
          orden?: number
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      ventas_certificados: {
        Row: {
          id: string
          codigo_certificado: string
          producto_id?: string | null
          producto_nombre: string
          cliente_nombre?: string | null
          fecha_venta: string
          balines_proveedor: string
          balines_tamano: string
          balines_cantidad: number
          hilo_tipo_lote: string
          esmeralda_lote?: string | null
          precio_venta?: number
          observaciones_garantia?: string | null
          activo?: boolean
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      qr_config: {
        Row: {
          id: string
          telefono: string
          mensaje: string
          tipo_destino?: string
          url_destino?: string | null
          modo_codificacion?: string
          total_escaneos: number
          updated_at?: string
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      qr_scans: {
        Row: {
          id: string
          qr_config_id?: string | null
          user_agent?: string | null
          ip?: string | null
          created_at?: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
