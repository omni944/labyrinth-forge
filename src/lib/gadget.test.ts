import { describe, expect, it } from 'vitest'
import { build3MFModelXML } from './export'
import { buildGadgetDXF, buildGadgetSVG, createGadgetGroup, generateGadget } from './gadget'
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

  it('SKÅDIS háček obsahuje průchozí krček, zadní zámek a přední doraz', () => {
    const data = generateGadget({ ...settings, type: 'skadis-hook', materialThickness: 4, gadgetWidth: 60, gadgetDepth: 40 })
    expect(data.parts).toHaveLength(0)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-krcek-1')).toBe(true)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-zamek-1' && primitive.position[2] < -settings.skadisPanelThickness)).toBe(true)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-hacek-doraz')).toBe(true)
  })

  it('SKÅDIS držák nástrojů má dva zámky a parametrické otvory', () => {
    const data = generateGadget({ ...settings, type: 'skadis-tool-holder', toolColumns: 4 })
    expect(data.parts).toHaveLength(1)
    expect(data.parts[0].holes).toHaveLength(4)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-zamek-'))).toHaveLength(2)
  })

  it('SKÅDIS polička obsahuje plochu, čelo a dva montážní zámky', () => {
    const data = generateGadget({ ...settings, type: 'skadis-shelf' })
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-policka-plocha')).toBe(true)
    expect(data.primitives.some((primitive) => primitive.name === 'skadis-policka-celo')).toBe(true)
    expect(data.primitives.filter((primitive) => primitive.name.startsWith('skadis-zamek-'))).toHaveLength(2)
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
