// Canvas 3D del Laboratorio (React Three Fiber) — Soporte de Drag & Drop, Iluminación de Alta Joyería y Control de Órbita

import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Center } from '@react-three/drei'
import BraceletEngine from './BraceletEngine'
import type { BraceletEngineProps, ElementoInventario } from './BraceletEngine'

export default function Canvas3D(props: BraceletEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDraggingInScene, setIsDraggingInScene] = useState<boolean>(false)

  // Manejador nativo de HTML5 Drag and Drop sobre el lienzo 3D
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const dataRaw = e.dataTransfer.getData('application/json')
      if (!dataRaw) return
      const item: ElementoInventario = JSON.parse(dataRaw)

      if (containerRef.current && props.onColocarPieza) {
        const rect = containerRef.current.getBoundingClientRect()
        // Convertir coordenadas de pantalla a ángulo en el plano horizontal
        const clientX = e.clientX - rect.left - rect.width / 2
        const clientY = e.clientY - rect.top - rect.height / 2

        // Proyección a coordenadas polares en el visor
        const angulo = Math.atan2(clientY, clientX)

        props.onColocarPieza({
          tipo: item.tipo,
          tamano: item.tamano,
          angulo,
          nombre: item.nombre,
          diametroMm: item.diametroMm,
          pesoGramos: item.pesoGramos,
          precioInterno: item.precioInterno,
          imagenUrl: item.imagenUrl,
        })
      }
    } catch (err) {
      console.warn('Error procesando elemento soltado en el canvas:', err)
    }
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-full h-full min-h-[500px] relative bg-[#1E1E24] overflow-hidden select-none"
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.9, 3.8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Fondo de estudio gris neutro de alta joyería */}
        <color attach="background" args={['#1E1E24']} />

        {/* 1. Iluminación de Estudio y Destellos de Oro */}
        <ambientLight intensity={0.65} />
        
        <spotLight
          position={[10, 12, 10]}
          angle={0.18}
          penumbra={1}
          intensity={1.5}
          castShadow
          shadow-bias={-0.0001}
        />

        <directionalLight position={[-10, 6, -5]} intensity={0.55} color="#FFFFFF" />
        <directionalLight position={[0, -4, 6]} intensity={0.35} color="#FFF5DC" />
        <pointLight position={[0, 3, 2]} intensity={0.8} color="#FFEBB5" />

        <Suspense fallback={null}>
          {/* 2. Environment de Estudio para Reflejos Metálicos de Oro 18K */}
          <Environment preset="city" />

          {/* 3. Motor Modular con Arrastre y Reposicionamiento */}
          <Center>
            <BraceletEngine
              {...props}
              onDragStateChange={(dragging) => {
                setIsDraggingInScene(dragging)
                if (props.onDragStateChange) props.onDragStateChange(dragging)
              }}
            />
          </Center>
        </Suspense>

        {/* 4. Cámara y Control 360° (Deshabilitado durante arrastre de piezas) */}
        <OrbitControls
          enabled={!isDraggingInScene}
          enablePan={false}
          minDistance={1.8}
          maxDistance={6.5}
          maxPolarAngle={Math.PI / 2 + 0.3}
          minPolarAngle={Math.PI / 6}
          rotateSpeed={0.8}
          zoomSpeed={0.9}
        />
      </Canvas>
    </div>
  )
}