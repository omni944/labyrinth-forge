import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import type { MazeGeometryData, MazeSettings } from '../types'

function buildExportGroup(data: MazeGeometryData, settings: MazeSettings) {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, roughness: 0.72 })
  const floorGeometry = new THREE.BoxGeometry(data.width, settings.floorThickness, data.depth)
  const floor = new THREE.Mesh(floorGeometry, material)
  floor.position.y = settings.floorThickness / 2
  group.add(floor)

  for (const wall of data.walls) {
    const geometry = new THREE.BoxGeometry(wall.width, settings.wallHeight, wall.depth)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(wall.x, settings.floorThickness + settings.wallHeight / 2, wall.z)
    group.add(mesh)
  }
  group.updateMatrixWorld(true)
  return group
}

function download(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000)
}

function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    }
  })
}

export function exportSTL(data: MazeGeometryData, settings: MazeSettings) {
  const group = buildExportGroup(data, settings)
  const result = new STLExporter().parse(group, { binary: true })
  download(new Blob([result], { type: 'model/stl' }), `labyrinth-${settings.seed}.stl`)
  disposeGroup(group)
}

export async function exportGLB(data: MazeGeometryData, settings: MazeSettings) {
  const group = buildExportGroup(data, settings)
  const exporter = new GLTFExporter()
  try {
    const result = await exporter.parseAsync(group, { binary: true, onlyVisible: true })
    download(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }), `labyrinth-${settings.seed}.glb`)
  } finally {
    disposeGroup(group)
  }
}
