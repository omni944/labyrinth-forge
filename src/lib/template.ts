import * as THREE from 'three'
import type { TemplateGeometryData, TemplateHole, TemplatePoint, TemplateSettings } from '../types'

function rectangleOutline(width: number, depth: number): TemplatePoint[] {
  const halfWidth = width / 2
  const halfDepth = depth / 2
  return [
    { x: -halfWidth, z: -halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth },
    { x: -halfWidth, z: halfDepth },
  ]
}

function evenlySpaced(count: number, start: number, end: number) {
  if (count <= 1) return [(start + end) / 2]
  return Array.from({ length: count }, (_, index) => start + (index / (count - 1)) * (end - start))
}

function gridHoles(settings: TemplateSettings): TemplateHole[] {
  const xValues = evenlySpaced(
    settings.gridColumns,
    -settings.plateWidth / 2 + settings.edgeMargin,
    settings.plateWidth / 2 - settings.edgeMargin,
  )
  const zValues = evenlySpaced(
    settings.gridRows,
    -settings.plateDepth / 2 + settings.edgeMargin,
    settings.plateDepth / 2 - settings.edgeMargin,
  )
  return zValues.flatMap((z) => xValues.map((x) => ({ x, z, diameter: settings.holeDiameter })))
}

function shelfPinHoles(settings: TemplateSettings): TemplateHole[] {
  const availableDepth = Math.max(0, settings.plateDepth - settings.edgeMargin * 2)
  const actualCount = Math.max(1, Math.min(settings.pinCount, Math.floor(availableDepth / settings.pinSpacing) + 1))
  const usedDepth = (actualCount - 1) * settings.pinSpacing
  const zValues = Array.from({ length: actualCount }, (_, index) => -usedDepth / 2 + index * settings.pinSpacing)
  const maxRowSpacing = Math.max(0, settings.plateWidth - settings.edgeMargin * 2)
  const rowSpacing = Math.min(settings.pinRowSpacing, maxRowSpacing)
  const xValues = settings.pinColumns === 1 ? [0] : [-rowSpacing / 2, rowSpacing / 2]
  return zValues.flatMap((z) => xValues.map((x) => ({ x, z, diameter: settings.holeDiameter })))
}

function radiusOutline(settings: TemplateSettings): TemplatePoint[] {
  const halfWidth = settings.plateWidth / 2
  const halfDepth = settings.plateDepth / 2
  const radius = Math.min(settings.cornerRadius, settings.plateWidth * 0.48, settings.plateDepth * 0.48)
  const centerX = halfWidth - radius
  const centerZ = halfDepth - radius
  const arc = Array.from({ length: 13 }, (_, index) => {
    const angle = (index / 12) * (Math.PI / 2)
    return { x: centerX + Math.cos(angle) * radius, z: centerZ + Math.sin(angle) * radius }
  })
  return [
    { x: -halfWidth, z: -halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth - radius },
    ...arc.slice(1),
    { x: -halfWidth, z: halfDepth },
  ]
}

function radiusMountingHoles(settings: TemplateSettings): TemplateHole[] {
  const halfWidth = settings.plateWidth / 2
  const halfDepth = settings.plateDepth / 2
  const margin = Math.min(settings.edgeMargin, halfWidth * 0.7, halfDepth * 0.7)
  return [
    { x: -halfWidth + margin, z: -halfDepth + margin, diameter: settings.mountingHoleDiameter },
    { x: halfWidth - margin, z: -halfDepth + margin, diameter: settings.mountingHoleDiameter },
    { x: -halfWidth + margin, z: halfDepth - margin, diameter: settings.mountingHoleDiameter },
  ]
}

export function generateTemplate(settings: TemplateSettings): TemplateGeometryData {
  if (settings.type === 'corner-radius') {
    return {
      width: settings.plateWidth,
      depth: settings.plateDepth,
      outline: radiusOutline(settings),
      holes: radiusMountingHoles(settings),
    }
  }
  return {
    width: settings.plateWidth,
    depth: settings.plateDepth,
    outline: rectangleOutline(settings.plateWidth, settings.plateDepth),
    holes: settings.type === 'drilling-grid' ? gridHoles(settings) : shelfPinHoles(settings),
  }
}

export function createTemplateGeometry(data: TemplateGeometryData, thickness: number) {
  const shape = new THREE.Shape()
  shape.moveTo(data.outline[0].x, data.outline[0].z)
  data.outline.slice(1).forEach((point) => shape.lineTo(point.x, point.z))
  shape.closePath()
  data.holes.forEach((hole) => {
    const path = new THREE.Path()
    path.absarc(hole.x, hole.z, hole.diameter / 2, 0, Math.PI * 2, false)
    shape.holes.push(path)
  })
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 20,
    steps: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function createTemplateGroup(data: TemplateGeometryData, settings: TemplateSettings) {
  const group = new THREE.Group()
  const geometry = createTemplateGeometry(data, settings.plateThickness)
  const material = new THREE.MeshStandardMaterial({ color: 0xb9ed3f, roughness: 0.62 })
  group.add(new THREE.Mesh(geometry, material))
  group.updateMatrixWorld(true)
  return group
}

function pair(code: number, value: string | number) {
  return `${code}\n${value}\n`
}

export function buildTemplateDXF(data: TemplateGeometryData) {
  let dxf = pair(0, 'SECTION') + pair(2, 'HEADER')
  dxf += pair(9, '$INSUNITS') + pair(70, 4)
  dxf += pair(0, 'ENDSEC') + pair(0, 'SECTION') + pair(2, 'ENTITIES')
  dxf += pair(0, 'LWPOLYLINE') + pair(8, 'OUTLINE') + pair(90, data.outline.length) + pair(70, 1)
  data.outline.forEach((point) => {
    dxf += pair(10, point.x.toFixed(4)) + pair(20, point.z.toFixed(4))
  })
  data.holes.forEach((hole) => {
    dxf += pair(0, 'CIRCLE') + pair(8, 'DRILLING')
    dxf += pair(10, hole.x.toFixed(4)) + pair(20, hole.z.toFixed(4)) + pair(40, (hole.diameter / 2).toFixed(4))
  })
  dxf += pair(0, 'ENDSEC') + pair(0, 'EOF')
  return dxf
}

export function downloadTemplateDXF(data: TemplateGeometryData, settings: TemplateSettings) {
  const blob = new Blob([buildTemplateDXF(data)], { type: 'application/dxf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sablona-${settings.type}.dxf`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
