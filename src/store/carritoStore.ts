import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ItemCarrito {
  productoId: string
  varianteId?: string
  nombreProducto: string
  cantidad: number
  precioUnitario: number
}

interface CarritoState {
  items: ItemCarrito[]
  agregarItem: (item: ItemCarrito) => void
  quitarItem: (productoId: string, varianteId?: string) => void
  actualizarCantidad: (productoId: string, cantidad: number) => void
  vaciar: () => void
  total: () => number
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      items: [],
      agregarItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      quitarItem: (productoId, varianteId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productoId === productoId && i.varianteId === varianteId)
          ),
        })),
      actualizarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productoId === productoId ? { ...i, cantidad } : i
          ),
        })),
      vaciar: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0),
    }),
    { name: 'jhaular-carrito' }
  )
)
