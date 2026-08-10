import { Gamepad2, Gift, Grid3X3, Grip, RotateCcw, Ruler, ScanLine, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { GadgetControlPanel } from './components/GadgetControlPanel'
import { GadgetScene } from './components/GadgetScene'
import { MazeScene } from './components/MazeScene'
import { OrganizerControlPanel } from './components/OrganizerControlPanel'
import { OrganizerScene } from './components/OrganizerScene'
import { TemplateControlPanel } from './components/TemplateControlPanel'
import { TemplateScene } from './components/TemplateScene'
import { exportGadget3MF, exportGadgetSTL, exportGLB, exportOrganizerGLB, exportOrganizerSTL, exportSTL, exportTemplateGLB, exportTemplateSTL } from './lib/export'
import { downloadGadgetDXF, downloadGadgetSVG, generateGadget } from './lib/gadget'
import { buildGeometryData, downloadMazeSVG, generateMaze } from './lib/maze'
import { generateOrganizer } from './lib/organizer'
import { downloadTemplateDXF, downloadTemplateSVG, generateTemplate } from './lib/template'
import type { GadgetSettings, GeneratorMode, MazeSettings, OrganizerSettings, TemplateSettings } from './types'

const INITIAL_SETTINGS: MazeSettings = {
  columns: 16,
  rows: 12,
  pathWidth: 10.4,
  wallThickness: 1.6,
  wallHeight: 9,
  floorThickness: 1.2,
  seed: 2841,
  style: 'classic',
  shape: 'rectangular',
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
  binDividers: {},
}

const INITIAL_TEMPLATE_SETTINGS: TemplateSettings = {
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
  pinColumns: 1,
  pinRowSpacing: 32,
  cornerRadius: 40,
  mountingHoleDiameter: 6,
  skadisSlotWidth: 5,
  skadisSlotHeight: 15,
  skadisSpacingX: 20,
  skadisSpacingZ: 20,
  skadisStagger: 10,
}

const INITIAL_GADGET_SETTINGS: GadgetSettings = {
  type: 'cable-comb',
  materialThickness: 8,
  gadgetWidth: 160,
  gadgetDepth: 60,
  cableSlotCount: 5,
  cableSlotWidth: 12,
  cableSlotDepth: 30,
  toolRows: 2,
  toolColumns: 6,
  toolHoleDiameter: 12,
  toolMargin: 18,
  phoneBackHeight: 160,
  phoneAngle: 68,
  deviceThickness: 12,
  fitClearance: 0.4,
  mountingHoleDiameter: 6,
  batteryRows: 2,
  batteryColumns: 5,
  batteryDiameter: 14.5,
  batteryClearance: 0.5,
  baseThickness: 3,
  standHeight: 240,
  stemWidth: 42,
  headrestWidth: 110,
  skadisPanelThickness: 5,
  skadisSlotWidth: 5,
  skadisSlotHeight: 15,
  skadisMountSpacing: 40,
  skadisBackClearance: 0.4,
  skadisEdgeRadius: 2,
  ornamentName: 'ANNA',
  ornamentStyle: 'snowflake',
  ornamentFrameWidth: 4,
  ornamentBridgeWidth: 3.2,
  ornamentHangingHole: 5,
}

function App() {
  const [mode, setMode] = useState<GeneratorMode>('maze')
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [organizerSettings, setOrganizerSettings] = useState(INITIAL_ORGANIZER_SETTINGS)
  const [templateSettings, setTemplateSettings] = useState(INITIAL_TEMPLATE_SETTINGS)
  const [gadgetSettings, setGadgetSettings] = useState(INITIAL_GADGET_SETTINGS)
  const [wallColor, setWallColor] = useState('#b9ed3f')
  const [resetSignal, setResetSignal] = useState(0)
  const [exporting, setExporting] = useState<string | null>(null)

  const maze = useMemo(() => generateMaze(settings), [settings])
  const geometry = useMemo(() => buildGeometryData(maze, settings), [maze, settings])
  const organizerBins = useMemo(() => generateOrganizer(organizerSettings), [organizerSettings])
  const templateData = useMemo(() => generateTemplate(templateSettings), [templateSettings])
  const gadgetData = useMemo(() => generateGadget(gadgetSettings), [gadgetSettings])

  const updateSetting = <K extends keyof MazeSettings>(key: K, value: MazeSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const newSeed = () => {
    setSettings((current) => ({ ...current, seed: Math.floor(1000 + Math.random() * 8999) }))
  }

  const updateOrganizerSetting = <K extends keyof OrganizerSettings>(key: K, value: OrganizerSettings[K]) => {
    setOrganizerSettings((current) => ({ ...current, [key]: value }))
  }

  const updateTemplateSetting = <K extends keyof TemplateSettings>(key: K, value: TemplateSettings[K]) => {
    if (key === 'type') {
      const type = value as TemplateSettings['type']
      const preset: Partial<TemplateSettings> = type === 'shelf-pins'
        ? { plateWidth: 80, plateDepth: 320, plateThickness: 12, holeDiameter: 5, edgeMargin: 20, pinCount: 9, pinSpacing: 32, pinColumns: 1 }
        : type === 'corner-radius'
          ? { plateWidth: 200, plateDepth: 200, plateThickness: 12, edgeMargin: 25, cornerRadius: 40, mountingHoleDiameter: 6 }
          : type === 'skadis'
            ? { plateWidth: 760, plateDepth: 560, plateThickness: 5, edgeMargin: 20, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisSpacingX: 20, skadisSpacingZ: 20, skadisStagger: 10 }
            : { plateWidth: 240, plateDepth: 180, plateThickness: 12, holeDiameter: 8, edgeMargin: 20, gridRows: 3, gridColumns: 4 }
      setTemplateSettings((current) => ({ ...current, ...preset, type }))
      return
    }
    setTemplateSettings((current) => ({ ...current, [key]: value }))
  }

  const updateGadgetSetting = <K extends keyof GadgetSettings>(key: K, value: GadgetSettings[K]) => {
    if (key === 'type') {
      const type = value as GadgetSettings['type']
      const preset: Partial<GadgetSettings> = type === 'tool-rack'
        ? { materialThickness: 25, gadgetWidth: 180, gadgetDepth: 100, toolRows: 2, toolColumns: 6, toolHoleDiameter: 12, toolMargin: 18 }
        : type === 'phone-stand'
          ? { materialThickness: 6, gadgetWidth: 85, gadgetDepth: 140, phoneBackHeight: 160, phoneAngle: 68, deviceThickness: 12, fitClearance: 0.4 }
          : type === 'key-rack'
            ? { materialThickness: 12, gadgetWidth: 240, gadgetDepth: 70, cableSlotCount: 5, cableSlotWidth: 14, cableSlotDepth: 30, mountingHoleDiameter: 6 }
            : type === 'battery-holder'
              ? { materialThickness: 22, gadgetWidth: 180, gadgetDepth: 100, batteryRows: 2, batteryColumns: 5, batteryDiameter: 14.5, batteryClearance: 0.5, baseThickness: 3, toolMargin: 18 }
              : type === 'headphone-stand'
                ? { materialThickness: 12, gadgetWidth: 180, gadgetDepth: 150, standHeight: 240, stemWidth: 42, headrestWidth: 110, fitClearance: 0.4 }
                : type === 'skadis-hook'
                  ? { materialThickness: 4, gadgetWidth: 60, gadgetDepth: 40, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 40, skadisBackClearance: 0.4, skadisEdgeRadius: 0 }
                  : type === 'skadis-tool-holder'
                    ? { materialThickness: 4, gadgetWidth: 100, gadgetDepth: 55, toolColumns: 4, toolHoleDiameter: 18, toolMargin: 14, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 40, skadisBackClearance: 0.4, skadisEdgeRadius: 2 }
                    : type === 'skadis-pliers-holder'
                      ? { materialThickness: 5, gadgetWidth: 120, gadgetDepth: 65, toolColumns: 3, toolHoleDiameter: 16, toolMargin: 18, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 80, skadisBackClearance: 0.4, skadisEdgeRadius: 2 }
                      : type === 'skadis-drill-bit-holder'
                        ? { materialThickness: 4, gadgetWidth: 120, gadgetDepth: 55, toolRows: 3, toolColumns: 7, toolHoleDiameter: 6, toolMargin: 10, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 80, skadisBackClearance: 0.4, skadisEdgeRadius: 1.5 }
                        : type === 'skadis-spool-holder'
                          ? { materialThickness: 5, gadgetWidth: 100, gadgetDepth: 70, toolColumns: 2, toolMargin: 22, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 40, skadisBackClearance: 0.4, skadisEdgeRadius: 2 }
                          : type === 'skadis-container'
                            ? { materialThickness: 4, gadgetWidth: 120, gadgetDepth: 75, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 80, skadisBackClearance: 0.4, skadisEdgeRadius: 2 }
                    : type === 'skadis-shelf'
                      ? { materialThickness: 4, gadgetWidth: 140, gadgetDepth: 80, fitClearance: 0.4, skadisPanelThickness: 5, skadisSlotWidth: 5, skadisSlotHeight: 15, skadisMountSpacing: 80, skadisBackClearance: 0.4, skadisEdgeRadius: 2 }
                      : type === 'name-ornament'
                        ? { materialThickness: 6, gadgetWidth: 120, gadgetDepth: 150, ornamentName: 'ANNA', ornamentStyle: 'snowflake', ornamentFrameWidth: 5, ornamentBridgeWidth: 4, ornamentHangingHole: 6 }
                        : type === 'mandala-ornament'
                          ? { materialThickness: 6, gadgetWidth: 180, gadgetDepth: 180, ornamentFrameWidth: 6, ornamentBridgeWidth: 4, ornamentHangingHole: 6 }
                          : type === 'tree-of-life-ornament'
                            ? { materialThickness: 6, gadgetWidth: 180, gadgetDepth: 180, ornamentFrameWidth: 6, ornamentBridgeWidth: 5, ornamentHangingHole: 6 }
                            : type === 'nordic-snowflake-ornament'
                              ? { materialThickness: 6, gadgetWidth: 150, gadgetDepth: 150, ornamentFrameWidth: 5, ornamentBridgeWidth: 4, ornamentHangingHole: 6 }
                              : type === 'woodland-ornament'
                                ? { materialThickness: 6, gadgetWidth: 180, gadgetDepth: 180, ornamentFrameWidth: 6, ornamentBridgeWidth: 4.5, ornamentHangingHole: 6 }
                      : { materialThickness: 8, gadgetWidth: 160, gadgetDepth: 60, cableSlotCount: 5, cableSlotWidth: 12, cableSlotDepth: 30 }
      setGadgetSettings((current) => ({ ...current, ...preset, type }))
      return
    }
    setGadgetSettings((current) => ({ ...current, [key]: value }))
  }

  const changeMode = (nextMode: GeneratorMode) => {
    if (nextMode === 'skadis' && !gadgetSettings.type.startsWith('skadis-')) {
      updateGadgetSetting('type', 'skadis-hook')
    } else if (nextMode === 'ornament' && !gadgetSettings.type.endsWith('-ornament')) {
      updateGadgetSetting('type', 'name-ornament')
    } else if (nextMode === 'gadget' && (gadgetSettings.type.startsWith('skadis-') || gadgetSettings.type.endsWith('-ornament'))) {
      updateGadgetSetting('type', 'cable-comb')
    }
    setMode(nextMode)
  }

  const handleExport = async (format: 'stl' | 'glb' | 'svg') => {
    setExporting(format)
    try {
      if (format === 'stl') exportSTL(geometry, settings)
      else if (format === 'svg') downloadMazeSVG(geometry, settings)
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

  const handleTemplateExport = async (format: 'dxf' | 'svg' | 'stl' | 'glb') => {
    setExporting(format)
    try {
      if (format === 'dxf') downloadTemplateDXF(templateData, templateSettings)
      else if (format === 'svg') downloadTemplateSVG(templateData, templateSettings)
      else if (format === 'stl') exportTemplateSTL(templateData, templateSettings)
      else await exportTemplateGLB(templateData, templateSettings)
    } finally {
      setExporting(null)
    }
  }

  const handleGadgetExport = async (format: 'dxf' | 'svg' | 'stl' | '3mf') => {
    setExporting(format)
    try {
      if (format === 'dxf') downloadGadgetDXF(gadgetData, gadgetSettings)
      else if (format === 'svg') downloadGadgetSVG(gadgetData, gadgetSettings)
      else if (format === 'stl') exportGadgetSTL(gadgetData, gadgetSettings)
      else await exportGadget3MF(gadgetData, gadgetSettings)
    } finally {
      setExporting(null)
    }
  }

  const modelWidth = Math.round(geometry.width)
  const modelDepth = Math.round(geometry.depth)
  const modelHeight = Math.round((settings.wallHeight + settings.floorThickness) * 10) / 10
  const generatorNumber = mode === 'maze' ? '01' : mode === 'organizer' ? '02' : mode === 'template' ? '03' : mode === 'gadget' ? '04' : mode === 'skadis' ? '05' : '06'
  const generatorTitle = mode === 'maze' ? '3D labyrint' : mode === 'organizer' ? 'Zásuvkový organizér' : mode === 'template' ? 'CNC šablony a přípravky' : mode === 'gadget' ? 'CNC a 3D gadgety' : mode === 'skadis' ? 'SKÅDIS doplňky' : 'Ozdoby pro CNC frézku'
  const templateFeatureCount = templateData.holes.length + templateData.slots.length
  const templateFeatureUnit = templateSettings.type === 'skadis'
    ? templateFeatureCount === 1 ? 'drážka' : templateFeatureCount >= 2 && templateFeatureCount <= 4 ? 'drážky' : 'drážek'
    : templateFeatureCount === 1 ? 'otvor' : templateFeatureCount >= 2 && templateFeatureCount <= 4 ? 'otvory' : 'otvorů'

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
          onModeChange={changeMode}
        />
      ) : mode === 'organizer' ? (
        <OrganizerControlPanel
          settings={organizerSettings}
          binCount={organizerBins.length}
          mode={mode}
          onModeChange={changeMode}
          onChange={updateOrganizerSetting}
          onExport={handleOrganizerExport}
          exporting={exporting}
        />
      ) : mode === 'template' ? (
        <TemplateControlPanel
          settings={templateSettings}
          featureCount={templateFeatureCount}
          mode={mode}
          onModeChange={changeMode}
          onChange={updateTemplateSetting}
          onExport={handleTemplateExport}
          exporting={exporting}
        />
      ) : (
        <GadgetControlPanel
          settings={gadgetSettings}
          partCount={gadgetData.parts.length + gadgetData.primitives.length}
          mode={mode}
          onModeChange={changeMode}
          onChange={updateGadgetSetting}
          onExport={handleGadgetExport}
          exporting={exporting}
        />
      )}
      <section className="workspace">
        <header className="workspace__header">
          <div>
            <span className="eyebrow">GENERÁTOR {generatorNumber}</span>
            <h1>{generatorTitle}</h1>
          </div>
          <div className="live-status"><span /> Živý náhled</div>
        </header>

        <div className="viewport">
          {mode === 'maze' ? (
            <MazeScene data={geometry} settings={settings} wallColor={wallColor} resetSignal={resetSignal} />
          ) : mode === 'organizer' ? (
            <OrganizerScene bins={organizerBins} settings={organizerSettings} resetSignal={resetSignal} />
          ) : mode === 'template' ? (
            <TemplateScene data={templateData} settings={templateSettings} resetSignal={resetSignal} />
          ) : (
            <GadgetScene data={gadgetData} resetSignal={resetSignal} />
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
            {mode === 'maze' ? <ScanLine size={16} /> : mode === 'organizer' ? <Grid3X3 size={16} /> : mode === 'template' ? <Wrench size={16} /> : mode === 'skadis' ? <Grip size={16} /> : mode === 'ornament' ? <Gift size={16} /> : <Gamepad2 size={16} />}
            <span>{mode === 'maze' ? 'Model' : mode === 'organizer' ? 'Sestava' : mode === 'template' ? 'Šablona' : mode === 'skadis' ? 'SKÅDIS doplněk' : mode === 'ornament' ? 'CNC ozdoba' : 'Gadget'}</span>
            <strong>{mode === 'maze' ? settings.shape === 'circular' ? `${settings.rows} prstenců × ${settings.columns} sektorů` : `${settings.columns} × ${settings.rows} buněk` : mode === 'organizer' ? `${organizerBins.length} samostatných dílů` : mode === 'template' ? `${templateFeatureCount} ${templateFeatureUnit}` : gadgetSettings.type.startsWith('skadis-') || gadgetSettings.type.endsWith('-ornament') ? '1 souvislý model' : `${gadgetData.parts.length} výrobní ${gadgetData.parts.length === 1 ? 'díl' : 'díly'}`}</strong>
          </div>
          <div className="metric">
            <Ruler size={16} />
            <span>{mode === 'maze' ? 'Výsledný rozměr' : mode === 'organizer' ? 'Rozměr zásuvky' : mode === 'template' ? 'Rozměr polotovaru' : 'Obálka sestavy'}</span>
            <strong>{mode === 'maze' ? `${modelWidth} × ${modelDepth} × ${modelHeight} mm` : mode === 'organizer' ? `${organizerSettings.drawerWidth} × ${organizerSettings.drawerDepth} × ${organizerSettings.binHeight} mm` : mode === 'template' ? `${templateSettings.plateWidth} × ${templateSettings.plateDepth} × ${templateSettings.plateThickness} mm` : `${Math.round(gadgetData.width)} × ${Math.round(gadgetData.depth)} × ${Math.round(gadgetData.height)} mm`}</strong>
          </div>
          <div className="metric metric--right">
            <span>{mode === 'maze' ? 'Počet stěn' : mode === 'organizer' ? 'Rozvržení' : 'Výrobní formát'}</span>
            <strong>{mode === 'maze' ? geometry.walls.length : mode === 'organizer' ? organizerSettings.layout === 'grid' ? `${organizerSettings.columns} × ${organizerSettings.rows}` : `4^${organizerSettings.iterations}` : mode === 'template' ? templateSettings.type === 'skadis' ? 'DXF · SVG' : 'DXF · SVG · STL · GLB' : gadgetSettings.type.startsWith('skadis-') ? 'STL · 3MF' : 'DXF · SVG · STL · 3MF'}</strong>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App
