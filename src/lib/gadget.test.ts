import { describe, expect, it } from 'vitest'
import { build3MFModelXML } from './export'
import { buildGadgetDXF, createGadgetGroup, generateGadget } from './gadget'
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

  it('DXF stojánku rozloží jednotlivé díly do samostatných vrstev', () => {
    const dxf = buildGadgetDXF(generateGadget({ ...settings, type: 'phone-stand' }))
    expect(dxf).toContain('$INSUNITS\n70\n4')
    expect(dxf).toContain('ZAKLADNA_OUTLINE')
    expect(dxf).toContain('OPERKA_OUTLINE')
    expect(dxf).toContain('ZAKLADNA_CUTOUTS')
  })

  it('3MF geometrie deklaruje milimetry a tisknutelný objekt', () => {
    const group = createGadgetGroup(generateGadget({ ...settings, type: 'tool-rack' }))
    const xml = build3MFModelXML(group)
    expect(xml).toContain('unit="millimeter"')
    expect(xml).toContain('<object id="1" type="model">')
    expect(xml).toContain('<triangle')
  })
})
