import type { Cell, Direction, MazeGeometryData, MazeSettings } from '../types'

const DIRECTIONS: Direction[] = ['n', 'e', 's', 'w']
const OPPOSITE: Record<Direction, Direction> = { n: 's', e: 'w', s: 'n', w: 'e' }
const DELTA: Record<Direction, [number, number]> = {
  n: [-1, 0],
  e: [0, 1],
  s: [1, 0],
  w: [0, -1],
}

function mulberry32(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeGrid(rows: number, columns: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, col) => ({
      row,
      col,
      walls: { n: true, e: true, s: true, w: true },
      visited: false,
    })),
  )
}

function validCell(grid: Cell[][], row: number, col: number) {
  return row >= 0 && col >= 0 && row < grid.length && col < grid[0].length
}

function removeWall(grid: Cell[][], row: number, col: number, direction: Direction) {
  const [dr, dc] = DELTA[direction]
  const nextRow = row + dr
  const nextCol = col + dc
  if (!validCell(grid, nextRow, nextCol)) return
  grid[row][col].walls[direction] = false
  grid[nextRow][nextCol].walls[OPPOSITE[direction]] = false
}

function shuffled<T>(values: T[], random: () => number) {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function carvePerfectMaze(grid: Cell[][], random: () => number) {
  const stack: Cell[] = []
  let current = grid[Math.floor(random() * grid.length)][Math.floor(random() * grid[0].length)]
  current.visited = true

  while (true) {
    const options = shuffled(DIRECTIONS, random).flatMap((direction) => {
      const [dr, dc] = DELTA[direction]
      const row = current.row + dr
      const col = current.col + dc
      return validCell(grid, row, col) && !grid[row][col].visited
        ? [{ direction, cell: grid[row][col] }]
        : []
    })

    if (options.length > 0) {
      const next = options[0]
      stack.push(current)
      removeWall(grid, current.row, current.col, next.direction)
      current = next.cell
      current.visited = true
    } else if (stack.length > 0) {
      current = stack.pop()!
    } else {
      break
    }
  }
}

function carveBraids(grid: Cell[][], random: () => number, amount: number) {
  const deadEnds = grid.flat().filter((cell) => DIRECTIONS.filter((d) => cell.walls[d]).length === 3)
  for (const cell of shuffled(deadEnds, random)) {
    if (random() > amount / 100) continue
    const candidates = shuffled(DIRECTIONS, random).filter((direction) => {
      const [dr, dc] = DELTA[direction]
      return cell.walls[direction] && validCell(grid, cell.row + dr, cell.col + dc)
    })
    if (candidates[0]) removeWall(grid, cell.row, cell.col, candidates[0])
  }
}

function carveRooms(grid: Cell[][], random: () => number, roomCount: number) {
  const maxRows = grid.length
  const maxCols = grid[0].length
  for (let room = 0; room < roomCount; room += 1) {
    const width = Math.min(maxCols, 2 + Math.floor(random() * Math.min(4, Math.max(2, maxCols - 1))))
    const height = Math.min(maxRows, 2 + Math.floor(random() * Math.min(3, Math.max(2, maxRows - 1))))
    const startCol = Math.floor(random() * Math.max(1, maxCols - width + 1))
    const startRow = Math.floor(random() * Math.max(1, maxRows - height + 1))

    for (let row = startRow; row < startRow + height; row += 1) {
      for (let col = startCol; col < startCol + width; col += 1) {
        if (col < startCol + width - 1) removeWall(grid, row, col, 'e')
        if (row < startRow + height - 1) removeWall(grid, row, col, 's')
      }
    }
  }
}

export function generateMaze(settings: MazeSettings): Cell[][] {
  const grid = makeGrid(settings.rows, settings.columns)
  const random = mulberry32(settings.seed)
  carvePerfectMaze(grid, random)

  if (settings.style === 'braided') carveBraids(grid, random, settings.braid)
  if (settings.style === 'rooms') carveRooms(grid, random, settings.roomCount)

  // Jasně definovaný vstup a výstup na protilehlých hranách.
  grid[0][0].walls.w = false
  grid[settings.rows - 1][settings.columns - 1].walls.e = false
  return grid
}

export function buildGeometryData(grid: Cell[][], settings: MazeSettings): MazeGeometryData {
  const width = settings.columns * settings.cellSize
  const depth = settings.rows * settings.cellSize
  const t = settings.wallThickness
  const walls: MazeGeometryData['walls'] = []

  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = -width / 2 + colIndex * settings.cellSize + settings.cellSize / 2
      const z = -depth / 2 + rowIndex * settings.cellSize + settings.cellSize / 2

      if (cell.walls.n) walls.push({ x, z: z - settings.cellSize / 2, width: settings.cellSize + t, depth: t })
      if (cell.walls.w) walls.push({ x: x - settings.cellSize / 2, z, width: t, depth: settings.cellSize + t })
      if (rowIndex === settings.rows - 1 && cell.walls.s) {
        walls.push({ x, z: z + settings.cellSize / 2, width: settings.cellSize + t, depth: t })
      }
      if (colIndex === settings.columns - 1 && cell.walls.e) {
        walls.push({ x: x + settings.cellSize / 2, z, width: t, depth: settings.cellSize + t })
      }
    })
  })

  return { width, depth, walls }
}

export function countOpenConnections(grid: Cell[][]) {
  let count = 0
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.walls.e && cell.col < row.length - 1) count += 1
      if (!cell.walls.s && cell.row < grid.length - 1) count += 1
    }
  }
  return count
}
