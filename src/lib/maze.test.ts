import { describe, expect, it } from 'vitest'
import { buildGeometryData, buildMazeSVG, countOpenConnections, generateMaze } from './maze'
import type { MazeSettings } from '../types'

const settings: MazeSettings = {
  columns: 10,
  rows: 8,
  pathWidth: 10.4,
  wallThickness: 1.6,
  wallHeight: 8,
  floorThickness: 1.2,
  seed: 42,
  style: 'classic',
  shape: 'rectangular',
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

  it('odvozuje rozteč obdélníkového labyrintu ze šířky cesty a stěny', () => {
    const geometry = buildGeometryData(generateMaze(settings), settings)
    expect(geometry.width).toBe(settings.columns * (settings.pathWidth + settings.wallThickness))
    expect(geometry.shape).toBe('rectangular')
  })

  it('kruhový labyrint tvoří prstence, radiální stěny a kruhové SVG', () => {
    const circularSettings = { ...settings, shape: 'circular' as const }
    const grid = generateMaze(circularSettings)
    const geometry = buildGeometryData(grid, circularSettings)
    expect(grid[0][0].walls.n).toBe(false)
    expect(grid[circularSettings.rows - 1][circularSettings.columns - 1].walls.s).toBe(false)
    expect(geometry.shape).toBe('circular')
    expect(geometry.walls.some((wall) => wall.rotation !== undefined)).toBe(true)
    expect(buildMazeSVG(geometry)).toContain('<circle')
  })
})
