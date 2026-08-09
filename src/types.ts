export type MazeStyle = 'classic' | 'braided' | 'rooms'
export type GeneratorMode = 'maze' | 'organizer' | 'template'
export type OrganizerLayout = 'grid' | 'recursive'
export type TemplateType = 'drilling-grid' | 'shelf-pins' | 'corner-radius'

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

export interface OrganizerSettings {
  drawerWidth: number
  drawerDepth: number
  binHeight: number
  wallThickness: number
  bottomThickness: number
  cornerRadius: number
  outerGap: number
  innerGap: number
  layout: OrganizerLayout
  rows: number
  columns: number
  iterations: number
  widthSplit: number
  depthSplit: number
}

export interface OrganizerBin {
  id: number
  x: number
  z: number
  width: number
  depth: number
}

export interface TemplateSettings {
  type: TemplateType
  plateWidth: number
  plateDepth: number
  plateThickness: number
  holeDiameter: number
  edgeMargin: number
  gridRows: number
  gridColumns: number
  pinCount: number
  pinSpacing: number
  pinColumns: number
  pinRowSpacing: number
  cornerRadius: number
  mountingHoleDiameter: number
}

export interface TemplatePoint {
  x: number
  z: number
}

export interface TemplateHole extends TemplatePoint {
  diameter: number
}

export interface TemplateGeometryData {
  width: number
  depth: number
  outline: TemplatePoint[]
  holes: TemplateHole[]
}
