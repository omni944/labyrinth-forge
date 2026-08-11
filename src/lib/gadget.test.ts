import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { build3MFModelXML } from './export'
import { buildGadgetDXF, buildGadgetSVG, createGadgetGroup, generateGadget, normalizeOrnamentName } from './gadget'
import type { GadgetSettings } from '../types'

const settings: GadgetSettings = {
  type: 'cable-comb',
  materialThickness: 8,
  gadgetWidth: 160,
  gadgetDepth: 60,
  cableSlotCount: 5,
  cableSlotWidth: 12,
  cableSlotDepth: 30,
  toolRows: 2,
  toolColumns: 6,
  toolHoleDiameter: 12,
  toolMargin: 18,
  phoneBackHeight: 160,
  phoneAngle: 68,
  deviceThickness: 12,
  fitClearance: 0.4,
  mountingHoleDiameter: 6,
  batteryRows: 2,
  batteryColumns: 5,
  batteryDiameter: 14.5,
  batteryClearance: 0.5,
  baseThickness: 3,
  standHeight: 240,
  stemWidth: 42,
  headrestWidth: 110,
  skadisPanelThickness: 5,
  skadisSlotWidth: 5,
  skadisSlotHeight: 15,
  skadisMountSpacing: 40,
  skadisBackClearance: 0.4,
  skadisEdgeRadius: 2,
  ornamentName: 'ANNA',
  ornamentStyle: 'snowflake',
  ornamentFrameWidth: 5,
  ornamentBridgeWidth: 4,
  ornamentHangingHole: 5,
}

describe('generateGadget', () => {
  it('vytvoří v kabelovém hřebenu požadovaný počet zářezů', () => {
    const data = generateGadget(settings)
    expect(data.parts[0].outline.length).toBe(4 + settings.cableSlotCount * 4)
  })

  it('vytvoří stojan s požadovanou mřížkou otvorů', () => {
    const data = generateGadget({ ...settings, type: 'tool-rack' })
    expect(data.parts[0].holes).toHaveLength(settings.toolRows * settings.toolColumns)
  })

  it('stojánek telefonu obsahuje základnu, opěrku, doraz a montážní sloty', () => {
    const data = generateGadget({ ...settings, type: 'phone-stand' })
    expect(data.parts).toHaveLength(3)
    expect(data.parts[0].cutouts).toHaveLength(2)
    expect(data.parts[1].rotation[0]).toBeLessThan(0)
  })

  it('věšák na klíče obsahuje zářezy a dva montážní otvory', () => {
    const data = generateGadget({ ...settings, type: 'key-rack' })
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].outline).toHaveLength(4 + settings.cableSlotCount * 4)
    expect(data.parts[0].holes).toEqual([
      expect.objectContaining({ diameter: settings.mountingHoleDiameter }),
      expect.objectContaining({ diameter: settings.mountingHoleDiameter }),
    ])
  })

  it('držák baterií má vrtanou horní desku položenou na plném dnu', () => {
    const data = generateGadget({ ...settings, type: 'battery-holder' })
    expect(data.parts).toHaveLength(2)
    expect(data.parts[0].holes).toHaveLength(0)
    expect(data.parts[1].holes).toHaveLength(settings.batteryRows * settings.batteryColumns)
    expect(data.parts[1].holes[0].diameter).toBe(settings.batteryDiameter + settings.batteryClearance)
    expect(data.parts[1].position[1]).toBe(settings.baseThickness)
  })

  it('stojan na sluchátka má základnu se slotem a kolmou stojinu', () => {
    const data = generateGadget({ ...settings, type: 'headphone-stand' })
    expect(data.parts).toHaveLength(2)
    expect(data.parts[0].cutouts).toHaveLength(1)
    expect(data.parts[1].rotation[0]).toBe(Math.PI / 2)
    expect(data.height).toBe(settings.standHeight)
  })

  it('SKÅDIS háček obsahuje souvislý nosný J-hák, spodní stabilizátor a přední doraz', () => {
    const data = generateGadget({ ...settings, type: 'skadis-hook', materialThickness: 4, gadgetWidth: 60, gadgetDepth: 40 })
    expect(data.parts).toHaveLength(0)
    const mount = data.primitives.find((primitive) => primitive.name === 'skadis-nosny-hak-1')
    expect(mount?.kind).toBe('profile')
    if (mount?.kind === 'profile') {
      expect(Math.min(...mount.outline.map((point) => point.x))).toBeLessThan(-settings.skadisPanelThickness)
      expect(Math.max(...mount.outline.map((point) => point.z)) - Math.min(...mount.outline.map((point) => point.z))).toBeGreaterThanOrEqual(11)
    }
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-stabilizator-1')).toBe(true)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-hacek-doraz')).toBe(true)
  })

  it('SKÅDIS držák nástrojů má dva J-háky, stabilizátory a parametrické otvory', () => {
    const data = generateGadget({ ...settings, type: 'skadis-tool-holder', toolColumns: 4 })
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].holes).toHaveLength(4)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-nosny-hak-'))).toHaveLength(2)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-stabilizator-'))).toHaveLength(2)
  })

  it('SKÅDIS polička obsahuje plochu, čelo a dva nosné J-háky', () => {
    const data = generateGadget({ ...settings, type: 'skadis-shelf' })
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-policka-plocha')).toBe(true)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-policka-celo')).toBe(true)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-nosny-hak-'))).toHaveLength(2)
  })

  it('SKÅDIS box vytvoří otevřený zásobník se dnem, čelem a bočnicemi', () => {
    const data = generateGadget({ ...settings, type: 'skadis-container' })
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-box-dno')).toBe(true)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-box-celo')).toBe(true)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-box-bok-'))).toHaveLength(2)
  })

  it('SKÅDIS držák kleští vytvoří požadovaný počet otevřených drážek', () => {
    const data = generateGadget({ ...settings, type: 'skadis-pliers-holder', toolColumns: 3 })
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].outline).toHaveLength(4 + 3 * 4)
  })

  it('SKÅDIS držák vrtáků vytvoří dvě desky se stejným rastrem otvorů', () => {
    const data = generateGadget({ ...settings, type: 'skadis-drill-bit-holder', toolRows: 3, toolColumns: 7 })
    expect(data.parts).toHaveLength(2)
    expect(data.parts[0].holes).toHaveLength(21)
    expect(data.parts[1].holes).toEqual(data.parts[0].holes)
  })

  it('SKÅDIS držák cívek vytvoří trn a doraz pro každou cívku', () => {
    const data = generateGadget({ ...settings, type: 'skadis-spool-holder', toolColumns: 2 })
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-civka-trn-'))).toHaveLength(2)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-civka-doraz-'))).toHaveLength(2)
    const group = createGadgetGroup(data)
    const axle = group.getObjectByName('skadis-civka-trn-1') as THREE.Mesh | undefined
    expect(axle?.geometry.getAttribute('position').count).toBeGreaterThan(100)
  })

  it('zaoblení se aplikuje na tělo držáku, ale nikdy na J-háky', () => {
    const data = generateGadget({ ...settings, type: 'skadis-container', skadisEdgeRadius: 3 })
    const body = data.primitives.find((primitive) => primitive.name === 'skadis-predni-deska')
    const hook = data.primitives.find((primitive) => primitive.name === 'skadis-nosny-hak-1')
    expect(body?.kind === 'box' && body.edgeRadius).toBe(3)
    expect(hook?.kind).toBe('profile')
    expect(createGadgetGroup(data).getObjectByName('skadis-predni-deska')).toBeDefined()

    const standaloneHook = generateGadget({ ...settings, type: 'skadis-hook', skadisEdgeRadius: 6 })
    const hookBody = standaloneHook.primitives.find((primitive) => primitive.name === 'skadis-predni-deska')
    expect(hookBody?.kind === 'box' && hookBody.edgeRadius).toBe(0)
  })

  it('profil J-háku se převede na uzavřenou exportovatelnou 3D geometrii', () => {
    const group = createGadgetGroup(generateGadget({ ...settings, type: 'skadis-tool-holder' }))
    const hook = group.getObjectByName('skadis-nosny-hak-1') as THREE.Mesh | undefined
    expect(hook?.geometry.getAttribute('position').count).toBeGreaterThan(20)
  })

  it('vánoční ozdoba vytvoří jeden spojený CNC průřez s vnitřními výřezy', () => {
    const data = generateGadget({ ...settings, type: 'name-ornament', gadgetWidth: 120, materialThickness: 6, ornamentName: 'Eliška' })
    expect(data.layout).toBe('assembled')
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].name).toBe('vanocni-ozdoba')
    expect(data.parts[0].operation).toBe('cut')
    expect(data.parts[0].cutouts.length).toBeGreaterThan(5)
    expect(data.height).toBe(6)
  })

  it('jméno pro vestavěný vektorový font bezpečně normalizuje diakritiku a délku', () => {
    expect(normalizeOrnamentName('  Eliška 2026! ')).toBe('ELISKA 2026')
    expect(normalizeOrnamentName('')).toBe('ANNA')
    expect(normalizeOrnamentName('abcdefghijklmnop')).toHaveLength(14)
  })

  it.each(['snowflake', 'trees', 'bells', 'reindeer', 'village', 'holly', 'angel', 'gifts'] as const)('motiv %s zůstane jedním vyrobitelným dílem', (ornamentStyle) => {
    const data = generateGadget({ ...settings, type: 'name-ornament', gadgetWidth: 120, ornamentStyle, ornamentName: 'KRISTYNA 2026' })
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].cutouts.length).toBeGreaterThan(4)
  })

  it.each([
    ['mandala-ornament', 'radialni-mandala', 25],
    ['tree-of-life-ornament', 'strom-zivota', 8],
    ['nordic-snowflake-ornament', 'severska-vlocka', 8],
    ['woodland-ornament', 'pulnocni-les', 5],
    ['leaping-reindeer-ornament', 'jelen-ve-snehu', 20],
  ] as const)('propracovaný CNC dekor %s vytvoří jeden souvislý díl', (type, partName, minimumCutouts) => {
    const data = generateGadget({ ...settings, type, gadgetWidth: 180, materialThickness: 6 })
    expect(data.layout).toBe('assembled')
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].name).toBe(partName)
    expect(data.parts[0].cutouts.length).toBeGreaterThanOrEqual(minimumCutouts)
    expect(data.width).toBeGreaterThanOrEqual(180)
    expect(buildGadgetSVG(data)).toContain('class="cutout"')
    expect(buildGadgetDXF(data)).toContain(`${partName.toUpperCase().replaceAll('-', '_')}_OUTLINE`)
  })

  it.each([80, 300])('jelen ve sněhu zůstane vyrobitelný při průměru %d mm', (gadgetWidth) => {
    const data = generateGadget({ ...settings, type: 'leaping-reindeer-ornament', gadgetWidth })
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].cutouts.length).toBeGreaterThanOrEqual(20)
    expect(createGadgetGroup(data).getObjectByName('jelen-ve-snehu')).toBeDefined()
  })

  it.each(['tree-of-life-ornament', 'leaping-reindeer-ornament'] as const)('%s je stabilní v celém rozsahu posuvníku', (type) => {
    const failures: number[] = []
    for (let gadgetWidth = 80; gadgetWidth <= 300; gadgetWidth += 5) {
      try {
        const data = generateGadget({
          ...settings,
          type,
          gadgetWidth,
          ornamentBridgeWidth: type === 'tree-of-life-ornament' ? 5 : 4,
        })
        if (data.parts.length !== 1) failures.push(gadgetWidth)
      } catch {
        failures.push(gadgetWidth)
      }
    }
    expect(failures).toEqual([])
  })

  it('SVG a DXF ozdoby obsahují vnější konturu a vnitřní CNC výřezy', () => {
    const data = generateGadget({ ...settings, type: 'name-ornament' })
    const svg = buildGadgetSVG(data)
    const dxf = buildGadgetDXF(data)
    expect(svg).toContain('class="outline"')
    expect(svg).toContain('class="cutout"')
    expect(svg).not.toContain('class="engraving"')
    expect(dxf).toContain('VANOCNI_OZDOBA_OUTLINE')
    expect(dxf).toContain('VANOCNI_OZDOBA_CUTOUTS')
  })

  it('DXF stojánku rozloží jednotlivé díly do samostatných vrstev', () => {
    const dxf = buildGadgetDXF(generateGadget({ ...settings, type: 'phone-stand' }))
    expect(dxf).toContain('$INSUNITS\n70\n4')
    expect(dxf).toContain('ZAKLADNA_OUTLINE')
    expect(dxf).toContain('OPERKA_OUTLINE')
    expect(dxf).toContain('ZAKLADNA_CUTOUTS')
  })

  it('DXF držáku baterií oddělí dno a vrtanou horní desku', () => {
    const dxf = buildGadgetDXF(generateGadget({ ...settings, type: 'battery-holder' }))
    expect(dxf).toContain('DRZAK_BATERII_DNO_OUTLINE')
    expect(dxf).toContain('DRZAK_BATERII_HORNI_OUTLINE')
    expect(dxf).toContain('DRZAK_BATERII_HORNI_DRILLING')
  })

  it('SVG rozloží díly gadgetu a zachová otvory i výřezy', () => {
    const svg = buildGadgetSVG(generateGadget({ ...settings, type: 'phone-stand' }))
    expect(svg).toContain('width=')
    expect(svg).toContain('class="outline"')
    expect(svg).toContain('class="cutout"')
    expect(svg).toContain('class="drilling"')
  })

  it('3MF geometrie deklaruje milimetry a tisknutelný objekt', () => {
    const group = createGadgetGroup(generateGadget({ ...settings, type: 'tool-rack' }))
    const xml = build3MFModelXML(group)
    expect(xml).toContain('unit="millimeter"')
    expect(xml).toContain('<object id="1" type="model">')
    expect(xml).toContain('<triangle')
  })
})
