import { ContactShadows, Edges, Grid, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { createBinGeometries } from '../lib/organizer'
import type { OrganizerBin, OrganizerSettings } from '../types'

function BinModel({ bin, settings, color, showLabel }: { bin: OrganizerBin; settings: OrganizerSettings; color: string; showLabel: boolean }) {
  const geometries = useMemo(() => createBinGeometries(bin, settings), [bin, settings])
  useEffect(() => () => {
    geometries.bottom.dispose()
    geometries.walls.dispose()
  }, [geometries])
  return (
    <group position={[bin.x, 0, bin.z]}>
      <mesh geometry={geometries.bottom} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.64} metalness={0.04} />
      </mesh>
      <mesh geometry={geometries.walls} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.58} metalness={0.04} side={THREE.DoubleSide} />
      </mesh>
      {showLabel && (
        <Html position={[0, settings.bottomThickness + 0.3, 0]} center distanceFactor={Math.max(settings.drawerWidth, settings.drawerDepth) * 0.8}>
          <span className="bin-label">{bin.id}</span>
        </Html>
      )}
    </group>
  )
}

function DrawerGuide({ settings }: { settings: OrganizerSettings }) {
  return (
    <mesh position={[0, -0.65, 0]} receiveShadow>
      <boxGeometry args={[settings.drawerWidth, 1, settings.drawerDepth]} />
      <meshStandardMaterial color="#252622" transparent opacity={0.45} roughness={0.9} />
      <Edges color="#666a5d" threshold={15} />
    </mesh>
  )
}

export function OrganizerScene({ bins, settings, resetSignal }: { bins: OrganizerBin[]; settings: OrganizerSettings; resetSignal: number }) {
  const size = Math.max(settings.drawerWidth, settings.drawerDepth)
  const colors = ['#b9ed3f', '#a9db39', '#c8ef66', '#94c632', '#d4f486']
  return (
    <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#141512']} />
      <fog attach="fog" args={['#141512', size * 1.5, size * 3]} />
      <PerspectiveCamera key={`organizer-camera-${resetSignal}`} makeDefault position={[size * 0.85, size * 1.05, size * 0.9]} fov={42} near={0.1} far={size * 12} />
      <OrbitControls key={`organizer-controls-${resetSignal}`} makeDefault target={[0, settings.binHeight * 0.18, 0]} minDistance={size * 0.3} maxDistance={size * 4} maxPolarAngle={Math.PI / 2.04} enableDamping dampingFactor={0.07} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[size * 0.8, size * 1.2, size * 0.5]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} />
      <DrawerGuide settings={settings} />
      {bins.map((bin, index) => <BinModel key={bin.id} bin={bin} settings={settings} color={colors[index % colors.length]} showLabel={bins.length <= 16} />)}
      <ContactShadows position={[0, -0.12, 0]} opacity={0.48} scale={size * 2.2} blur={2.6} far={settings.binHeight * 4} />
      <Grid position={[0, -0.2, 0]} args={[size * 2.4, size * 2.4]} cellSize={20} cellThickness={0.5} cellColor="#30322b" sectionSize={100} sectionThickness={0.8} sectionColor="#3c4034" fadeDistance={size * 1.35} infiniteGrid />
    </Canvas>
  )
}
