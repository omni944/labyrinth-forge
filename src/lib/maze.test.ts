import { describe, expect, it } from 'vitest'
import { countOpenConnections, generateMaze } from './maze'
import type { MazeSettings } from '../types'

const settings: MazeSettings = {
  columns: 10,
  rows: 8,
  cellSize: 12,
  wallThickness: 1.6,
  wallHeight: 8,
  floorThickness: 1.2,
  seed: 42,
  style: 'classic',
  braid: 45,
  roomCount: 3,
}

describe('generateMaze', () => {
  it('je deterministický pro stejné nastavení', () => {
    expect(generateMaze(settings)).toEqual(generateMaze(settings))
  })

  it('perfektní labyrint má přesně cells - 1 vnitřních spojení', () => {
    const grid = generateMaze(settings)
    expect(countOpenConnections(grid)).toBe(settings.rows * settings.columns - 1)
  })

  it('pletený styl přidává další cesty', () => {
    const classic = generateMaze(settings)
    const braided = generateMaze({ ...settings, style: 'braided', braid: 100 })
    expect(countOpenConnections(braided)).toBeGreaterThan(countOpenConnections(classic))
  })

  it('otevírá vstup a výstup', () => {
    const grid = generateMaze(settings)
    expect(grid[0][0].walls.w).toBe(false)
    expect(grid[settings.rows - 1][settings.columns - 1].walls.e).toBe(false)
  })
})
