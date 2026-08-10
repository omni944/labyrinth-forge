import * as THREE from 'three'
import type { TemplateGeometryData, TemplateHole, TemplatePoint, TemplateSettings, TemplateSlot } from '../types'

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

function skadisSlots(settings: TemplateSettings): TemplateSlot[] {
  const minX = -settings.plateWidth / 2 + settings.edgeMargin
  const maxX = settings.plateWidth / 2 - settings.edgeMargin
  const minZ = -settings.plateDepth / 2 + settings.edgeMargin
  const maxZ = settings.plateDepth / 2 - settings.edgeMargin
  const columnCount = Math.max(1, Math.floor((maxX - minX) / settings.skadisSpacingX) + 1)
  const usedWidth = (columnCount - 1) * settings.skadisSpacingX
  const startX = -usedWidth / 2
  const slots: TemplateSlot[] = []
  for (let column = 0; column < columnCount; column += 1) {
    const x = startX + column * settings.skadisSpacingX
    const offset = column % 2 === 1 ? settings.skadisStagger : 0
    for (let z = minZ + offset; z <= maxZ + 0.001; z += settings.skadisSpacingZ) {
      slots.push({
        x,
        z,
        width: settings.skadisSlotWidth,
        height: settings.skadisSlotHeight,
        radius: Math.min(settings.skadisSlotWidth / 2, settings.skadisSlotHeight / 2),
      })
    }
  }
  return slots
}

export function generateTemplate(settings: TemplateSettings): TemplateGeometryData {
  if (settings.type === 'corner-radius') {
    return {
      width: settings.plateWidth,
      depth: settings.plateDepth,
      outline: radiusOutline(settings),
      holes: radiusMountingHoles(settings),
      slots: [],
    }
  }
  return {
    width: settings.plateWidth,
    depth: settings.plateDepth,
    outline: rectangleOutline(settings.plateWidth, settings.plateDepth),
    holes: settings.type === 'drilling-grid' ? gridHoles(settings) : settings.type === 'shelf-pins' ? shelfPinHoles(settings) : [],
    slots: settings.type === 'skadis' ? skadisSlots(settings) : [],
  }
}

function roundedSlotPath(slot: TemplateSlot) {
  const path = new THREE.Path()
  const halfWidth = slot.width / 2
  const halfHeight = slot.height / 2
  const radius = Math.min(slot.radius, halfWidth, halfHeight)
  path.moveTo(slot.x - halfWidth + radius, slot.z - halfHeight)
  path.lineTo(slot.x + halfWidth - radius, slot.z - halfHeight)
  path.quadraticCurveTo(slot.x + halfWidth, slot.z - halfHeight, slot.x + halfWidth, slot.z - halfHeight + radius)
  path.lineTo(slot.x + halfWidth, slot.z + halfHeight - radius)
  path.quadraticCurveTo(slot.x + halfWidth, slot.z + halfHeight, slot.x + halfWidth - radius, slot.z + halfHeight)
  path.lineTo(slot.x - halfWidth + radius, slot.z + halfHeight)
  path.quadraticCurveTo(slot.x - halfWidth, slot.z + halfHeight, slot.x - halfWidth, slot.z + halfHeight - radius)
  path.lineTo(slot.x - halfWidth, slot.z - halfHeight + radius)
  path.quadraticCurveTo(slot.x - halfWidth, slot.z - halfHeight, slot.x - halfWidth + radius, slot.z - halfHeight)
  path.closePath()
  return path
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
  data.slots.forEach((slot) => shape.holes.push(roundedSlotPath(slot)))
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

function slotOutline(slot: TemplateSlot): TemplatePoint[] {
  const halfWidth = slot.width / 2
  const halfHeight = slot.height / 2
  const radius = Math.min(slot.radius, halfWidth, halfHeight)
  const corners = [
    { cx: slot.x + halfWidth - radius, cz: slot.z - halfHeight + radius, start: -Math.PI / 2 },
    { cx: slot.x + halfWidth - radius, cz: slot.z + halfHeight - radius, start: 0 },
    { cx: slot.x - halfWidth + radius, cz: slot.z + halfHeight - radius, start: Math.PI / 2 },
    { cx: slot.x - halfWidth + radius, cz: slot.z - halfHeight + radius, start: Math.PI },
  ]
  return corners.flatMap((corner) => Array.from({ length: 5 }, (_, index) => {
    const angle = corner.start + (index / 4) * (Math.PI / 2)
    return { x: corner.cx + Math.cos(angle) * radius, z: corner.cz + Math.sin(angle) * radius }
  }))
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
  data.slots.forEach((slot) => {
    const outline = slotOutline(slot)
    dxf += pair(0, 'LWPOLYLINE') + pair(8, 'SLOTS') + pair(90, outline.length) + pair(70, 1)
    outline.forEach((point) => {
      dxf += pair(10, point.x.toFixed(4)) + pair(20, point.z.toFixed(4))
    })
  })
  dxf += pair(0, 'ENDSEC') + pair(0, 'EOF')
  return dxf
}

function svgPath(outline: TemplatePoint[], offsetX: number, offsetZ: number) {
  return outline.map((point, index) => `${index === 0 ? 'M' : 'L'}${(point.x + offsetX).toFixed(4)} ${(point.z + offsetZ).toFixed(4)}`).join(' ') + ' Z'
}

export function buildTemplateSVG(data: TemplateGeometryData) {
  const offsetX = data.width / 2
  const offsetZ = data.depth / 2
  const outline = `<path d="${svgPath(data.outline, offsetX, offsetZ)}"/>`
  const holes = data.holes.map((hole) => `<circle cx="${(hole.x + offsetX).toFixed(4)}" cy="${(hole.z + offsetZ).toFixed(4)}" r="${(hole.diameter / 2).toFixed(4)}"/>`).join('')
  const slots = data.slots.map((slot) => `<rect x="${(slot.x + offsetX - slot.width / 2).toFixed(4)}" y="${(slot.z + offsetZ - slot.height / 2).toFixed(4)}" width="${slot.width.toFixed(4)}" height="${slot.height.toFixed(4)}" rx="${slot.radius.toFixed(4)}"/>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${data.width.toFixed(4)}mm" height="${data.depth.toFixed(4)}mm" viewBox="0 0 ${data.width.toFixed(4)} ${data.depth.toFixed(4)}"><g id="OUTLINE" fill="none" stroke="#000" stroke-width="0.2">${outline}</g><g id="DRILLING" fill="none" stroke="#000" stroke-width="0.2">${holes}</g><g id="SLOTS" fill="none" stroke="#000" stroke-width="0.2">${slots}</g></svg>`
}

export function downloadTemplateSVG(data: TemplateGeometryData, settings: TemplateSettings) {
  const blob = new Blob([buildTemplateSVG(data)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sablona-${settings.type}.svg`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
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
