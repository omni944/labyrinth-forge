import { describe, expect, it } from 'vitest'
import { generateOrganizer } from './organizer'
import type { OrganizerSettings } from '../types'

const settings: OrganizerSettings = {
  drawerWidth: 320,
  drawerDepth: 480,
  binHeight: 70,
  wallThickness: 2,
  bottomThickness: 1.6,
  cornerRadius: 12,
  outerGap: 2,
  innerGap: 2,
  layout: 'grid',
  rows: 2,
  columns: 3,
  iterations: 1,
  widthSplit: 0.55,
  depthSplit: 0.45,
}

describe('generateOrganizer', () => {
  it('vytvoří požadovanou mřížku', () => {
    expect(generateOrganizer(settings)).toHaveLength(6)
  })

  it('respektuje vnější okraj zásuvky', () => {
    const bins = generateOrganizer(settings)
    const minX = Math.min(...bins.map((bin) => bin.x - bin.width / 2))
    const maxX = Math.max(...bins.map((bin) => bin.x + bin.width / 2))
    expect(minX).toBeCloseTo(-settings.drawerWidth / 2 + settings.outerGap)
    expect(maxX).toBeCloseTo(settings.drawerWidth / 2 - settings.outerGap)
  })

  it('jedna rekurzivní iterace vytvoří čtyři přihrádky', () => {
    expect(generateOrganizer({ ...settings, layout: 'recursive', iterations: 1 })).toHaveLength(4)
  })

  it('další rekurzivní iterace rozdělí každou přihrádku znovu', () => {
    expect(generateOrganizer({ ...settings, layout: 'recursive', iterations: 2 })).toHaveLength(16)
  })
})
