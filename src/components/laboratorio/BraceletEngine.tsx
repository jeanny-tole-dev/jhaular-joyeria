// Componente 3D <BraceletEngine /> — Hilo Fino Calibre T70, Unificación Total del Material y Sincronización Dinámica 100% en Tiempo Real

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  RADIO_PULSERA,
  GROSOR_HILO,
  calcularRadioVolumetrico,
  hayColisionSolida
} from '../../utils/geometry3d'

export type ElementoColocado = {
  id: string
  tipo: 'balin' | 'esmeralda' | 'nudo' | 'dije'
  tamano: string
  angulo: number // Radianes [-PI, PI]
  nombre?: string
  diametroMm?: number
  pesoGramos?: number
  precioInterno?: number
  imagenUrl?: string
}

export type ElementoInventario = {
  tipo: 'balin' | 'esmeralda' | 'nudo' | 'dije'
  tamano: string
  nombre: string
  diametroMm?: number
  pesoGramos?: number
  precioInterno: number
  imagenUrl?: string
  origen?: string
}

export type BraceletEngineProps = {
  piezasColocadas?: ElementoColocado[]
  herramientaActiva?: ElementoInventario | null
  piezaSeleccionadaId?: string | null
  hiloColor?: string
  hiloCalibre?: string
  nudoTipo?: string
  onColocarPieza?: (pieza: Omit<ElementoColocado, 'id'>) => void
  onSeleccionarPieza?: (id: string | null) => void
  onMoverPieza?: (id: string, nuevoAngulo: number) => void
  onEliminarPieza?: (id: string) => void
  onDragStateChange?: (isDragging: boolean) => void
}

export {
  RADIO_PULSERA,
  GROSOR_HILO,
  calcularRadioVolumetrico,
  hayColisionSolida,
} from '../../utils/geometry3d'



// Generador de mapa de normales para relieve diamantado orfebre 360°
function generarNormalMapEstriasDiamantadas(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = 'rgb(128, 128, 255)'
  ctx.fillRect(0, 0, size, size)

  const step = 8
  ctx.lineWidth = 1.8

  for (let x = -size; x <= size * 2; x += step) {
    const grad1 = ctx.createLinearGradient(x, 0, x + step, step)
    grad1.addColorStop(0, 'rgb(220, 110, 240)')
    grad1.addColorStop(0.5, 'rgb(128, 128, 255)')
    grad1.addColorStop(1, 'rgb(50, 150, 240)')
    ctx.strokeStyle = grad1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + size, size)
    ctx.stroke()

    const grad2 = ctx.createLinearGradient(x, size, x + step, 0)
    grad2.addColorStop(0, 'rgb(110, 220, 240)')
    grad2.addColorStop(0.5, 'rgb(128, 128, 255)')
    grad2.addColorStop(1, 'rgb(160, 50, 240)')
    ctx.strokeStyle = grad2
    ctx.beginPath()
    ctx.moveTo(x, size)
    ctx.lineTo(x + size, 0)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(10, 10)
  return texture
}

// 1. Bloque de Nudo Franciscano (Barril de Macramé con color 100% sincronizado)
function BloqueNudoFranciscano({
  position,
  rotationY = 0,
  texturaHilo,
  colorHilo = '#0a0a0a',
  isSelected = false,
  onPointerDown,
}: {
  position: [number, number, number]
  rotationY?: number
  texturaHilo: THREE.Texture
  colorHilo?: string
  isSelected?: boolean
  onPointerDown?: (e: any) => void
}) {
  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerDown={onPointerDown}
    >
      {[-0.044, -0.022, 0, 0.022, 0.044].map((offset, i) => (
        <mesh key={i} position={[0, 0, offset]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[0.036, 0.012, 16, 32]} />
          <meshStandardMaterial
            color={isSelected ? '#D4AF37' : colorHilo}
            roughness={0.9}
            metalness={0.0}
            bumpMap={texturaHilo}
            bumpScale={0.02}
            emissive={isSelected ? '#554411' : '#000000'}
            emissiveIntensity={isSelected ? 0.6 : 0}
          />
        </mesh>
      ))}
      <mesh rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.026, 0.11, 16]} />
        <meshStandardMaterial
          color={colorHilo}
          roughness={0.9}
          metalness={0.0}
          bumpMap={texturaHilo}
          bumpScale={0.015}
        />
      </mesh>
    </group>
  )
}

// 2. Balín en Oro de 18 Kilates (Oro 18K) con Relieve Diamantado
function BalinOro({
  position,
  radio = 0.13,
  texturaOro,
  normalMapDiamantado,
  isSelected = false,
  onPointerDown,
}: {
  position: [number, number, number]
  radio?: number
  texturaOro: THREE.Texture
  normalMapDiamantado: THREE.Texture
  isSelected?: boolean
  onPointerDown?: (e: any) => void
}) {
  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radio, 64, 64]} />
        <meshStandardMaterial
          color="#E5C158"
          metalness={1.0}
          roughness={0.2}
          normalMap={normalMapDiamantado}
          normalScale={new THREE.Vector2(2.0, 2.0)}
          bumpMap={texturaOro}
          bumpScale={0.03}
          envMapIntensity={2.5}
          emissive={isSelected ? '#665511' : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0}
        />
      </mesh>
    </group>
  )
}

// 3. Muralla de Esmeralda Colombiana (Esfera Translúcida Proporcional)
function EsmeraldaGema({
  position,
  radio = 0.14,
  texturaEsmeralda,
  isSelected = false,
  onPointerDown,
}: {
  position: [number, number, number]
  radio?: number
  texturaEsmeralda: THREE.Texture
  isSelected?: boolean
  onPointerDown?: (e: any) => void
}) {
  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radio, 64, 64]} />
        <meshPhysicalMaterial
          color="#0A5C36"
          map={texturaEsmeralda}
          emissive={isSelected ? '#086638' : '#064024'}
          emissiveIntensity={isSelected ? 0.9 : 0.35}
          roughness={0.12}
          metalness={0.05}
          transmission={0.35}
          thickness={1.2}
          ior={1.58}
          reflectivity={0.4}
          clearcoat={0.6}
          clearcoatRoughness={0.1}
          bumpMap={texturaEsmeralda}
          bumpScale={0.02}
          envMapIntensity={0.9}
        />
      </mesh>
    </group>
  )
}

// 4. Dije Central / Charm Colgante en Oro 18K con Argolla
function DijeColgante({
  position,
  texturaOro,
  normalMapDiamantado,
  isSelected = false,
  onPointerDown,
}: {
  position: [number, number, number]
  texturaOro: THREE.Texture
  normalMapDiamantado: THREE.Texture
  isSelected?: boolean
  onPointerDown?: (e: any) => void
}) {
  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
    >
      {/* Argolla Superior de Montaje en el Hilo */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <torusGeometry args={[0.038, 0.010, 16, 24]} />
        <meshStandardMaterial color="#E5C158" metalness={1.0} roughness={0.2} />
      </mesh>
      {/* Medalla Colgante en Oro 18K */}
      <mesh position={[0, -0.06, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.028, 32]} />
        <meshStandardMaterial
          color="#E5C158"
          metalness={1.0}
          roughness={0.2}
          normalMap={normalMapDiamantado}
          normalScale={new THREE.Vector2(1.5, 1.5)}
          bumpMap={texturaOro}
          bumpScale={0.025}
          envMapIntensity={2.5}
          emissive={isSelected ? '#665511' : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0}
        />
      </mesh>
    </group>
  )
}

// 5. Cierre Ajustable con Nudo Franciscano Corredizo — UNIFICACIÓN TOTAL DEL MATERIAL
function CierreFranciscano({
  position = [0, 0, -RADIO_PULSERA],
  texturaHilo,
  normalMapDiamantado,
  texturaOro,
  colorHilo = '#0a0a0a',
}: {
  position?: [number, number, number]
  texturaHilo: THREE.Texture
  normalMapDiamantado: THREE.Texture
  texturaOro: THREE.Texture
  colorHilo?: string
}) {
  return (
    <group position={position}>
      {/* Hilos Longitudinales Pasantes */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.008, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[GROSOR_HILO, GROSOR_HILO, 0.36, 16]} />
          <meshStandardMaterial color={colorHilo} roughness={0.9} metalness={0.0} bumpMap={texturaHilo} bumpScale={0.02} />
        </mesh>
        <mesh position={[0, -0.008, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[GROSOR_HILO, GROSOR_HILO, 0.36, 16]} />
          <meshStandardMaterial color={colorHilo} roughness={0.9} metalness={0.0} bumpMap={texturaHilo} bumpScale={0.02} />
        </mesh>
      </group>

      {/* Nudo Franciscano Corredizo (Mismo color del hilo) */}
      <group position={[0, 0, 0]}>
        {[-0.052, -0.031, -0.010, 0.010, 0.031, 0.052].map((offset, i) => (
          <mesh key={i} position={[offset, 0, 0]} rotation={[0, Math.PI / 2, 0.08]} castShadow receiveShadow>
            <torusGeometry args={[0.038, 0.012, 16, 32]} />
            <meshStandardMaterial
              color={colorHilo}
              roughness={0.9}
              metalness={0.0}
              bumpMap={texturaHilo}
              bumpScale={0.02}
            />
          </mesh>
        ))}

        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.14, 16]} />
          <meshStandardMaterial
            color={colorHilo}
            roughness={0.9}
            metalness={0.0}
            bumpMap={texturaHilo}
            bumpScale={0.015}
          />
        </mesh>
      </group>

      {/* Salida de los Dos Hilos Verticales de Ajuste (Mismo calibre y color del hilo seleccionado) */}
      {/* Hilo Izquierdo */}
      <group position={[-0.06, -0.035, 0]}>
        <mesh position={[0, -0.29, 0.005]} castShadow>
          <cylinderGeometry args={[GROSOR_HILO, GROSOR_HILO, 0.58, 16]} />
          <meshStandardMaterial color={colorHilo} roughness={0.9} metalness={0.0} bumpMap={texturaHilo} bumpScale={0.02} />
        </mesh>
        <mesh position={[0, -0.61, 0.005]} castShadow>
          <sphereGeometry args={[0.054, 32, 32]} />
          <meshStandardMaterial
            color="#E5C158"
            metalness={1.0}
            roughness={0.2}
            normalMap={normalMapDiamantado}
            normalScale={new THREE.Vector2(1.6, 1.6)}
            bumpMap={texturaOro}
            bumpScale={0.02}
            envMapIntensity={2.5}
          />
        </mesh>
        <mesh position={[0, -0.665, 0.005]} castShadow>
          <sphereGeometry args={[0.018, 16, 16]} />
          <meshStandardMaterial color={colorHilo} roughness={0.9} metalness={0.0} />
        </mesh>
      </group>

      {/* Hilo Derecho */}
      <group position={[0.06, -0.035, 0]}>
        <mesh position={[0, -0.29, -0.005]} castShadow>
          <cylinderGeometry args={[GROSOR_HILO, GROSOR_HILO, 0.58, 16]} />
          <meshStandardMaterial color={colorHilo} roughness={0.9} metalness={0.0} bumpMap={texturaHilo} bumpScale={0.02} />
        </mesh>
        <mesh position={[0, -0.61, -0.005]} castShadow>
          <sphereGeometry args={[0.054, 32, 32]} />
          <meshStandardMaterial
            color="#E5C158"
            metalness={1.0}
            roughness={0.2}
            normalMap={normalMapDiamantado}
            normalScale={new THREE.Vector2(1.6, 1.6)}
            bumpMap={texturaOro}
            bumpScale={0.02}
            envMapIntensity={2.5}
          />
        </mesh>
        <mesh position={[0, -0.665, -0.005]} castShadow>
          <sphereGeometry args={[0.018, 16, 16]} />
          <meshStandardMaterial color={colorHilo} roughness={0.9} metalness={0.0} />
        </mesh>
      </group>
    </group>
  )
}

// 6. Previsualizador "Fantasma" (Ghost Indicator) con Detección Visual de Bloqueo
function GhostPreview({
  angulo,
  herramienta,
  isBlocked = false,
}: {
  angulo: number
  herramienta: ElementoInventario
  isBlocked?: boolean
}) {
  const x = Math.cos(angulo) * RADIO_PULSERA
  const z = Math.sin(angulo) * RADIO_PULSERA
  const rotY = -angulo
  const radio = calcularRadioVolumetrico(herramienta.tipo, herramienta.tamano)

  if (isBlocked) {
    return (
      <group position={[x, 0, z]}>
        <mesh>
          <sphereGeometry args={[radio * 1.15, 32, 32]} />
          <meshStandardMaterial
            color="#EF4444"
            transparent
            opacity={0.65}
            emissive="#DC2626"
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radio * 1.1, radio * 1.4, 32]} />
          <meshBasicMaterial color="#EF4444" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    )
  }

  if (herramienta.tipo === 'balin') {
    return (
      <group position={[x, 0, z]}>
        <mesh>
          <sphereGeometry args={[radio, 32, 32]} />
          <meshStandardMaterial
            color="#FFE685"
            metalness={0.8}
            roughness={0.3}
            transparent
            opacity={0.75}
            emissive="#D4AF37"
            emissiveIntensity={0.6}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radio * 1.1, radio * 1.35, 32]} />
          <meshBasicMaterial color="#FFE685" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
    )
  }

  if (herramienta.tipo === 'esmeralda') {
    return (
      <group position={[x, 0, z]}>
        <mesh>
          <sphereGeometry args={[radio, 32, 32]} />
          <meshStandardMaterial
            color="#34D399"
            roughness={0.2}
            transparent
            opacity={0.75}
            emissive="#059669"
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radio * 1.1, radio * 1.35, 32]} />
          <meshBasicMaterial color="#34D399" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
    )
  }

  if (herramienta.tipo === 'nudo') {
    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
          <meshStandardMaterial color="#4A5568" transparent opacity={0.65} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={[x, -0.08, z]}>
      <mesh>
        <cylinderGeometry args={[0.13, 0.13, 0.028, 32]} />
        <meshStandardMaterial color="#FFE685" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

// 7. COMPONENTE MODULAR DE PIEZA COLOCADA
function PiezaColocadaItem({
  pieza,
  texturaOro,
  normalMapDiamantado,
  texturaHilo,
  texturaEsmeralda,
  colorHilo,
  isDragging,
  onSelect,
  onStartDrag,
  onEliminar,
}: {
  pieza: ElementoColocado
  texturaOro: THREE.Texture
  normalMapDiamantado: THREE.Texture
  texturaHilo: THREE.Texture
  texturaEsmeralda: THREE.Texture
  colorHilo: string
  isDragging: boolean
  onSelect?: (id: string) => void
  onStartDrag?: (id: string) => void
  onEliminar?: (id: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimerRef = useRef<any>(null)

  const handleEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (!isDragging) {
      setIsHovered(true)
      document.body.style.cursor = 'grab'
    }
  }

  const handleLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false)
      if (!isDragging) {
        document.body.style.cursor = 'default'
      }
    }, 240)
  }

  const x = Math.cos(pieza.angulo) * RADIO_PULSERA
  const z = Math.sin(pieza.angulo) * RADIO_PULSERA
  const radioVol = calcularRadioVolumetrico(pieza.tipo, pieza.tamano)

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    setIsHovered(false)
    if (onSelect) onSelect(pieza.id)
    if (onStartDrag) onStartDrag(pieza.id)
  }

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        handleEnter()
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        handleLeave()
      }}
    >
      {/* Hitbox invisible continua que une la pieza y la "X" */}
      <mesh
        position={[x, 0.16, z]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <cylinderGeometry args={[radioVol * 1.8, radioVol * 1.8, 0.58, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Geometría de la pieza */}
      {pieza.tipo === 'balin' && (
        <BalinOro
          position={[x, 0, z]}
          radio={radioVol}
          texturaOro={texturaOro}
          normalMapDiamantado={normalMapDiamantado}
          isSelected={isHovered && !isDragging}
          onPointerDown={handlePointerDown}
        />
      )}

      {pieza.tipo === 'esmeralda' && (
        <EsmeraldaGema
          position={[x, 0, z]}
          radio={radioVol}
          texturaEsmeralda={texturaEsmeralda}
          isSelected={isHovered && !isDragging}
          onPointerDown={handlePointerDown}
        />
      )}

      {pieza.tipo === 'nudo' && (
        <BloqueNudoFranciscano
          position={[x, 0, z]}
          rotationY={-pieza.angulo}
          texturaHilo={texturaHilo}
          colorHilo={colorHilo}
          isSelected={isHovered && !isDragging}
          onPointerDown={handlePointerDown}
        />
      )}

      {pieza.tipo === 'dije' && (
        <DijeColgante
          position={[x, -0.08, z]}
          texturaOro={texturaOro}
          normalMapDiamantado={normalMapDiamantado}
          isSelected={isHovered && !isDragging}
          onPointerDown={handlePointerDown}
        />
      )}

      {/* BOTÓN FLOTANTE "✕" CON ESCALA CONSTANTE EN PANTALLA */}
      {isHovered && !isDragging && onEliminar && (
        <Html center position={[x, 0.35, z]} zIndexRange={[100, 0]}>
          <div
            style={{ pointerEvents: 'auto' }}
            className="pointer-events-auto select-none p-1"
            onPointerEnter={handleEnter}
            onPointerLeave={handleLeave}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
                setIsHovered(false)
                document.body.style.cursor = 'default'
                onEliminar(pieza.id)
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
              }}
              className="w-6 h-6 min-w-[24px] min-h-[24px] rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white flex items-center justify-center text-xs font-bold shadow-2xl transition-transform hover:scale-110 cursor-pointer border-2 border-white/90"
              title="Eliminar elemento"
            >
              ✕
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}

// 8. COMPONENTE PRINCIPAL DEL MOTOR 3D
export default function BraceletEngine({
  piezasColocadas = [],
  herramientaActiva = null,
  piezaSeleccionadaId = null,
  hiloColor = '#0a0a0a',
  hiloCalibre = 'Terlenca',
  onColocarPieza,
  onSeleccionarPieza,
  onMoverPieza,
  onEliminarPieza,
  onDragStateChange,
}: BraceletEngineProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [ghostAngulo, setGhostAngulo] = useState<number | null>(null)
  const [isGhostBlocked, setIsGhostBlocked] = useState<boolean>(false)
  const [isDraggingPieza, setIsDraggingPieza] = useState<string | null>(null)

  // Color de hilo dinámico (Sincronización 100% en tiempo real)
  const colorHiloFinal = hiloColor || '#0a0a0a'

  // Mapa de normales diamantado
  const normalMapDiamantado = useMemo(() => generarNormalMapEstriasDiamantadas(), [])

  // Texturas de alta resolución
  const [texturaOro, texturaHilo, texturaEsmeralda] = useTexture([
    '/textura-oro.jpeg',
    '/textura-hilo.jpeg',
    '/textura-esmeralda.jpeg',
  ])

  useEffect(() => {
    if (texturaOro) {
      texturaOro.wrapS = THREE.RepeatWrapping
      texturaOro.wrapT = THREE.RepeatWrapping
      texturaOro.repeat.set(10, 10)
      texturaOro.needsUpdate = true
    }
    if (texturaHilo) {
      texturaHilo.wrapS = THREE.RepeatWrapping
      texturaHilo.wrapT = THREE.RepeatWrapping
      texturaHilo.repeat.set(100, 2)
      texturaHilo.needsUpdate = true
    }
    if (texturaEsmeralda) {
      texturaEsmeralda.wrapS = THREE.RepeatWrapping
      texturaEsmeralda.wrapT = THREE.RepeatWrapping
      texturaEsmeralda.repeat.set(3, 3)
      texturaEsmeralda.needsUpdate = true
    }
  }, [texturaOro, texturaHilo, texturaEsmeralda])

  // Geometría del cordón base (Hilo fino delicado Calibre T70)
  const geometriaHilo = useMemo(() => {
    const radioTubo = hiloCalibre === 'Coreano' ? GROSOR_HILO * 1.25 : GROSOR_HILO
    return new THREE.TorusGeometry(RADIO_PULSERA, radioTubo, 32, 300)
  }, [hiloCalibre])

  // Atajo de teclado Delete / Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && piezaSeleccionadaId && onEliminarPieza) {
        onEliminarPieza(piezaSeleccionadaId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [piezaSeleccionadaId, onEliminarPieza])

  // Soltar arrastre al soltar el ratón en cualquier parte de la ventana
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDraggingPieza) {
        setIsDraggingPieza(null)
        if (onDragStateChange) onDragStateChange(false)
        document.body.style.cursor = 'default'
      }
    }
    window.addEventListener('pointerup', handleGlobalPointerUp)
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp)
  }, [isDraggingPieza, onDragStateChange])

  // Rotación suave en reposo
  useFrame((_, delta) => {
    if (
      groupRef.current &&
      !herramientaActiva &&
      !isDraggingPieza &&
      ghostAngulo === null &&
      !piezaSeleccionadaId
    ) {
      groupRef.current.rotation.y += delta * 0.12
    }
  })

  // Raycasting sobre la circunferencia para Arrastrar y Reposicionar Libremente
  const handlePointerMoveRing = (e: any) => {
    e.stopPropagation()
    const point = e.point
    const angulo = Math.atan2(point.z, point.x)
    setGhostAngulo(angulo)

    // Reposicionamiento fluido de piezas arrastradas a lo largo de la curva
    if (isDraggingPieza && onMoverPieza) {
      const arrastrada = piezasColocadas.find((p) => p.id === isDraggingPieza)
      if (arrastrada) {
        const bloqueado = hayColisionSolida(angulo, arrastrada.tipo, arrastrada.tamano, piezasColocadas, isDraggingPieza)
        if (!bloqueado) {
          document.body.style.cursor = 'grabbing'
          onMoverPieza(isDraggingPieza, angulo)
        } else {
          document.body.style.cursor = 'not-allowed'
        }
      }
    } else if (herramientaActiva) {
      const bloqueado = hayColisionSolida(angulo, herramientaActiva.tipo, herramientaActiva.tamano, piezasColocadas)
      setIsGhostBlocked(bloqueado)
      document.body.style.cursor = bloqueado ? 'not-allowed' : 'pointer'
    }
  }

  const handlePointerDownRing = (e: any) => {
    e.stopPropagation()
    const point = e.point
    const angulo = Math.atan2(point.z, point.x)

    if (herramientaActiva && onColocarPieza) {
      const bloqueado = hayColisionSolida(angulo, herramientaActiva.tipo, herramientaActiva.tamano, piezasColocadas)
      if (bloqueado) {
        return
      }

      onColocarPieza({
        tipo: herramientaActiva.tipo,
        tamano: herramientaActiva.tamano,
        angulo,
        nombre: herramientaActiva.nombre,
        diametroMm: herramientaActiva.diametroMm,
        pesoGramos: herramientaActiva.pesoGramos,
        precioInterno: herramientaActiva.precioInterno,
        imagenUrl: herramientaActiva.imagenUrl,
      })
    } else {
      if (onSeleccionarPieza) onSeleccionarPieza(null)
    }
  }

  return (
    <group ref={groupRef}>
      {/* 1. Malla Interactiva Invisible para Raycasting Preciso en 360° */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMoveRing}
        onPointerLeave={() => {
          setGhostAngulo(null)
          if (!isDraggingPieza) document.body.style.cursor = 'default'
        }}
        onPointerDown={handlePointerDownRing}
      >
        <ringGeometry args={[RADIO_PULSERA - 0.55, RADIO_PULSERA + 0.55, 64]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* 2. Base de la Manilla: Hilo Fino Calibre T70 con material y color 100% sincronizados */}
      <mesh
        geometry={geometriaHilo}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={colorHiloFinal}
          roughness={0.9}
          metalness={0.0}
          bumpMap={texturaHilo}
          bumpScale={0.02}
        />
      </mesh>

      {/* 3. Renderizado Dinámico de Elementos Colocados */}
      {piezasColocadas.map((pieza) => (
        <PiezaColocadaItem
          key={pieza.id}
          pieza={pieza}
          texturaOro={texturaOro}
          normalMapDiamantado={normalMapDiamantado}
          texturaHilo={texturaHilo}
          texturaEsmeralda={texturaEsmeralda}
          colorHilo={colorHiloFinal}
          isDragging={isDraggingPieza === pieza.id}
          onSelect={(id) => {
            if (onSeleccionarPieza) onSeleccionarPieza(id)
          }}
          onStartDrag={(id) => {
            setIsDraggingPieza(id)
            if (onDragStateChange) onDragStateChange(true)
            document.body.style.cursor = 'grabbing'
          }}
          onEliminar={(id) => {
            if (onEliminarPieza) onEliminarPieza(id)
          }}
        />
      ))}

      {/* 4. Previsualizador "Ghost" con Proporciones Volumétricas */}
      {ghostAngulo !== null && herramientaActiva && !isDraggingPieza && (
        <GhostPreview
          angulo={ghostAngulo}
          herramienta={herramientaActiva}
          isBlocked={isGhostBlocked}
        />
      )}

      {/* 5. Cierre Ajustable con Nudo Franciscano (100% Sincronizado en Color y Material) */}
      <CierreFranciscano
        position={[0, 0, -RADIO_PULSERA]}
        texturaHilo={texturaHilo}
        normalMapDiamantado={normalMapDiamantado}
        texturaOro={texturaOro}
        colorHilo={colorHiloFinal}
      />
    </group>
  )
}
