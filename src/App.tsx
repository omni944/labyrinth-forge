import { RotateCcw, Ruler, ScanLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { MazeScene } from './components/MazeScene'
import { exportGLB, exportSTL } from './lib/export'
import { buildGeometryData, generateMaze } from './lib/maze'
import type { MazeSettings } from './types'

const INITIAL_SETTINGS: MazeSettings = {
  columns: 16,
  rows: 12,
  cellSize: 12,
  wallThickness: 1.6,
  wallHeight: 9,
  floorThickness: 1.2,
  seed: 2841,
  style: 'classic',
  braid: 55,
  roomCount: 3,
}

function App() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [wallColor, setWallColor] = useState('#b9ed3f')
  const [resetSignal, setResetSignal] = useState(0)
  const [exporting, setExporting] = useState<string | null>(null)

  const maze = useMemo(() => generateMaze(settings), [settings])
  const geometry = useMemo(() => buildGeometryData(maze, settings), [maze, settings])

  const updateSetting = <K extends keyof MazeSettings>(key: K, value: MazeSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const newSeed = () => {
    setSettings((current) => ({ ...current, seed: Math.floor(1000 + Math.random() * 8999) }))
  }

  const handleExport = async (format: 'stl' | 'glb') => {
    setExporting(format)
    try {
      if (format === 'stl') exportSTL(geometry, settings)
      else await exportGLB(geometry, settings)
    } finally {
      setExporting(null)
    }
  }

  const modelWidth = Math.round(geometry.width)
  const modelDepth = Math.round(geometry.depth)
  const modelHeight = Math.round((settings.wallHeight + settings.floorThickness) * 10) / 10

  return (
    <main className="app-shell">
      <ControlPanel
        settings={settings}
        wallColor={wallColor}
        onChange={updateSetting}
        onWallColorChange={setWallColor}
        onNewSeed={newSeed}
        onExport={handleExport}
        exporting={exporting}
      />
      <section className="workspace">
        <header className="workspace__header">
          <div>
            <span className="eyebrow">GENERÁTOR 01</span>
            <h1>3D labyrint</h1>
          </div>
          <div className="live-status"><span /> Živý náhled</div>
        </header>

        <div className="viewport">
          <MazeScene data={geometry} settings={settings} wallColor={wallColor} resetSignal={resetSignal} />
          <div className="viewport__hint">Tažením otáčet · Kolečkem přiblížit · Pravým tlačítkem posunout</div>
          <button className="reset-view" onClick={() => setResetSignal((value) => value + 1)} title="Obnovit pohled">
            <RotateCcw size={17} />
          </button>
          <div className="axis-gizmo" aria-hidden="true">
            <span className="axis axis--y">Y</span><span className="axis axis--x">X</span><span className="axis axis--z">Z</span>
          </div>
        </div>

        <footer className="workspace__footer">
          <div className="metric">
            <ScanLine size={16} />
            <span>Model</span>
            <strong>{settings.columns} × {settings.rows} buněk</strong>
          </div>
          <div className="metric">
            <Ruler size={16} />
            <span>Výsledný rozměr</span>
            <strong>{modelWidth} × {modelDepth} × {modelHeight} mm</strong>
          </div>
          <div className="metric metric--right">
            <span>Počet stěn</span>
            <strong>{geometry.walls.length}</strong>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
