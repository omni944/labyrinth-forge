import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import helvetikerBold from 'three/examples/fonts/helvetiker_bold.typeface.json'
import polygonClipping, { type MultiPolygon, type Polygon } from 'polygon-clipping'
import type { GadgetGeometryData, GadgetPart, GadgetPrimitive, GadgetSettings, TemplateHole, TemplatePoint } from '../types'

const ornamentFont = new FontLoader().parse(helvetikerBold)
const { difference: polygonDifference, union: polygonUnion } = polygonClipping

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

function radialOutline(radius: number, count: number, innerRatio = 1, centerX = 0, centerZ = 0, rotation = Math.PI / 2): TemplatePoint[] {
  return Array.from({ length: count }, (_, index) => {
    const pointRadius = index % 2 === 0 ? radius : radius * innerRatio
    const angle = rotation - (index / count) * Math.PI * 2
    return { x: centerX + Math.cos(angle) * pointRadius, z: centerZ + Math.sin(angle) * pointRadius }
  })
}

function closedPolygon(outline: TemplatePoint[]): Polygon {
  const ring: [number, number][] = outline.map((point) => [point.x, point.z])
  ring.push([...ring[0]])
  return [ring]
}

function circlePolygon(radius: number, centerX = 0, centerZ = 0, segments = 72) {
  return closedPolygon(radialOutline(radius, segments, 1, centerX, centerZ))
}

function rectanglePolygon(width: number, height: number, centerX: number, centerZ: number, rotation = 0) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const cosine = Math.cos(rotation)
  const sine = Math.sin(rotation)
  const outline = [
    { x: -halfWidth, z: -halfHeight },
    { x: halfWidth, z: -halfHeight },
    { x: halfWidth, z: halfHeight },
    { x: -halfWidth, z: halfHeight },
  ].map((point) => ({
    x: centerX + point.x * cosine - point.z * sine,
    z: centerZ + point.x * sine + point.z * cosine,
  }))
  return closedPolygon(outline)
}

function polygonParts(name: string, geometry: MultiPolygon, thickness: number): GadgetPart[] {
  return geometry.map((polygon, index) => ({
    name: geometry.length === 1 ? name : `${name}-${index + 1}`,
    outline: polygon[0].slice(0, -1).map(([x, z]) => ({ x, z })),
    holes: [],
    cutouts: polygon.slice(1).map((ring) => ({ outline: ring.slice(0, -1).map(([x, z]) => ({ x, z })) })),
    thickness,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    operation: 'cut',
  }))
}

export function normalizeOrnamentName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14) || 'ANNA'
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
    primitives: [],
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
    primitives: [],
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
    primitives: [],
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
    primitives: [],
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
    primitives: [],
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
    primitives: [],
    width: Math.max(settings.gadgetWidth, settings.headrestWidth),
    depth: settings.gadgetDepth,
    height: settings.standHeight,
  }
}

function boxPrimitive(name: string, size: [number, number, number], position: [number, number, number]): GadgetPrimitive {
  return { name, kind: 'box', size, position, rotation: [0, 0, 0] }
}

function profilePrimitive(name: string, outline: TemplatePoint[], extrusion: number, position: [number, number, number]): GadgetPrimitive {
  return { name, kind: 'profile', outline, extrusion, position, rotation: [0, 0, 0] }
}

function skadisMount(settings: GadgetSettings, width: number, mountCount: 1 | 2) {
  const bodyHeight = Math.max(50, settings.skadisSlotHeight + 32)
  const connectorWidth = Math.max(2.4, settings.skadisSlotWidth - settings.fitClearance)
  const neckHeight = Math.max(3.2, Math.min(4.6, settings.skadisSlotHeight * 0.28))
  const lockDrop = Math.max(11, settings.skadisSlotHeight - 1)
  const lockThickness = Math.max(3.2, settings.materialThickness * 0.8)
  const behindPanel = settings.skadisPanelThickness + settings.skadisBackClearance
  const bodyOverlap = 1
  const hookTopY = bodyHeight - 3
  const stabilizerY = hookTopY - 40
  const mountSpacing = Math.min(settings.skadisMountSpacing, Math.max(20, width - connectorWidth - 8))
  const xValues = mountCount === 1 ? [0] : [-mountSpacing / 2, mountSpacing / 2]
  const primitives: GadgetPrimitive[] = [
    boxPrimitive('skadis-predni-deska', [width, bodyHeight, settings.materialThickness], [0, bodyHeight / 2, settings.materialThickness / 2]),
  ]
  xValues.forEach((x, index) => {
    const hookProfile: TemplatePoint[] = [
      { x: bodyOverlap, z: hookTopY },
      { x: -behindPanel - lockThickness, z: hookTopY },
      { x: -behindPanel - lockThickness, z: hookTopY - neckHeight * 0.75 },
      { x: -behindPanel - lockThickness * 0.82, z: hookTopY - lockDrop * 0.48 },
      { x: -behindPanel - lockThickness * 0.42, z: hookTopY - lockDrop },
      { x: -behindPanel, z: hookTopY - lockDrop },
      { x: -behindPanel, z: hookTopY - neckHeight },
      { x: bodyOverlap, z: hookTopY - neckHeight },
    ]
    primitives.push(
      profilePrimitive(`skadis-nosny-hak-${index + 1}`, hookProfile, connectorWidth, [x, 0, 0]),
      boxPrimitive(`skadis-stabilizator-${index + 1}`, [connectorWidth, Math.max(5, settings.skadisSlotHeight * 0.42), behindPanel + bodyOverlap], [x, stabilizerY, (bodyOverlap - behindPanel) / 2]),
    )
  })
  return { primitives, bodyHeight, lockThickness, behindPanel }
}

function skadisHook(settings: GadgetSettings): GadgetGeometryData {
  const mount = skadisMount(settings, settings.gadgetWidth, 1)
  const armWidth = Math.max(10, Math.min(18, settings.gadgetWidth * 0.24))
  const armHeight = settings.materialThickness
  const armY = Math.max(12, mount.bodyHeight * 0.38)
  const tipHeight = Math.max(12, settings.materialThickness * 3)
  mount.primitives.push(
    boxPrimitive('skadis-hacek-rameno', [armWidth, armHeight, settings.gadgetDepth], [0, armY, settings.materialThickness + settings.gadgetDepth / 2 - 0.5]),
    boxPrimitive('skadis-hacek-doraz', [armWidth, tipHeight, settings.materialThickness], [0, armY + tipHeight / 2 - armHeight / 2, settings.materialThickness + settings.gadgetDepth - settings.materialThickness / 2 - 0.5]),
  )
  return {
    parts: [],
    primitives: mount.primitives,
    width: settings.gadgetWidth,
    depth: mount.behindPanel + mount.lockThickness + settings.materialThickness + settings.gadgetDepth,
    height: mount.bodyHeight,
  }
}

function skadisToolHolder(settings: GadgetSettings): GadgetGeometryData {
  const mount = skadisMount(settings, settings.gadgetWidth, 2)
  const shelf = basePart('skadis-drzak-nastroju', rectangle(settings.gadgetWidth, settings.gadgetDepth), settings.materialThickness)
  const usableWidth = Math.max(0, settings.gadgetWidth - settings.toolMargin * 2)
  const xValues = settings.toolColumns === 1
    ? [0]
    : Array.from({ length: settings.toolColumns }, (_, index) => -usableWidth / 2 + (index / (settings.toolColumns - 1)) * usableWidth)
  shelf.holes = xValues.map((x) => ({ x, z: 0, diameter: settings.toolHoleDiameter }))
  shelf.position = [0, Math.max(settings.materialThickness, mount.bodyHeight * 0.34), settings.materialThickness + settings.gadgetDepth / 2 - 0.5]
  return {
    parts: [shelf],
    primitives: mount.primitives,
    width: settings.gadgetWidth,
    depth: mount.behindPanel + mount.lockThickness + settings.materialThickness + settings.gadgetDepth,
    height: mount.bodyHeight,
  }
}

function skadisShelf(settings: GadgetSettings): GadgetGeometryData {
  const mount = skadisMount(settings, settings.gadgetWidth, 2)
  const shelfY = Math.max(settings.materialThickness / 2, mount.bodyHeight * 0.28)
  const lipHeight = Math.max(12, settings.materialThickness * 3)
  mount.primitives.push(
    boxPrimitive('skadis-policka-plocha', [settings.gadgetWidth, settings.materialThickness, settings.gadgetDepth], [0, shelfY, settings.materialThickness + settings.gadgetDepth / 2 - 0.5]),
    boxPrimitive('skadis-policka-celo', [settings.gadgetWidth, lipHeight, settings.materialThickness], [0, shelfY + lipHeight / 2 - settings.materialThickness / 2, settings.materialThickness + settings.gadgetDepth - settings.materialThickness / 2 - 0.5]),
  )
  return {
    parts: [],
    primitives: mount.primitives,
    width: settings.gadgetWidth,
    depth: mount.behindPanel + mount.lockThickness + settings.materialThickness + settings.gadgetDepth,
    height: mount.bodyHeight,
  }
}

function ornamentNamePolygons(name: string, targetWidth: number, targetHeight: number): Polygon[] {
  const shapes = ornamentFont.generateShapes(name, 100)
  const sampled = shapes.map((shape) => ({
    outline: shape.getPoints(8),
    holes: shape.holes.map((hole) => hole.getPoints(8)),
  }))
  const points = sampled.flatMap((shape) => shape.outline)
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minZ = Math.min(...points.map((point) => point.y))
  const maxZ = Math.max(...points.map((point) => point.y))
  const scaleZ = targetHeight / Math.max(1, maxZ - minZ)
  const scaleX = Math.min(scaleZ, targetWidth / Math.max(1, maxX - minX))
  const centerX = (minX + maxX) / 2
  const centerZ = (minZ + maxZ) / 2
  return sampled.map((shape) => {
    const rings = [shape.outline, ...shape.holes].map((ring) => {
      const points: [number, number][] = ring.map((point) => [(point.x - centerX) * scaleX, (point.y - centerZ) * scaleZ])
      points.push([...points[0]])
      return points
    })
    return rings
  })
}

function bellPolygon(centerX: number, centerZ: number, width: number, height: number) {
  const outline: TemplatePoint[] = [
    { x: centerX - width * 0.16, z: centerZ + height * 0.5 },
    { x: centerX + width * 0.16, z: centerZ + height * 0.5 },
    { x: centerX + width * 0.3, z: centerZ + height * 0.34 },
    { x: centerX + width * 0.4, z: centerZ - height * 0.28 },
    { x: centerX + width * 0.55, z: centerZ - height * 0.42 },
    { x: centerX - width * 0.55, z: centerZ - height * 0.42 },
    { x: centerX - width * 0.4, z: centerZ - height * 0.28 },
    { x: centerX - width * 0.3, z: centerZ + height * 0.34 },
  ]
  return closedPolygon(outline)
}

function leafPolygon(centerX: number, centerZ: number, length: number, width: number, rotation: number) {
  const cosine = Math.cos(rotation)
  const sine = Math.sin(rotation)
  return closedPolygon([
    { x: -length / 2, z: 0 },
    { x: 0, z: width / 2 },
    { x: length / 2, z: 0 },
    { x: 0, z: -width / 2 },
  ].map((point) => ({
    x: centerX + point.x * cosine - point.z * sine,
    z: centerZ + point.x * sine + point.z * cosine,
  })))
}

function hangingStarPolygons(xs: number[], startZ: number, endZ: number, radius: number, bridge: number): Polygon[] {
  return xs.flatMap((x, index) => {
    const centerZ = startZ + (endZ - startZ) * (index % 2 === 0 ? 0.52 : 0.68)
    return [
      rectanglePolygon(bridge, Math.abs(endZ - centerZ) + radius, x, (endZ + centerZ - Math.sign(endZ - centerZ) * radius) / 2),
      closedPolygon(radialOutline(radius, 10, 0.43, x, centerZ)),
    ]
  })
}

function christmasMotifPolygons(style: GadgetSettings['ornamentStyle'], innerRadius: number, nameHalfHeight: number, bridge: number): Polygon[] {
  const topStart = nameHalfHeight - bridge * 0.25
  const topEnd = innerRadius + bridge * 0.7
  const bottomStart = -nameHalfHeight + bridge * 0.25
  const bottomEnd = -innerRadius - bridge * 0.7
  const topSpace = topEnd - topStart
  const bottomSpace = bottomStart - bottomEnd
  const solids: Polygon[] = []

  if (style === 'snowflake') {
    const centerZ = (topStart + topEnd) / 2
    solids.push(rectanglePolygon(bridge, topSpace, 0, centerZ))
    solids.push(rectanglePolygon(bridge, topSpace * 0.88, 0, centerZ, Math.PI / 3))
    solids.push(rectanglePolygon(bridge, topSpace * 0.88, 0, centerZ, -Math.PI / 3))
    const starRadius = Math.min(innerRadius * 0.12, bottomSpace * 0.2)
    ;[-innerRadius * 0.47, 0, innerRadius * 0.47].forEach((x, index) => {
      const center = bottomStart - bottomSpace * (index === 1 ? 0.62 : 0.48)
      solids.push(rectanglePolygon(bridge, bottomStart - center + starRadius, x, (bottomStart + center - starRadius) / 2))
      solids.push(closedPolygon(radialOutline(starRadius, 10, 0.44, x, center)))
    })
  } else if (style === 'trees') {
    const starRadius = Math.min(innerRadius * 0.115, topSpace * 0.19)
    ;[-innerRadius * 0.46, 0, innerRadius * 0.46].forEach((x, index) => {
      const center = topStart + topSpace * (index === 1 ? 0.58 : 0.46)
      solids.push(rectanglePolygon(bridge, topEnd - center + starRadius, x, (topEnd + center - starRadius) / 2))
      solids.push(closedPolygon(radialOutline(starRadius, 10, 0.44, x, center)))
    })
    const treeHeight = bottomSpace * 0.92
    const treeWidth = innerRadius * 0.42
    ;[-innerRadius * 0.47, 0, innerRadius * 0.47].forEach((x) => {
      solids.push(rectanglePolygon(bridge, treeHeight, x, bottomStart - treeHeight / 2))
      ;[0.33, 0.58, 0.82].forEach((ratio, tier) => {
        const tierTop = bottomStart - treeHeight * (tier * 0.18 + 0.08)
        const tierWidth = treeWidth * ratio
        solids.push(closedPolygon([
          { x, z: tierTop + bridge * 0.65 },
          { x: x + tierWidth / 2, z: tierTop - treeHeight * 0.32 },
          { x: x - tierWidth / 2, z: tierTop - treeHeight * 0.32 },
        ]))
      })
    })
  } else if (style === 'bells') {
    const bellHeight = topSpace * 0.58
    const bellWidth = innerRadius * 0.43
    ;[-innerRadius * 0.27, innerRadius * 0.27].forEach((x) => {
      const center = topStart + topSpace * 0.47
      solids.push(rectanglePolygon(bridge, topEnd - center + bellHeight * 0.5, x, (topEnd + center - bellHeight * 0.5) / 2))
      solids.push(bellPolygon(x, center, bellWidth, bellHeight))
      solids.push(circlePolygon(bridge * 0.75, x, center - bellHeight * 0.5))
    })
    const baubleRadius = Math.min(innerRadius * 0.13, bottomSpace * 0.22)
    ;[-innerRadius * 0.47, 0, innerRadius * 0.47].forEach((x, index) => {
      const center = bottomStart - bottomSpace * (index === 1 ? 0.63 : 0.5)
      solids.push(rectanglePolygon(bridge, bottomStart - center + baubleRadius, x, (bottomStart + center - baubleRadius) / 2))
      solids.push(circlePolygon(baubleRadius, x, center))
    })
  } else if (style === 'reindeer') {
    const headZ = topStart + topSpace * 0.43
    const headRadius = topSpace * 0.19
    solids.push(rectanglePolygon(bridge, topSpace, 0, (topStart + topEnd) / 2))
    solids.push(circlePolygon(headRadius, 0, headZ))
    solids.push(circlePolygon(headRadius * 0.52, 0, headZ - headRadius * 0.72))
    ;[-1, 1].forEach((direction) => {
      solids.push(closedPolygon([
        { x: direction * headRadius * 0.62, z: headZ + headRadius * 0.35 },
        { x: direction * headRadius * 1.35, z: headZ + headRadius * 0.78 },
        { x: direction * headRadius * 0.72, z: headZ - headRadius * 0.02 },
      ]))
      solids.push(rectanglePolygon(bridge, topSpace * 0.48, direction * headRadius * 0.75, headZ + topSpace * 0.27, direction * 0.34))
      solids.push(rectanglePolygon(bridge, topSpace * 0.24, direction * headRadius * 1.3, headZ + topSpace * 0.38, direction * 0.92))
    })
    solids.push(...hangingStarPolygons([-innerRadius * 0.5, 0, innerRadius * 0.5], bottomStart, bottomEnd, bottomSpace * 0.16, bridge))
  } else if (style === 'village') {
    solids.push(...hangingStarPolygons([-innerRadius * 0.48, 0, innerRadius * 0.48], topEnd, topStart, topSpace * 0.14, bridge))
    const houseWidth = innerRadius * 0.38
    const houseHeight = bottomSpace * 0.43
    ;[-innerRadius * 0.48, 0, innerRadius * 0.48].forEach((x, index) => {
      const roofZ = bottomStart - bottomSpace * (index === 1 ? 0.3 : 0.22)
      solids.push(rectanglePolygon(bridge, bottomStart - bottomEnd, x, (bottomStart + bottomEnd) / 2))
      solids.push(rectanglePolygon(houseWidth, houseHeight, x, roofZ - houseHeight * 0.62))
      solids.push(closedPolygon([
        { x, z: roofZ + houseHeight * 0.28 },
        { x: x + houseWidth * 0.62, z: roofZ - houseHeight * 0.14 },
        { x: x - houseWidth * 0.62, z: roofZ - houseHeight * 0.14 },
      ]))
      solids.push(rectanglePolygon(bridge * 0.85, houseHeight * 0.55, x + houseWidth * 0.22, roofZ + houseHeight * 0.18))
    })
  } else if (style === 'holly') {
    const centerZ = topStart + topSpace * 0.52
    solids.push(rectanglePolygon(bridge, topSpace, 0, (topStart + topEnd) / 2))
    ;[-1, 1].forEach((direction) => {
      solids.push(rectanglePolygon(bridge, innerRadius * 0.88, direction * innerRadius * 0.18, centerZ, direction * 0.72))
      ;[-0.23, 0.12, 0.46].forEach((offset, index) => {
        solids.push(leafPolygon(direction * innerRadius * (0.18 + offset), centerZ + topSpace * offset, innerRadius * 0.34, topSpace * 0.26, direction * (index % 2 === 0 ? 0.38 : 1.03)))
      })
    })
    ;[-bridge * 1.15, 0, bridge * 1.15].forEach((x) => solids.push(circlePolygon(bridge * 0.82, x, centerZ - bridge * 0.4)))
    const baubleRadius = bottomSpace * 0.17
    ;[-innerRadius * 0.5, 0, innerRadius * 0.5].forEach((x, index) => {
      const center = bottomStart - bottomSpace * (index === 1 ? 0.66 : 0.5)
      solids.push(rectanglePolygon(bridge, bottomStart - center + baubleRadius, x, (bottomStart + center - baubleRadius) / 2))
      solids.push(circlePolygon(baubleRadius, x, center))
      solids.push(rectanglePolygon(baubleRadius * 1.3, bridge * 0.7, x, center))
    })
  } else if (style === 'angel') {
    const centerZ = topStart + topSpace * 0.48
    const headRadius = topSpace * 0.13
    solids.push(rectanglePolygon(bridge, topSpace, 0, (topStart + topEnd) / 2))
    solids.push(circlePolygon(headRadius, 0, centerZ + topSpace * 0.23))
    solids.push(closedPolygon([
      { x: 0, z: centerZ + topSpace * 0.15 },
      { x: innerRadius * 0.24, z: topStart - bridge * 0.2 },
      { x: -innerRadius * 0.24, z: topStart - bridge * 0.2 },
    ]))
    ;[-1, 1].forEach((direction) => solids.push(closedPolygon([
      { x: direction * bridge * 0.4, z: centerZ + topSpace * 0.08 },
      { x: direction * innerRadius * 0.58, z: centerZ + topSpace * 0.28 },
      { x: direction * innerRadius * 0.32, z: centerZ - topSpace * 0.2 },
    ])))
    solids.push(...hangingStarPolygons([-innerRadius * 0.5, 0, innerRadius * 0.5], bottomStart, bottomEnd, bottomSpace * 0.16, bridge))
  } else {
    const bowZ = topStart + topSpace * 0.52
    solids.push(rectanglePolygon(bridge, topSpace, 0, (topStart + topEnd) / 2))
    solids.push(leafPolygon(-innerRadius * 0.16, bowZ, innerRadius * 0.34, topSpace * 0.26, 0.22))
    solids.push(leafPolygon(innerRadius * 0.16, bowZ, innerRadius * 0.34, topSpace * 0.26, -0.22))
    solids.push(circlePolygon(bridge, 0, bowZ))
    solids.push(rectanglePolygon(bridge, topSpace * 0.46, -bridge * 0.7, bowZ - topSpace * 0.22, 0.18))
    solids.push(rectanglePolygon(bridge, topSpace * 0.46, bridge * 0.7, bowZ - topSpace * 0.22, -0.18))
    const giftWidth = innerRadius * 0.38
    const giftHeight = bottomSpace * 0.48
    ;[-innerRadius * 0.48, 0, innerRadius * 0.48].forEach((x, index) => {
      const center = bottomStart - bottomSpace * (index === 1 ? 0.62 : 0.5)
      solids.push(rectanglePolygon(bridge, bottomStart - center + giftHeight / 2, x, (bottomStart + center - giftHeight / 2) / 2))
      solids.push(rectanglePolygon(giftWidth, giftHeight, x, center))
      solids.push(rectanglePolygon(bridge, giftHeight, x, center))
      solids.push(rectanglePolygon(giftWidth * 1.08, bridge * 0.8, x, center + giftHeight * 0.18))
      solids.push(leafPolygon(x - bridge * 0.9, center + giftHeight * 0.55, bridge * 2.4, bridge * 1.25, 0.42))
      solids.push(leafPolygon(x + bridge * 0.9, center + giftHeight * 0.55, bridge * 2.4, bridge * 1.25, -0.42))
    })
  }
  return solids
}

function nameOrnament(settings: GadgetSettings): GadgetGeometryData {
  const size = settings.gadgetWidth
  const radius = size / 2
  const frame = Math.min(size * 0.14, Math.max(2.5, settings.ornamentFrameWidth))
  const bridge = Math.min(size * 0.1, Math.max(2.4, settings.ornamentBridgeWidth))
  const innerRadius = radius - frame
  const capWidth = size * 0.27
  const capHeight = size * 0.11
  const loopRadius = size * 0.09
  const loopCenterZ = radius + capHeight + loopRadius * 0.55

  const outerSolid = polygonUnion(
    circlePolygon(radius),
    rectanglePolygon(capWidth, capHeight + 2, 0, radius + capHeight / 2 - 1),
    circlePolygon(loopRadius, 0, loopCenterZ),
  )
  const frameGeometry = polygonDifference(outerSolid, circlePolygon(innerRadius))
  const nameHeight = size * 0.215
  const nameHalfHeight = nameHeight / 2
  const railWidth = innerRadius * 2 + frame * 1.2
  const name = normalizeOrnamentName(settings.ornamentName)
  const namePolygons = ornamentNamePolygons(name, innerRadius * 1.7, nameHeight + bridge * 0.5)
  const solids: Polygon[] = [
    rectanglePolygon(railWidth, bridge, 0, nameHalfHeight),
    rectanglePolygon(railWidth, bridge, 0, -nameHalfHeight),
    ...namePolygons,
    ...christmasMotifPolygons(settings.ornamentStyle, innerRadius, nameHalfHeight, bridge),
  ]
  let assembled = polygonUnion(frameGeometry, ...solids)

  const maximumHoleRadius = Math.max(1.5, loopRadius - bridge * 0.75)
  const hangingHoleRadius = Math.min(settings.ornamentHangingHole / 2, maximumHoleRadius)
  const capSlots = [-1, 0, 1].map((index) => rectanglePolygon(bridge * 0.55, capHeight * 0.52, index * capWidth * 0.23, radius + capHeight * 0.42))
  assembled = polygonDifference(assembled, circlePolygon(hangingHoleRadius, 0, loopCenterZ), ...capSlots)

  const allPoints = assembled.flatMap((polygon) => polygon[0])
  const minX = Math.min(...allPoints.map(([x]) => x))
  const maxX = Math.max(...allPoints.map(([x]) => x))
  const minZ = Math.min(...allPoints.map(([, z]) => z))
  const maxZ = Math.max(...allPoints.map(([, z]) => z))
  return {
    parts: polygonParts('vanocni-ozdoba', assembled, settings.materialThickness),
    primitives: [],
    width: maxX - minX,
    depth: maxZ - minZ,
    height: settings.materialThickness,
    layout: 'assembled',
  }
}

export function generateGadget(settings: GadgetSettings): GadgetGeometryData {
  if (settings.type === 'cable-comb') return cableComb(settings)
  if (settings.type === 'tool-rack') return toolRack(settings)
  if (settings.type === 'phone-stand') return phoneStand(settings)
  if (settings.type === 'key-rack') return keyRack(settings)
  if (settings.type === 'battery-holder') return batteryHolder(settings)
  if (settings.type === 'headphone-stand') return headphoneStand(settings)
  if (settings.type === 'skadis-hook') return skadisHook(settings)
  if (settings.type === 'skadis-tool-holder') return skadisToolHolder(settings)
  if (settings.type === 'skadis-shelf') return skadisShelf(settings)
  return nameOrnament(settings)
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
  data.primitives.forEach((primitive, index) => {
    let geometry: THREE.BufferGeometry
    if (primitive.kind === 'box') {
      geometry = new THREE.BoxGeometry(...primitive.size)
    } else {
      const shape = new THREE.Shape()
      shape.moveTo(primitive.outline[0].x, primitive.outline[0].z)
      primitive.outline.slice(1).forEach((point) => shape.lineTo(point.x, point.z))
      shape.closePath()
      geometry = new THREE.ExtrudeGeometry(shape, { depth: primitive.extrusion, bevelEnabled: false, steps: 1 })
      geometry.rotateY(-Math.PI / 2)
      geometry.translate(primitive.extrusion / 2, 0, 0)
      geometry.computeVertexNormals()
    }
    const material = new THREE.MeshStandardMaterial({ color: colors[(data.parts.length + index) % colors.length], roughness: 0.62 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = primitive.name
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(...primitive.position)
    mesh.rotation.set(...primitive.rotation)
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
  const assembledPoints = data.layout === 'assembled'
    ? data.parts.flatMap((part) => part.outline.map((point) => ({ x: point.x + part.position[0], z: point.z + part.position[2] })))
    : []
  const assembledMinX = assembledPoints.length ? Math.min(...assembledPoints.map((point) => point.x)) : 0
  const assembledMinZ = assembledPoints.length ? Math.min(...assembledPoints.map((point) => point.z)) : 0
  let cursorX = 0
  data.parts.forEach((part) => {
    const box = bounds(part.outline)
    const offsetX = data.layout === 'assembled' ? part.position[0] - assembledMinX : cursorX - box.minX
    const offsetZ = data.layout === 'assembled' ? part.position[2] - assembledMinZ : -box.minZ
    const layer = part.name.toUpperCase().replaceAll('-', '_')
    const operationLayer = part.operation === 'engrave' ? `${layer}_ENGRAVING` : `${layer}_OUTLINE`
    dxf += pair(0, 'LWPOLYLINE') + pair(8, operationLayer) + pair(90, part.outline.length) + pair(70, 1)
    part.outline.forEach((point) => {
      dxf += pair(10, (point.x + offsetX).toFixed(4)) + pair(20, (point.z + offsetZ).toFixed(4))
    })
    part.cutouts.forEach((cutout) => {
      const cutoutLayer = part.operation === 'engrave' ? `${layer}_ENGRAVING` : `${layer}_CUTOUTS`
      dxf += pair(0, 'LWPOLYLINE') + pair(8, cutoutLayer) + pair(90, cutout.outline.length) + pair(70, 1)
      cutout.outline.forEach((point) => {
        dxf += pair(10, (point.x + offsetX).toFixed(4)) + pair(20, (point.z + offsetZ).toFixed(4))
      })
    })
    part.holes.forEach((hole) => {
      dxf += pair(0, 'CIRCLE') + pair(8, `${layer}_DRILLING`)
      dxf += pair(10, (hole.x + offsetX).toFixed(4)) + pair(20, (hole.z + offsetZ).toFixed(4)) + pair(40, (hole.diameter / 2).toFixed(4))
    })
    if (data.layout !== 'assembled') cursorX += box.maxX - box.minX + 20
  })
  return dxf + pair(0, 'ENDSEC') + pair(0, 'EOF')
}

function svgPath(outline: TemplatePoint[], offsetX: number, offsetZ: number) {
  return outline.map((point, index) => `${index === 0 ? 'M' : 'L'}${(point.x + offsetX).toFixed(4)} ${(point.z + offsetZ).toFixed(4)}`).join(' ') + ' Z'
}

export function buildGadgetSVG(data: GadgetGeometryData) {
  const assembledPoints = data.layout === 'assembled'
    ? data.parts.flatMap((part) => part.outline.map((point) => ({ x: point.x + part.position[0], z: point.z + part.position[2] })))
    : []
  const assembledMinX = assembledPoints.length ? Math.min(...assembledPoints.map((point) => point.x)) : 0
  const assembledMaxX = assembledPoints.length ? Math.max(...assembledPoints.map((point) => point.x)) : 0
  const assembledMinZ = assembledPoints.length ? Math.min(...assembledPoints.map((point) => point.z)) : 0
  const assembledMaxZ = assembledPoints.length ? Math.max(...assembledPoints.map((point) => point.z)) : 0
  let cursorX = 0
  let maxDepth = 0
  const elements: string[] = []
  data.parts.forEach((part) => {
    const box = bounds(part.outline)
    const offsetX = data.layout === 'assembled' ? part.position[0] - assembledMinX : cursorX - box.minX
    const offsetZ = data.layout === 'assembled' ? part.position[2] - assembledMinZ : -box.minZ
    const layer = part.name.toUpperCase().replaceAll('-', '_')
    const operationClass = part.operation === 'engrave' ? 'engraving' : 'outline'
    elements.push(`<g id="${layer}"><path class="${operationClass}" d="${svgPath(part.outline, offsetX, offsetZ)}"/>`)
    part.cutouts.forEach((cutout) => elements.push(`<path class="${part.operation === 'engrave' ? 'engraving' : 'cutout'}" d="${svgPath(cutout.outline, offsetX, offsetZ)}"/>`))
    part.holes.forEach((hole) => elements.push(`<circle class="drilling" cx="${(hole.x + offsetX).toFixed(4)}" cy="${(hole.z + offsetZ).toFixed(4)}" r="${(hole.diameter / 2).toFixed(4)}"/>`))
    elements.push('</g>')
    if (data.layout !== 'assembled') cursorX += box.maxX - box.minX + 20
    maxDepth = data.layout === 'assembled' ? assembledMaxZ - assembledMinZ : Math.max(maxDepth, box.maxZ - box.minZ)
  })
  const width = Math.max(1, data.layout === 'assembled' ? assembledMaxX - assembledMinX : cursorX - 20)
  const depth = Math.max(1, maxDepth)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(4)}mm" height="${depth.toFixed(4)}mm" viewBox="0 0 ${width.toFixed(4)} ${depth.toFixed(4)}"><style>.outline,.cutout,.drilling,.engraving{fill:none;stroke-width:.2}.outline,.cutout,.drilling{stroke:#000}.engraving{stroke:#1677ff}</style>${elements.join('')}</svg>`
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
