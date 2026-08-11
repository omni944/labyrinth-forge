export type MazeStyle = 'classic' | 'braided' | 'rooms'
export type MazeShape = 'rectangular' | 'circular'
export type GeneratorMode = 'maze' | 'organizer' | 'template' | 'gadget' | 'skadis' | 'ornament'
export type OrganizerLayout = 'grid' | 'recursive'
export type OrganizerDivider = 'none' | 'halves' | 'quarters'
export type TemplateType = 'drilling-grid' | 'shelf-pins' | 'corner-radius' | 'skadis'
export type GadgetType =
  | 'cable-comb'
  | 'tool-rack'
  | 'phone-stand'
  | 'key-rack'
  | 'battery-holder'
  | 'headphone-stand'
  | 'skadis-hook'
  | 'skadis-tool-holder'
  | 'skadis-shelf'
  | 'skadis-container'
  | 'skadis-pliers-holder'
  | 'skadis-drill-bit-holder'
  | 'skadis-spool-holder'
  | 'name-ornament'
  | 'mandala-ornament'
  | 'tree-of-life-ornament'
  | 'nordic-snowflake-ornament'
  | 'woodland-ornament'
  | 'leaping-reindeer-ornament'

export type OrnamentStyle = 'snowflake' | 'trees' | 'bells' | 'reindeer' | 'village' | 'holly' | 'angel' | 'gifts'

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
  pathWidth: number
  wallThickness: number
  wallHeight: number
  floorThickness: number
  seed: number
  style: MazeStyle
  shape: MazeShape
  braid: number
  roomCount: number
}

export interface WallSegment {
  x: number
  z: number
  width: number
  depth: number
  rotation?: number
}

export interface MazeGeometryData {
  width: number
  depth: number
  walls: WallSegment[]
  shape: MazeShape
  radius?: number
  entrance: [number, number]
  exit: [number, number]
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
  binDividers: Record<number, OrganizerDivider>
}

export interface OrganizerBin {
  id: number
  x: number
  z: number
  width: number
  depth: number
  divider: OrganizerDivider
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
  skadisSlotWidth: number
  skadisSlotHeight: number
  skadisSpacingX: number
  skadisSpacingZ: number
  skadisStagger: number
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
  slots: TemplateSlot[]
}

export interface TemplateSlot extends TemplatePoint {
  width: number
  height: number
  radius: number
}

export interface GadgetSettings {
  type: GadgetType
  materialThickness: number
  gadgetWidth: number
  gadgetDepth: number
  cableSlotCount: number
  cableSlotWidth: number
  cableSlotDepth: number
  toolRows: number
  toolColumns: number
  toolHoleDiameter: number
  toolMargin: number
  phoneBackHeight: number
  phoneAngle: number
  deviceThickness: number
  fitClearance: number
  mountingHoleDiameter: number
  batteryRows: number
  batteryColumns: number
  batteryDiameter: number
  batteryClearance: number
  baseThickness: number
  standHeight: number
  stemWidth: number
  headrestWidth: number
  skadisPanelThickness: number
  skadisSlotWidth: number
  skadisSlotHeight: number
  skadisMountSpacing: number
  skadisBackClearance: number
  skadisEdgeRadius: number
  ornamentName: string
  ornamentStyle: OrnamentStyle
  ornamentFrameWidth: number
  ornamentBridgeWidth: number
  ornamentHangingHole: number
}

export interface GadgetCutout {
  outline: TemplatePoint[]
}

export interface GadgetPart {
  name: string
  outline: TemplatePoint[]
  holes: TemplateHole[]
  cutouts: GadgetCutout[]
  thickness: number
  position: [number, number, number]
  rotation: [number, number, number]
  edgeRadius?: number
  operation?: 'cut' | 'engrave'
}

export type GadgetPrimitive = {
  name: string
  kind: 'box'
  size: [number, number, number]
  position: [number, number, number]
  rotation: [number, number, number]
  edgeRadius?: number
} | {
  name: string
  kind: 'profile'
  outline: TemplatePoint[]
  extrusion: number
  position: [number, number, number]
  rotation: [number, number, number]
} | {
  name: string
  kind: 'cylinder'
  radius: number
  height: number
  position: [number, number, number]
  rotation: [number, number, number]
}

export interface GadgetGeometryData {
  parts: GadgetPart[]
  primitives: GadgetPrimitive[]
  width: number
  depth: number
  height: number
  layout?: 'parts' | 'assembled'
}
