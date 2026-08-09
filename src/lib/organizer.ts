import * as THREE from 'three'
import type { OrganizerBin, OrganizerSettings } from '../types'

interface Rect {
  x: number
  z: number
  width: number
  depth: number
}

function gridBins(settings: OrganizerSettings): Rect[] {
  const usableWidth = settings.drawerWidth - settings.outerGap * 2
  const usableDepth = settings.drawerDepth - settings.outerGap * 2
  const binWidth = (usableWidth - settings.innerGap * (settings.columns - 1)) / settings.columns
  const binDepth = (usableDepth - settings.innerGap * (settings.rows - 1)) / settings.rows

  return Array.from({ length: settings.rows * settings.columns }, (_, index) => {
    const row = Math.floor(index / settings.columns)
    const column = index % settings.columns
    return {
      x: -usableWidth / 2 + binWidth / 2 + column * (binWidth + settings.innerGap),
      z: -usableDepth / 2 + binDepth / 2 + row * (binDepth + settings.innerGap),
      width: binWidth,
      depth: binDepth,
    }
  })
}

function splitRect(rect: Rect, settings: OrganizerSettings): Rect[] {
  const availableWidth = rect.width - settings.innerGap
  const leftWidth = availableWidth * settings.widthSplit
  const rightWidth = availableWidth - leftWidth
  const leftX = rect.x - rect.width / 2 + leftWidth / 2
  const rightX = rect.x + rect.width / 2 - rightWidth / 2
  const result: Rect[] = []

  for (const column of [
    { x: leftX, width: leftWidth, depthRatio: settings.depthSplit },
    { x: rightX, width: rightWidth, depthRatio: 1 - settings.depthSplit },
  ]) {
    const availableDepth = rect.depth - settings.innerGap
    const firstDepth = availableDepth * column.depthRatio
    const secondDepth = availableDepth - firstDepth
    result.push({
      x: column.x,
      z: rect.z - rect.depth / 2 + firstDepth / 2,
      width: column.width,
      depth: firstDepth,
    })
    result.push({
      x: column.x,
      z: rect.z + rect.depth / 2 - secondDepth / 2,
      width: column.width,
      depth: secondDepth,
    })
  }
  return result
}

function recursiveBins(settings: OrganizerSettings): Rect[] {
  let bins: Rect[] = [{
    x: 0,
    z: 0,
    width: settings.drawerWidth - settings.outerGap * 2,
    depth: settings.drawerDepth - settings.outerGap * 2,
  }]
  for (let iteration = 0; iteration < settings.iterations; iteration += 1) {
    bins = bins.flatMap((bin) => splitRect(bin, settings))
  }
  return bins
}

export function generateOrganizer(settings: OrganizerSettings): OrganizerBin[] {
  const bins = settings.layout === 'grid' ? gridBins(settings) : recursiveBins(settings)
  return bins.map((bin, index) => ({ ...bin, id: index + 1 }))
}

function roundedRectShape(width: number, depth: number, radius: number) {
  const shape = new THREE.Shape()
  const halfWidth = width / 2
  const halfDepth = depth / 2
  const r = Math.max(0.01, Math.min(radius, halfWidth - 0.01, halfDepth - 0.01))
  shape.moveTo(-halfWidth + r, -halfDepth)
  shape.lineTo(halfWidth - r, -halfDepth)
  shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + r)
  shape.lineTo(halfWidth, halfDepth - r)
  shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - r, halfDepth)
  shape.lineTo(-halfWidth + r, halfDepth)
  shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - r)
  shape.lineTo(-halfWidth, -halfDepth + r)
  shape.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + r, -halfDepth)
  return shape
}

function extrudeShape(shape: THREE.Shape, height: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 10,
    steps: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function createBinGeometries(bin: OrganizerBin, settings: OrganizerSettings) {
  const radius = Math.min(settings.cornerRadius, bin.width * 0.25, bin.depth * 0.25)
  const bottomShape = roundedRectShape(bin.width, bin.depth, radius)
  const bottom = extrudeShape(bottomShape, settings.bottomThickness)

  const wallShape = roundedRectShape(bin.width, bin.depth, radius)
  const innerWidth = Math.max(0.2, bin.width - settings.wallThickness * 2)
  const innerDepth = Math.max(0.2, bin.depth - settings.wallThickness * 2)
  const innerRadius = Math.max(0.01, radius - settings.wallThickness)
  const hole = roundedRectShape(innerWidth, innerDepth, innerRadius)
  wallShape.holes.push(hole)
  const walls = extrudeShape(wallShape, Math.max(0.2, settings.binHeight - settings.bottomThickness))
  walls.translate(0, settings.bottomThickness, 0)
  return { bottom, walls }
}

export function createBinGroup(bin: OrganizerBin, settings: OrganizerSettings, atOrigin = false) {
  const group = new THREE.Group()
  const { bottom, walls } = createBinGeometries(bin, settings)
  const material = new THREE.MeshStandardMaterial({ color: 0xb9ed3f, roughness: 0.64 })
  const bottomMesh = new THREE.Mesh(bottom, material)
  const wallMesh = new THREE.Mesh(walls, material)
  group.add(bottomMesh, wallMesh)
  if (!atOrigin) group.position.set(bin.x, 0, bin.z)
  group.updateMatrixWorld(true)
  return group
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => material.dispose())
    }
  })
}
