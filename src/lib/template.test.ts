import { describe, expect, it } from 'vitest'
import { buildTemplateDXF, generateTemplate } from './template'
import type { TemplateSettings } from '../types'

const settings: TemplateSettings = {
  type: 'drilling-grid',
  plateWidth: 240,
  plateDepth: 180,
  plateThickness: 12,
  holeDiameter: 8,
  edgeMargin: 20,
  gridRows: 3,
  gridColumns: 4,
  pinCount: 9,
  pinSpacing: 32,
  pinColumns: 2,
  pinRowSpacing: 32,
  cornerRadius: 40,
  mountingHoleDiameter: 6,
}

describe('generateTemplate', () => {
  it('vytvoří vrtací mřížku v požadovaném počtu', () => {
    expect(generateTemplate(settings).holes).toHaveLength(12)
  })

  it('dodržuje systémovou rozteč policových kolíků', () => {
    const data = generateTemplate({ ...settings, type: 'shelf-pins', pinColumns: 1 })
    expect(data.holes[1].z - data.holes[0].z).toBe(32)
  })

  it('radiusová šablona obsahuje hladce vzorkovaný oblouk a montážní otvory', () => {
    const data = generateTemplate({ ...settings, type: 'corner-radius' })
    expect(data.outline.length).toBeGreaterThan(10)
    expect(data.holes).toHaveLength(3)
  })

  it('DXF používá milimetry a oddělené výrobní vrstvy', () => {
    const dxf = buildTemplateDXF(generateTemplate(settings))
    expect(dxf).toContain('$INSUNITS\n70\n4')
    expect(dxf).toContain('OUTLINE')
    expect(dxf).toContain('DRILLING')
    expect(dxf.match(/CIRCLE/g)).toHaveLength(12)
  })
})
