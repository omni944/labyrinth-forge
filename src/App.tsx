import { Grid3X3, RotateCcw, Ruler, ScanLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { MazeScene } from './components/MazeScene'
import { OrganizerControlPanel } from './components/OrganizerControlPanel'
import { OrganizerScene } from './components/OrganizerScene'
import { exportGLB, exportOrganizerGLB, exportOrganizerSTL, exportSTL } from './lib/export'
import { buildGeometryData, generateMaze } from './lib/maze'
import { generateOrganizer } from './lib/organizer'
import type { GeneratorMode, MazeSettings, OrganizerSettings } from './types'

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

const INITIAL_ORGANIZER_SETTINGS: OrganizerSettings = {
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

function App() {
  const [mode, setMode] = useState<GeneratorMode>('maze')
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [organizerSettings, setOrganizerSettings] = useState(INITIAL_ORGANIZER_SETTINGS)
  const [wallColor, setWallColor] = useState('#b9ed3f')
  const [resetSignal, setResetSignal] = useState(0)
  const [exporting, setExporting] = useState<string | null>(null)

  const maze = useMemo(() => generateMaze(settings), [settings])
  const geometry = useMemo(() => buildGeometryData(maze, settings), [maze, settings])
  const organizerBins = useMemo(() => generateOrganizer(organizerSettings), [organizerSettings])

  const updateSetting = <K extends keyof MazeSettings>(key: K, value: MazeSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const newSeed = () => {
    setSettings((current) => ({ ...current, seed: Math.floor(1000 + Math.random() * 8999) }))
  }

  const updateOrganizerSetting = <K extends keyof OrganizerSettings>(key: K, value: OrganizerSettings[K]) => {
    setOrganizerSettings((current) => ({ ...current, [key]: value }))
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

  const handleOrganizerExport = async (format: 'stl' | 'glb') => {
    setExporting(format)
    try {
      if (format === 'stl') await exportOrganizerSTL(organizerBins, organizerSettings)
      else await exportOrganizerGLB(organizerBins, organizerSettings)
    } finally {
      setExporting(null)
    }
  }

  const modelWidth = Math.round(geometry.width)
  const modelDepth = Math.round(geometry.depth)
  const modelHeight = Math.round((settings.wallHeight + settings.floorThickness) * 10) / 10

  return (
    <main className="app-shell">
      {mode === 'maze' ? (
        <ControlPanel
          settings={settings}
          wallColor={wallColor}
          onChange={updateSetting}
          onWallColorChange={setWallColor}
          onNewSeed={newSeed}
          onExport={handleExport}
          exporting={exporting}
          mode={mode}
          onModeChange={setMode}
        />
      ) : (
        <OrganizerControlPanel
          settings={organizerSettings}
          mode={mode}
          onModeChange={setMode}
          onChange={updateOrganizerSetting}
          onExport={handleOrganizerExport}
          exporting={exporting}
        />
      )}
      <section className="workspace">
        <header className="workspace__header">
          <div>
            <span className="eyebrow">GENERÁTOR {mode === 'maze' ? '01' : '02'}</span>
            <h1>{mode === 'maze' ? '3D labyrint' : 'Zásuvkový organizér'}</h1>
          </div>
          <div className="live-status"><span /> Živý náhled</div>
        </header>

        <div className="viewport">
          {mode === 'maze' ? (
            <MazeScene data={geometry} settings={settings} wallColor={wallColor} resetSignal={resetSignal} />
          ) : (
            <OrganizerScene bins={organizerBins} settings={organizerSettings} resetSignal={resetSignal} />
          )}
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
            {mode === 'maze' ? <ScanLine size={16} /> : <Grid3X3 size={16} />}
            <span>{mode === 'maze' ? 'Model' : 'Sestava'}</span>
            <strong>{mode === 'maze' ? `${settings.columns} × ${settings.rows} buněk` : `${organizerBins.length} samostatných dílů`}</strong>
          </div>
          <div className="metric">
            <Ruler size={16} />
            <span>{mode === 'maze' ? 'Výsledný rozměr' : 'Rozměr zásuvky'}</span>
            <strong>{mode === 'maze' ? `${modelWidth} × ${modelDepth} × ${modelHeight} mm` : `${organizerSettings.drawerWidth} × ${organizerSettings.drawerDepth} × ${organizerSettings.binHeight} mm`}</strong>
          </div>
          <div className="metric metric--right">
            <span>{mode === 'maze' ? 'Počet stěn' : 'Rozvržení'}</span>
            <strong>{mode === 'maze' ? geometry.walls.length : organizerSettings.layout === 'grid' ? `${organizerSettings.columns} × ${organizerSettings.rows}` : `4^${organizerSettings.iterations}`}</strong>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
