import { ContactShadows, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createGadgetGroup } from '../lib/gadget'
import { disposeObject } from '../lib/organizer'
import type { GadgetGeometryData } from '../types'

function GadgetModel({ data }: { data: GadgetGeometryData }) {
  const group = useMemo(() => createGadgetGroup(data), [data])
  useEffect(() => () => disposeObject(group), [group])
  return <primitive object={group} />
}

export function GadgetScene({ data, resetSignal }: { data: GadgetGeometryData; resetSignal: number }) {
  const size = Math.max(data.width, data.depth, data.height, 100)
  return (
    <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#141512']} />
      <fog attach="fog" args={['#141512', size * 1.6, size * 3.2]} />
      <PerspectiveCamera key={`gadget-camera-${resetSignal}`} makeDefault position={[size * 1.15, size * 1.2, size * 1.35]} fov={42} near={0.1} far={size * 12} />
      <OrbitControls key={`gadget-controls-${resetSignal}`} makeDefault target={[0, data.height * 0.42, 0]} minDistance={size * 0.3} maxDistance={size * 4} maxPolarAngle={Math.PI / 2.03} enableDamping dampingFactor={0.07} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[size * 0.8, size * 1.3, size * 0.5]} intensity={2.7} castShadow shadow-mapSize={[2048, 2048]} />
      <GadgetModel data={data} />
      <ContactShadows position={[0, -0.12, 0]} opacity={0.5} scale={size * 2.5} blur={2.6} far={size} />
      <Grid position={[0, -0.2, 0]} args={[size * 2.6, size * 2.6]} cellSize={10} cellThickness={0.5} cellColor="#30322b" sectionSize={50} sectionThickness={0.8} sectionColor="#3c4034" fadeDistance={size * 1.4} infiniteGrid />
    </Canvas>
  )
}
