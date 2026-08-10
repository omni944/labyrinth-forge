import * as THREE from 'three'
import type { GadgetGeometryData, GadgetPart, GadgetSettings, TemplateHole, TemplatePoint } from '../types'

function rectangle(width: number, depth: number, centerZ = 0): TemplatePoint[] {
  return [
    { x: -width / 2, z: centerZ - depth / 2 },
    { x: width / 2, z: centerZ - depth / 2 },
    { x: width / 2, z: centerZ + depth / 2 },
    { x: -width / 2, z: centerZ + depth / 2 },
  ]
}

function basePart(name: string, outline: TemplatePoint[], thickness: number): GadgetPart {
  return { name, outline, holes: [], cutouts: [], thickness, position: [0, 0, 0], rotation: [0, 0, 0] }
}

function cableComb(settings: GadgetSettings): GadgetGeometryData {
  const halfWidth = settings.gadgetWidth / 2
  const halfDepth = settings.gadgetDepth / 2
  const usableWidth = settings.gadgetWidth * 0.82
  const centers = Array.from({ length: settings.cableSlotCount }, (_, index) =>
    settings.cableSlotCount === 1 ? 0 : -usableWidth / 2 + (index / (settings.cableSlotCount - 1)) * usableWidth,
  ).sort((a, b) => b - a)
  const outline: TemplatePoint[] = [
    { x: -halfWidth, z: -halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth },
  ]
  centers.forEach((center) => {
    const halfSlot = settings.cableSlotWidth / 2
    outline.push(
      { x: center + halfSlot, z: halfDepth },
      { x: center + halfSlot, z: halfDepth - settings.cableSlotDepth },
      { x: center - halfSlot, z: halfDepth - settings.cableSlotDepth },
      { x: center - halfSlot, z: halfDepth },
    )
  })
  outline.push({ x: -halfWidth, z: halfDepth })
  return {
    parts: [basePart('kabelovy-hreben', outline, settings.materialThickness)],
    width: settings.gadgetWidth,
    depth: settings.gadgetDepth,
    height: settings.materialThickness,
  }
}

function toolRack(settings: GadgetSettings): GadgetGeometryData {
  const part = basePart('stojan-na-nastroje', rectangle(settings.gadgetWidth, settings.gadgetDepth), settings.materialThickness)
  const xStart = -settings.gadgetWidth / 2 + settings.toolMargin
  const xEnd = settings.gadgetWidth / 2 - settings.toolMargin
  const zStart = -settings.gadgetDepth / 2 + settings.toolMargin
  const zEnd = settings.gadgetDepth / 2 - settings.toolMargin
  const positions = (count: number, start: number, end: number) => count === 1
    ? [(start + end) / 2]
    : Array.from({ length: count }, (_, index) => start + (index / (count - 1)) * (end - start))
  const xValues = positions(settings.toolColumns, xStart, xEnd)
  const zValues = positions(settings.toolRows, zStart, zEnd)
  part.holes = zValues.flatMap((z) => xValues.map((x): TemplateHole => ({ x, z, diameter: settings.toolHoleDiameter })))
  return {
    parts: [part],
    width: settings.gadgetWidth,
    depth: settings.gadgetDepth,
    height: settings.materialThickness,
  }
}

function phoneStand(settings: GadgetSettings): GadgetGeometryData {
  const tabWidth = settings.gadgetWidth * 0.68
  const lipWidth = settings.gadgetWidth * 0.55
  const tabDepth = settings.materialThickness * 2.2
  const slotDepth = settings.materialThickness + settings.fitClearance
  const frontZ = -settings.gadgetDepth * 0.34
  const base = basePart('zakladna', rectangle(settings.gadgetWidth, settings.gadgetDepth), settings.materialThickness)
  base.cutouts.push({ outline: rectangle(tabWidth, slotDepth, 0) })
  base.cutouts.push({ outline: rectangle(lipWidth, slotDepth, frontZ) })

  const halfWidth = settings.gadgetWidth / 2
  const halfTab = tabWidth / 2
  const backOutline: TemplatePoint[] = [
    { x: -halfTab, z: -tabDepth },
    { x: halfTab, z: -tabDepth },
    { x: halfTab, z: 0 },
    { x: halfWidth, z: 0 },
    { x: halfWidth, z: settings.phoneBackHeight },
    { x: -halfWidth, z: settings.phoneBackHeight },
    { x: -halfWidth, z: 0 },
    { x: -halfTab, z: 0 },
  ]
  const back = basePart('operka', backOutline, settings.materialThickness)
  back.rotation = [-(settings.phoneAngle * Math.PI) / 180, 0, 0]
  back.position = [0, settings.materialThickness * 0.2, 0]

  const lipHeight = settings.deviceThickness + 18
  const halfLip = lipWidth / 2
  const lipOutline: TemplatePoint[] = [
    { x: -halfLip, z: -tabDepth },
    { x: halfLip, z: -tabDepth },
    { x: halfLip, z: lipHeight },
    { x: -halfLip, z: lipHeight },
  ]
  const lip = basePart('predni-doraz', lipOutline, settings.materialThickness)
  lip.rotation = [-Math.PI / 2, 0, 0]
  lip.position = [0, settings.materialThickness * 0.2, frontZ]

  // Průchodka nabíjecího kabelu mezi dorazem a opěrkou.
  base.holes.push({ x: 0, z: frontZ * 0.52, diameter: Math.max(8, settings.deviceThickness * 0.7) })
  return {
    parts: [base, back, lip],
    width: settings.gadgetWidth,
    depth: settings.gadgetDepth + settings.phoneBackHeight * Math.cos((settings.phoneAngle * Math.PI) / 180),
    height: settings.phoneBackHeight * Math.sin((settings.phoneAngle * Math.PI) / 180),
  }
}

function keyRack(settings: GadgetSettings): GadgetGeometryData {
  const halfWidth = settings.gadgetWidth / 2
  const halfDepth = settings.gadgetDepth / 2
  const usableWidth = settings.gadgetWidth * 0.72
  const centers = Array.from({ length: settings.cableSlotCount }, (_, index) =>
    settings.cableSlotCount === 1 ? 0 : -usableWidth / 2 + (index / (settings.cableSlotCount - 1)) * usableWidth,
  ).sort((a, b) => b - a)
  const outline: TemplatePoint[] = [
    { x: -halfWidth, z: halfDepth },
    { x: halfWidth, z: halfDepth },
    { x: halfWidth, z: -halfDepth },
  ]
  centers.forEach((center) => {
    const halfSlot = settings.cableSlotWidth / 2
    outline.push(
      { x: center + halfSlot, z: -halfDepth },
      { x: center + halfSlot, z: -halfDepth + settings.cableSlotDepth },
      { x: center - halfSlot, z: -halfDepth + settings.cableSlotDepth },
      { x: center - halfSlot, z: -halfDepth },
    )
  })
  outline.push({ x: -halfWidth, z: -halfDepth })
  const part = basePart('vesak-na-klice', outline, settings.materialThickness)
  part.holes = [-1, 1].map((direction) => ({
    x: direction * settings.gadgetWidth * 0.38,
    z: settings.gadgetDepth * 0.23,
    diameter: settings.mountingHoleDiameter,
  }))
  return {
    parts: [part],
    width: settings.gadgetWidth,
    depth: settings.gadgetDepth,
    height: settings.materialThickness,
  }
}

function batteryHolder(settings: GadgetSettings): GadgetGeometryData {
  const top = basePart('drzak-baterii-horni', rectangle(settings.gadgetWidth, settings.gadgetDepth), settings.materialThickness)
  const bottom = basePart('drzak-baterii-dno', rectangle(settings.gadgetWidth, settings.gadgetDepth), settings.baseThickness)
  const xStart = -settings.gadgetWidth / 2 + settings.toolMargin
  const xEnd = settings.gadgetWidth / 2 - settings.toolMargin
  const zStart = -settings.gadgetDepth / 2 + settings.toolMargin
  const zEnd = settings.gadgetDepth / 2 - settings.toolMargin
  const positions = (count: number, start: number, end: number) => count === 1
    ? [(start + end) / 2]
    : Array.from({ length: count }, (_, index) => start + (index / (count - 1)) * (end - start))
  const xValues = positions(settings.batteryColumns, xStart, xEnd)
  const zValues = positions(settings.batteryRows, zStart, zEnd)
  top.holes = zValues.flatMap((z) => xValues.map((x): TemplateHole => ({
    x,
    z,
    diameter: settings.batteryDiameter + settings.batteryClearance,
  })))
  top.position = [0, settings.baseThickness, 0]
  return {
    parts: [bottom, top],
    width: settings.gadgetWidth,
    depth: settings.gadgetDepth,
    height: settings.baseThickness + settings.materialThickness,
  }
}

function headphoneStand(settings: GadgetSettings): GadgetGeometryData {
  const tabDepth = settings.materialThickness * 2.2
  const slotDepth = settings.materialThickness + settings.fitClearance
  const headrestDepth = Math.min(35, settings.standHeight * 0.18)
  const halfStem = settings.stemWidth / 2
  const halfHeadrest = settings.headrestWidth / 2
  const base = basePart('sluchatka-zakladna', rectangle(settings.gadgetWidth, settings.gadgetDepth), settings.materialThickness)
  base.cutouts.push({ outline: rectangle(settings.stemWidth, slotDepth) })

  const uprightOutline: TemplatePoint[] = [
    { x: -halfStem, z: -tabDepth },
    { x: halfStem, z: -tabDepth },
    { x: halfStem, z: settings.standHeight - headrestDepth },
    { x: halfHeadrest, z: settings.standHeight - headrestDepth },
    { x: halfHeadrest, z: settings.standHeight },
    { x: -halfHeadrest, z: settings.standHeight },
    { x: -halfHeadrest, z: settings.standHeight - headrestDepth },
    { x: -halfStem, z: settings.standHeight - headrestDepth },
  ]
  const upright = basePart('sluchatka-stojina', uprightOutline, settings.materialThickness)
  upright.rotation = [Math.PI / 2, 0, 0]
  upright.position = [0, settings.materialThickness * 0.2, 0]
  return {
    parts: [base, upright],
    width: Math.max(settings.gadgetWidth, settings.headrestWidth),
    depth: settings.gadgetDepth,
    height: settings.standHeight,
  }
}

export function generateGadget(settings: GadgetSettings): GadgetGeometryData {
  if (settings.type === 'cable-comb') return cableComb(settings)
  if (settings.type === 'tool-rack') return toolRack(settings)
  if (settings.type === 'phone-stand') return phoneStand(settings)
  if (settings.type === 'key-rack') return keyRack(settings)
  if (settings.type === 'battery-holder') return batteryHolder(settings)
  return headphoneStand(settings)
}

function pathFromOutline(outline: TemplatePoint[]) {
  const path = new THREE.Path()
  path.moveTo(outline[0].x, outline[0].z)
  outline.slice(1).forEach((point) => path.lineTo(point.x, point.z))
  path.closePath()
  return path
}

export function createGadgetPartGeometry(part: GadgetPart) {
  const shape = new THREE.Shape()
  shape.moveTo(part.outline[0].x, part.outline[0].z)
  part.outline.slice(1).forEach((point) => shape.lineTo(point.x, point.z))
  shape.closePath()
  part.holes.forEach((hole) => {
    const path = new THREE.Path()
    path.absarc(hole.x, hole.z, hole.diameter / 2, 0, Math.PI * 2, false)
    shape.holes.push(path)
  })
  part.cutouts.forEach((cutout) => shape.holes.push(pathFromOutline(cutout.outline)))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: part.thickness, bevelEnabled: false, curveSegments: 20, steps: 1 })
  geometry.rotateX(-Math.PI / 2)
  geometry.computeVertexNormals()
  return geometry
}

export function createGadgetGroup(data: GadgetGeometryData) {
  const group = new THREE.Group()
  const colors = [0xb9ed3f, 0xd3f47f, 0x98cc35]
  data.parts.forEach((part, index) => {
    const geometry = createGadgetPartGeometry(part)
    const material = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.62 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = part.name
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(...part.position)
    mesh.rotation.set(...part.rotation)
    group.add(mesh)
  })
  group.updateMatrixWorld(true)
  return group
}

function pair(code: number, value: string | number) {
  return `${code}\n${value}\n`
}

function bounds(outline: TemplatePoint[]) {
  return {
    minX: Math.min(...outline.map((point) => point.x)),
    maxX: Math.max(...outline.map((point) => point.x)),
    minZ: Math.min(...outline.map((point) => point.z)),
    maxZ: Math.max(...outline.map((point) => point.z)),
  }
}

export function buildGadgetDXF(data: GadgetGeometryData) {
  let dxf = pair(0, 'SECTION') + pair(2, 'HEADER') + pair(9, '$INSUNITS') + pair(70, 4)
  dxf += pair(0, 'ENDSEC') + pair(0, 'SECTION') + pair(2, 'ENTITIES')
  let cursorX = 0
  data.parts.forEach((part) => {
    const box = bounds(part.outline)
    const offsetX = cursorX - box.minX
    const offsetZ = -box.minZ
    const layer = part.name.toUpperCase().replaceAll('-', '_')
    dxf += pair(0, 'LWPOLYLINE') + pair(8, `${layer}_OUTLINE`) + pair(90, part.outline.length) + pair(70, 1)
    part.outline.forEach((point) => {
      dxf += pair(10, (point.x + offsetX).toFixed(4)) + pair(20, (point.z + offsetZ).toFixed(4))
    })
    part.cutouts.forEach((cutout) => {
      dxf += pair(0, 'LWPOLYLINE') + pair(8, `${layer}_CUTOUTS`) + pair(90, cutout.outline.length) + pair(70, 1)
      cutout.outline.forEach((point) => {
        dxf += pair(10, (point.x + offsetX).toFixed(4)) + pair(20, (point.z + offsetZ).toFixed(4))
      })
    })
    part.holes.forEach((hole) => {
      dxf += pair(0, 'CIRCLE') + pair(8, `${layer}_DRILLING`)
      dxf += pair(10, (hole.x + offsetX).toFixed(4)) + pair(20, (hole.z + offsetZ).toFixed(4)) + pair(40, (hole.diameter / 2).toFixed(4))
    })
    cursorX += box.maxX - box.minX + 20
  })
  return dxf + pair(0, 'ENDSEC') + pair(0, 'EOF')
}

function svgPath(outline: TemplatePoint[], offsetX: number, offsetZ: number) {
  return outline.map((point, index) => `${index === 0 ? 'M' : 'L'}${(point.x + offsetX).toFixed(4)} ${(point.z + offsetZ).toFixed(4)}`).join(' ') + ' Z'
}

export function buildGadgetSVG(data: GadgetGeometryData) {
  let cursorX = 0
  let maxDepth = 0
  const elements: string[] = []
  data.parts.forEach((part) => {
    const box = bounds(part.outline)
    const offsetX = cursorX - box.minX
    const offsetZ = -box.minZ
    const layer = part.name.toUpperCase().replaceAll('-', '_')
    elements.push(`<g id="${layer}"><path class="outline" d="${svgPath(part.outline, offsetX, offsetZ)}"/>`)
    part.cutouts.forEach((cutout) => elements.push(`<path class="cutout" d="${svgPath(cutout.outline, offsetX, offsetZ)}"/>`))
    part.holes.forEach((hole) => elements.push(`<circle class="drilling" cx="${(hole.x + offsetX).toFixed(4)}" cy="${(hole.z + offsetZ).toFixed(4)}" r="${(hole.diameter / 2).toFixed(4)}"/>`))
    elements.push('</g>')
    cursorX += box.maxX - box.minX + 20
    maxDepth = Math.max(maxDepth, box.maxZ - box.minZ)
  })
  const width = Math.max(1, cursorX - 20)
  const depth = Math.max(1, maxDepth)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(4)}mm" height="${depth.toFixed(4)}mm" viewBox="0 0 ${width.toFixed(4)} ${depth.toFixed(4)}"><style>.outline,.cutout,.drilling{fill:none;stroke:#000;stroke-width:.2}</style>${elements.join('')}</svg>`
}

export function downloadGadgetDXF(data: GadgetGeometryData, settings: GadgetSettings) {
  const blob = new Blob([buildGadgetDXF(data)], { type: 'application/dxf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `gadget-${settings.type}.dxf`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function downloadGadgetSVG(data: GadgetGeometryData, settings: GadgetSettings) {
  const blob = new Blob([buildGadgetSVG(data)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `gadget-${settings.type}.svg`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
