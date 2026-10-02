// Componente 3D <BraceletRing /> — Renderizado Modular a lo largo de Curva 3D (R3F)

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLaboratorioStore, type PieceType } from '../../store/laboratorioStore'

const RADIO_PULSERA = 1.6
const GROSOR_CORRE_INTERNO = 0.04

// 1. Textura de fibra trenzada para los nudos
function crearTexturaFibra(colorExterior: string, colorNucleo: string) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = colorNucleo
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = colorExterior
  ctx.lineWidth = size * 0.35
  ctx.lineCap = 'round'

  for (let i = -size; i <= size * 2; i += 16) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + size, size)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(i, size)
    ctx.lineTo(i + size, 0)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

// 2. Módulo Individual: Nudo de Macramé
function PieceKnot({ position, tangent }: { position: THREE.Vector3; tangent: THREE.Vector3 }) {
  const hiloColor = useLaboratorioStore((s) => s.hiloColor)
  const hiloColorNucleo = useLaboratorioStore((s) => s.hiloColorNucleo)
  const meshRef = useRef<THREE.Group>(null)

  const texture = useMemo(
    () => crearTexturaFibra(hiloColor, hiloColorNucleo),
    [hiloColor, hiloColorNucleo]
  )

  const orientationMatrix = useMemo(() => {
    const m = new THREE.Matrix4()
    const up = new THREE.Vector3(0, 1, 0)
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize()
    m.makeBasis(normal, binormal, tangent)
    m.setPosition(position)
    return m
  }, [position, tangent])

  return (
    <group ref={meshRef} matrixAutoUpdate={false} matrix={orientationMatrix}>
      {/* Nudo cilíndrico achatado orientado a lo largo del eje del riel */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.24, 18]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={texture}
          bumpScale={0.02}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>
      {/* Anillo de nudo decorativo */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.138, 0.025, 8, 16]} />
        <meshStandardMaterial color={hiloColorNucleo} roughness={0.6} />
      </mesh>
    </group>
  )
}

// 3. Módulo Individual: Balín de Oro Puro de 24 Quilates
function PieceGoldBead({ position, tangent }: { position: THREE.Vector3; tangent: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Group>(null)

  const orientationMatrix = useMemo(() => {
    const m = new THREE.Matrix4()
    const up = new THREE.Vector3(0, 1, 0)
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize()
    m.makeBasis(normal, binormal, tangent)
    m.setPosition(position)
    return m
  }, [position, tangent])

  return (
    <group ref={meshRef} matrixAutoUpdate={false} matrix={orientationMatrix}>
      <mesh>
        <sphereGeometry args={[0.165, 32, 32]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.12}
          metalness={1.0}
          envMapIntensity={1.8}
        />
      </mesh>
    </group>
  )
}

// 4. Módulo Individual: Esmeralda Natural Colombiana (Prisma Facetado)
function PieceEmerald({ position, tangent }: { position: THREE.Vector3; tangent: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Group>(null)

  const orientationMatrix = useMemo(() => {
    const m = new THREE.Matrix4()
    const up = new THREE.Vector3(0, 1, 0)
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize()
    m.makeBasis(normal, binormal, tangent)
    m.setPosition(position)
    return m
  }, [position, tangent])

  return (
    <group ref={meshRef} matrixAutoUpdate={false} matrix={orientationMatrix}>
      {/* Montura o bisel dorado mínimo en la base */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.13, 0.02, 8, 16]} />
        <meshStandardMaterial color="#D4AF37" metalness={1.0} roughness={0.15} />
      </mesh>

      {/* Gema de Esmeralda con corte prisma/octaedro */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshPhysicalMaterial
          color="#084F35"
          roughness={0.08}
          transmission={0.72}
          thickness={1.4}
          ior={1.62}
          reflectivity={0.9}
        />
      </mesh>
    </group>
  )
}

// 5. Componente Principal <BraceletRing pattern={...} />
export default function BraceletRing({ pattern }: { pattern: PieceType[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const hiloColor = useLaboratorioStore((s) => s.hiloColor)

  // 1. Riel / Curva Spline cerrada en Three.js
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 64
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(theta) * RADIO_PULSERA, 0, Math.sin(theta) * RADIO_PULSERA))
    }
    return new THREE.CatmullRomCurve3(points, true)
  }, [])

  // Geometría del hilo conductor interno que conecta todas las piezas
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, GROSOR_CORRE_INTERNO, 8, true)
  }, [curve])

  // 2. Rotación suave continua del modelo 3D
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22
    }
  })

  const totalPieces = pattern.length

  // 3. Mapeo equidistante a lo largo de la curva con posición y vector tangente
  const piecesData = useMemo(() => {
    if (totalPieces === 0) return []

    return pattern.map((type, index) => {
      const t = index / totalPieces
      const position = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t).normalize()

      return {
        id: `${type}-${index}`,
        type,
        position,
        tangent,
      }
    })
  }, [pattern, totalPieces, curve])

  return (
    <group ref={groupRef}>
      {/* Alma / Hilo central continuo de la pulsera */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial color={hiloColor} roughness={0.8} />
      </mesh>

      {/* Renderizado dinámico de piezas a lo largo de la curva */}
      {piecesData.map((item) => {
        if (item.type === 'knot') {
          return (
            <PieceKnot
              key={item.id}
              position={item.position}
              tangent={item.tangent}
            />
          )
        }
        if (item.type === 'gold_bead') {
          return (
            <PieceGoldBead
              key={item.id}
              position={item.position}
              tangent={item.tangent}
            />
          )
        }
        if (item.type === 'emerald') {
          return (
            <PieceEmerald
              key={item.id}
              position={item.position}
              tangent={item.tangent}
            />
          )
        }
        return null
      })}
    </group>
  )
}
