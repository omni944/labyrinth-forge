import { ContactShadows, Edges, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createTemplateGeometry } from '../lib/template'
import type { TemplateGeometryData, TemplateSettings } from '../types'

function TemplateModel({ data, settings }: { data: TemplateGeometryData; settings: TemplateSettings }) {
  const geometry = useMemo(() => createTemplateGeometry(data, settings.plateThickness), [data, settings.plateThickness])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#b9ed3f" roughness={0.57} metalness={0.04} side={THREE.DoubleSide} />
      <Edges color="#e0ff91" threshold={24} />
    </mesh>
  )
}

function SkadisPreview({ data, settings }: { data: TemplateGeometryData; settings: TemplateSettings }) {
  const slotsRef = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    if (!slotsRef.current) return
    const matrix = new THREE.Matrix4()
    data.slots.forEach((slot, index) => {
      matrix.makeTranslation(slot.x, settings.plateThickness + 0.08, slot.z)
      slotsRef.current?.setMatrixAt(index, matrix)
    })
    slotsRef.current.instanceMatrix.needsUpdate = true
  }, [data.slots, settings.plateThickness])
  const slot = data.slots[0]
  return (
    <group>
      <mesh position={[0, settings.plateThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[data.width, settings.plateThickness, data.depth]} />
        <meshStandardMaterial color="#b9ed3f" roughness={0.57} metalness={0.04} />
        <Edges color="#e0ff91" threshold={24} />
      </mesh>
      {slot && (
        <instancedMesh ref={slotsRef} args={[undefined, undefined, data.slots.length]}>
          <boxGeometry args={[slot.width, 0.14, slot.height]} />
          <meshStandardMaterial color="#151713" roughness={0.8} />
        </instancedMesh>
      )}
    </group>
  )
}

export function TemplateScene({ data, settings, resetSignal }: { data: TemplateGeometryData; settings: TemplateSettings; resetSignal: number }) {
  const size = Math.max(data.width, data.depth)
  return (
    <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#141512']} />
      <fog attach="fog" args={['#141512', size * 1.5, size * 3]} />
      <PerspectiveCamera key={`template-camera-${resetSignal}`} makeDefault position={[size * 0.75, size * 1.05, size * 0.8]} fov={42} near={0.1} far={size * 12} />
      <OrbitControls key={`template-controls-${resetSignal}`} makeDefault target={[0, 0, 0]} minDistance={size * 0.3} maxDistance={size * 4} maxPolarAngle={Math.PI / 2.03} enableDamping dampingFactor={0.07} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[size * 0.8, size * 1.2, size * 0.5]} intensity={2.7} castShadow shadow-mapSize={[2048, 2048]} />
      {settings.type === 'skadis'
        ? <SkadisPreview data={data} settings={settings} />
        : <TemplateModel data={data} settings={settings} />}
      <ContactShadows position={[0, -0.12, 0]} opacity={0.5} scale={size * 2.4} blur={2.6} far={settings.plateThickness * 8} />
      <Grid position={[0, -0.2, 0]} args={[size * 2.4, size * 2.4]} cellSize={10} cellThickness={0.5} cellColor="#30322b" sectionSize={50} sectionThickness={0.8} sectionColor="#3c4034" fadeDistance={size * 1.35} infiniteGrid />
    </Canvas>
  )
}
