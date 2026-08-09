import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import JSZip from 'jszip'
import type { GadgetGeometryData, GadgetSettings, MazeGeometryData, MazeSettings, OrganizerBin, OrganizerSettings, TemplateGeometryData, TemplateSettings } from '../types'
import { createGadgetGroup } from './gadget'
import { createBinGroup, disposeObject } from './organizer'
import { createTemplateGroup } from './template'

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

export async function exportOrganizerSTL(bins: OrganizerBin[], settings: OrganizerSettings) {
  const zip = new JSZip()
  const exporter = new STLExporter()
  for (const bin of bins) {
    const group = createBinGroup(bin, settings, true)
    const result = exporter.parse(group, { binary: true })
    const bytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
    zip.file(`prihradka-${String(bin.id).padStart(2, '0')}-${Math.round(bin.width)}x${Math.round(bin.depth)}mm.stl`, bytes)
    disposeObject(group)
  }
  const archive = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  download(archive, `organizery-${Math.round(settings.drawerWidth)}x${Math.round(settings.drawerDepth)}mm.zip`)
}

export async function exportOrganizerGLB(bins: OrganizerBin[], settings: OrganizerSettings) {
  const group = new THREE.Group()
  bins.forEach((bin) => group.add(createBinGroup(bin, settings)))
  group.updateMatrixWorld(true)
  try {
    const result = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true })
    download(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }), 'zasuvkovy-organizer.glb')
  } finally {
    disposeObject(group)
  }
}

export function exportTemplateSTL(data: TemplateGeometryData, settings: TemplateSettings) {
  const group = createTemplateGroup(data, settings)
  const result = new STLExporter().parse(group, { binary: true })
  download(new Blob([result], { type: 'model/stl' }), `sablona-${settings.type}.stl`)
  disposeObject(group)
}

export async function exportTemplateGLB(data: TemplateGeometryData, settings: TemplateSettings) {
  const group = createTemplateGroup(data, settings)
  try {
    const result = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true })
    download(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }), `sablona-${settings.type}.glb`)
  } finally {
    disposeObject(group)
  }
}

export function build3MFModelXML(object: THREE.Object3D) {
  object.updateMatrixWorld(true)
  const vertices: string[] = []
  const triangles: string[] = []
  let vertexIndex = 0
  const vertex = new THREE.Vector3()
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const source = child.geometry as THREE.BufferGeometry
    const geometry = source.index ? source.toNonIndexed() : source
    const positions = geometry.getAttribute('position')
    for (let index = 0; index < positions.count; index += 1) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(child.matrixWorld)
      vertices.push(`<vertex x="${vertex.x.toFixed(5)}" y="${vertex.z.toFixed(5)}" z="${vertex.y.toFixed(5)}"/>`)
    }
    for (let index = 0; index < positions.count; index += 3) {
      triangles.push(`<triangle v1="${vertexIndex + index}" v2="${vertexIndex + index + 1}" v3="${vertexIndex + index + 2}"/>`)
    }
    vertexIndex += positions.count
    if (geometry !== source) geometry.dispose()
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="cs-CZ" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">Labyrinth Forge Gadget</metadata><resources><object id="1" type="model"><mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh></object></resources><build><item objectid="1"/></build></model>`
}

export function exportGadgetSTL(data: GadgetGeometryData, settings: GadgetSettings) {
  const group = createGadgetGroup(data)
  const result = new STLExporter().parse(group, { binary: true })
  download(new Blob([result], { type: 'model/stl' }), `gadget-${settings.type}.stl`)
  disposeObject(group)
}

export async function exportGadget3MF(data: GadgetGeometryData, settings: GadgetSettings) {
  const group = createGadgetGroup(data)
  const zip = new JSZip()
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
  zip.folder('_rels')?.file('.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
  zip.folder('3D')?.file('3dmodel.model', build3MFModelXML(group))
  const archive = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  download(archive, `gadget-${settings.type}.3mf`)
  disposeObject(group)
}
