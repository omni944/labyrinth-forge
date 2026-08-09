export type MazeStyle = 'classic' | 'braided' | 'rooms'

export type Direction = 'n' | 'e' | 's' | 'w'

export interface Cell {
  row: number
  col: number
  walls: Record<Direction, boolean>
  visited: boolean
}

export interface MazeSettings {
  columns: number
  rows: number
  cellSize: number
  wallThickness: number
  wallHeight: number
  floorThickness: number
  seed: number
  style: MazeStyle
  braid: number
  roomCount: number
}

export interface WallSegment {
  x: number
  z: number
  width: number
  depth: number
}

export interface MazeGeometryData {
  width: number
  depth: number
  walls: WallSegment[]
}
