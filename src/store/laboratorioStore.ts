import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PieceType = 'balin' | 'esmeralda' | 'dije' | 'separador' | 'nudo' | 'hilo' | 'tejido' | 'knot' | 'gold_bead' | 'emerald'

export interface ComponenteDiseno {
  id: string
  tipo: 'hilo' | 'tejido' | 'balin' | 'esmeralda' | 'dije' | 'separador' | 'nudo'
  materialId: string
  posicion: number
  cantidad: number
  longitudMm?: number
  color?: string
}

export interface DijeMagnetico {
  id: string
  nombre: string
  categoria: 'balin' | 'esmeralda' | 'dije'
  precio: number
  color: string
  bordeColor: string
  iconoSimbolo: string
  textureUrl?: string
}

export const HILO_COLORS = ['#D4AF37', '#7E6754', '#084F35', '#7A1F2B', '#0A0A0A', '#1B2A4A']

interface LaboratorioState {
  nombrePulsera: string
  setNombrePulsera: (nombre: string) => void

  hiloColor: string
  hiloColorNucleo: string
  hiloTipoId: string | null
  setHiloColor: (hex: string) => void
  setHiloColorNucleo: (hex: string) => void
  setHiloTipoId: (id: string) => void

  tejidoTipo: 'plano' | 'espiral' | 'cobra'
  setTejidoTipo: (t: 'plano' | 'espiral' | 'cobra') => void

  cantidades: Record<string, number>
  incrementar: (materialId: string) => void
  decrementar: (materialId: string) => void

  dijesSeleccionados: string[]
  toggleDije: (materialId: string) => void

  componentes: ComponenteDiseno[]
  agregarComponente: (c: ComponenteDiseno) => void
  quitarComponente: (id: string) => void

  // ESTADO DE ANCLAJES MAGNÉTICOS (Fijación 3D)
  anclajesMagneticos: Record<number, DijeMagnetico | null>
  asignarAnclaje: (puntoId: number, dije: DijeMagnetico | null) => void
  limpiarAnclajes: () => void

  reset: () => void
}

const estadoInicial = {
  nombrePulsera: 'Diseño Sagrado Jhaular',
  hiloColor: HILO_COLORS[4], // Negro por defecto
  hiloColorNucleo: HILO_COLORS[0], // Oro 18K
  hiloTipoId: null as string | null,
  tejidoTipo: 'cobra' as const,
  cantidades: {} as Record<string, number>,
  dijesSeleccionados: [] as string[],
  componentes: [] as ComponenteDiseno[],
  anclajesMagneticos: {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
  } as Record<number, DijeMagnetico | null>,
}

export const useLaboratorioStore = create<LaboratorioState>()(
  persist(
    (set) => ({
      ...estadoInicial,
      setNombrePulsera: (nombre) => set({ nombrePulsera: nombre }),

      setHiloColor: (hex) => set({ hiloColor: hex }),
      setHiloColorNucleo: (hex) => set({ hiloColorNucleo: hex }),
      setHiloTipoId: (id) => set({ hiloTipoId: id }),

      setTejidoTipo: (t) => set({ tejidoTipo: t }),

      incrementar: (materialId) =>
        set((state) => ({
          cantidades: {
            ...state.cantidades,
            [materialId]: (state.cantidades[materialId] ?? 0) + 1,
          },
        })),
      decrementar: (materialId) =>
        set((state) => ({
          cantidades: {
            ...state.cantidades,
            [materialId]: Math.max(0, (state.cantidades[materialId] ?? 0) - 1),
          },
        })),

      toggleDije: (materialId) =>
        set((state) => ({
          dijesSeleccionados: state.dijesSeleccionados.includes(materialId)
            ? state.dijesSeleccionados.filter((id) => id !== materialId)
            : [...state.dijesSeleccionados, materialId],
        })),

      agregarComponente: (c) =>
        set((state) => ({ componentes: [...state.componentes, c] })),
      quitarComponente: (id) =>
        set((state) => ({
          componentes: state.componentes.filter((c) => c.id !== id),
        })),

      asignarAnclaje: (puntoId, dije) =>
        set((state) => ({
          anclajesMagneticos: {
            ...state.anclajesMagneticos,
            [puntoId]: dije,
          },
        })),

      limpiarAnclajes: () =>
        set({
          anclajesMagneticos: { 1: null, 2: null, 3: null, 4: null, 5: null },
        }),

      reset: () => set(estadoInicial),
    }),
    { name: 'jhaular-laboratorio' }
  )
)