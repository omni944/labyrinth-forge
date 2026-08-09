import { ContactShadows, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { MazeGeometryData, MazeSettings } from '../types'

interface MazeSceneProps {
  data: MazeGeometryData
  settings: MazeSettings
  wallColor: string
  resetSignal: number
}

function Model({ data, settings, wallColor }: Omit<MazeSceneProps, 'resetSignal'>) {
  const wallGeometry = useMemo(() => {
    const geometries = data.walls.map((wall) => {
      const geometry = new THREE.BoxGeometry(wall.width, settings.wallHeight, wall.depth)
      geometry.translate(wall.x, settings.floorThickness + settings.wallHeight / 2, wall.z)
      return geometry
    })
    const merged = mergeGeometries(geometries)
    geometries.forEach((geometry) => geometry.dispose())
    return merged
  }, [data, settings.floorThickness, settings.wallHeight])

  useEffect(() => () => wallGeometry?.dispose(), [wallGeometry])

  const entranceX = -data.width / 2 + settings.cellSize / 2
  const entranceZ = -data.depth / 2 + settings.cellSize / 2
  const exitX = data.width / 2 - settings.cellSize / 2
  const exitZ = data.depth / 2 - settings.cellSize / 2

  return (
    <group>
      <mesh position={[0, settings.floorThickness / 2, 0]} receiveShadow>
        <boxGeometry args={[data.width, settings.floorThickness, data.depth]} />
        <meshStandardMaterial color="#252622" roughness={0.86} metalness={0.05} />
      </mesh>
      {wallGeometry && (
        <mesh geometry={wallGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={wallColor} roughness={0.58} metalness={0.08} />
        </mesh>
      )}
      <mesh position={[entranceX, settings.floorThickness + 0.28, entranceZ]}>
        <cylinderGeometry args={[settings.cellSize * 0.14, settings.cellSize * 0.14, 0.5, 28]} />
        <meshStandardMaterial color="#e9ff9a" emissive="#b6ef31" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[exitX, settings.floorThickness + 0.28, exitZ]}>
        <cylinderGeometry args={[settings.cellSize * 0.14, settings.cellSize * 0.14, 0.5, 28]} />
        <meshStandardMaterial color="#ff8066" emissive="#ff4c35" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

function CameraControls({ data, resetSignal }: Pick<MazeSceneProps, 'data' | 'resetSignal'>) {
  const targetSize = Math.max(data.width, data.depth)
  return (
    <>
      <PerspectiveCamera
        key={`camera-${resetSignal}`}
        makeDefault
        position={[targetSize * 0.75, targetSize * 0.95, targetSize * 0.75]}
        fov={42}
        near={0.1}
        far={targetSize * 12}
      />
      <OrbitControls
        key={`controls-${resetSignal}`}
        makeDefault
        target={[0, 0, 0]}
        minDistance={targetSize * 0.25}
        maxDistance={targetSize * 4}
        maxPolarAngle={Math.PI / 2.03}
        enableDamping
        dampingFactor={0.07}
      />
    </>
  )
}

export function MazeScene(props: MazeSceneProps) {
  const gridSize = Math.max(props.data.width, props.data.depth) * 2.4
  return (
    <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#141512']} />
      <fog attach="fog" args={['#141512', gridSize * 0.65, gridSize * 1.4]} />
      <CameraControls data={props.data} resetSignal={props.resetSignal} />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[props.data.width * 0.7, props.data.width, props.data.depth * 0.4]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Model data={props.data} settings={props.settings} wallColor={props.wallColor} />
      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.46}
        scale={gridSize}
        blur={2.4}
        far={props.settings.wallHeight * 5}
      />
      <Grid
        position={[0, -0.12, 0]}
        args={[gridSize, gridSize]}
        cellSize={props.settings.cellSize}
        cellThickness={0.55}
        cellColor="#30322b"
        sectionSize={props.settings.cellSize * 5}
        sectionThickness={0.8}
        sectionColor="#3c4034"
        fadeDistance={gridSize * 0.65}
        infiniteGrid
      />
    </Canvas>
  )
}
