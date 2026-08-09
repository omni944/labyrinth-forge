import { Box, CircleDot, Download, Grid3X3, Radius, Ruler } from 'lucide-react'
import type { GeneratorMode, TemplateSettings, TemplateType } from '../types'
import { GeneratorSwitcher } from './GeneratorSwitcher'

interface Props {
  settings: TemplateSettings
  holeCount: number
  mode: GeneratorMode
  onModeChange: (mode: GeneratorMode) => void
  onChange: <K extends keyof TemplateSettings>(key: K, value: TemplateSettings[K]) => void
  onExport: (format: 'dxf' | 'stl' | 'glb') => void
  exporting: string | null
}

const TYPES: Array<{ value: TemplateType; name: string; description: string }> = [
  { value: 'drilling-grid', name: 'Vrtací mřížka', description: 'Pravidelný rastr otvorů pro univerzální přípravky' },
  { value: 'shelf-pins', name: 'Policové kolíky', description: 'Jedna nebo dvě řady v systému rozteče 32 mm' },
  { value: 'corner-radius', name: 'Radius rohu', description: 'Frézovací šablona se zvoleným vnějším radiusem' },
]

function RangeControl({ label, value, min, max, step = 1, unit, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="control">
      <span className="control__row"><span>{label}</span><output>{value}{unit}</output></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

export function TemplateControlPanel({ settings, holeCount, mode, onModeChange, onChange, onExport, exporting }: Props) {
  const holeUnit = holeCount === 1 ? 'otvor' : holeCount >= 2 && holeCount <= 4 ? 'otvory' : 'otvorů'
  return (
    <aside className="panel">
      <div className="panel__brand">
        <div className="brand-mark"><Box size={20} strokeWidth={2.2} /></div>
        <div><strong>LABYRINTH</strong><span>FORGE</span></div>
      </div>
      <div className="panel__scroll">
        <section className="section section--generator"><GeneratorSwitcher mode={mode} onChange={onModeChange} /></section>
        <section className="section">
          <div className="section__title"><CircleDot size={15} /><span>Typ šablony</span></div>
          <div className="style-list">
            {TYPES.map((type) => (
              <button key={type.value} className={`style-card ${settings.type === type.value ? 'is-active' : ''}`} onClick={() => onChange('type', type.value)}>
                <span className="style-card__radio" />
                <span><strong>{type.name}</strong><small>{type.description}</small></span>
              </button>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section__title"><Ruler size={15} /><span>Polotovar šablony</span></div>
          <RangeControl label="Šířka" value={settings.plateWidth} min={80} max={500} step={5} unit=" mm" onChange={(v) => onChange('plateWidth', v)} />
          <RangeControl label="Délka" value={settings.plateDepth} min={80} max={600} step={5} unit=" mm" onChange={(v) => onChange('plateDepth', v)} />
          <RangeControl label="Tloušťka" value={settings.plateThickness} min={4} max={30} step={1} unit=" mm" onChange={(v) => onChange('plateThickness', v)} />
        </section>

        {settings.type === 'drilling-grid' && (
          <section className="section section--accent">
            <div className="section__title"><Grid3X3 size={15} /><span>Vrtací rastr</span></div>
            <div className="two-columns">
              <RangeControl label="Sloupce" value={settings.gridColumns} min={1} max={10} onChange={(v) => onChange('gridColumns', v)} />
              <RangeControl label="Řádky" value={settings.gridRows} min={1} max={10} onChange={(v) => onChange('gridRows', v)} />
            </div>
            <RangeControl label="Průměr otvorů" value={settings.holeDiameter} min={3} max={30} step={0.5} unit=" mm" onChange={(v) => onChange('holeDiameter', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.edgeMargin} min={10} max={60} step={1} unit=" mm" onChange={(v) => onChange('edgeMargin', v)} />
          </section>
        )}

        {settings.type === 'shelf-pins' && (
          <section className="section section--accent">
            <div className="section__title"><CircleDot size={15} /><span>Policové kolíky</span></div>
            <RangeControl label="Počet pozic" value={settings.pinCount} min={2} max={16} onChange={(v) => onChange('pinCount', v)} />
            <RangeControl label="Systémová rozteč" value={settings.pinSpacing} min={16} max={64} step={1} unit=" mm" onChange={(v) => onChange('pinSpacing', v)} />
            <RangeControl label="Počet řad" value={settings.pinColumns} min={1} max={2} onChange={(v) => onChange('pinColumns', v)} />
            {settings.pinColumns === 2 && <RangeControl label="Vzdálenost řad" value={settings.pinRowSpacing} min={20} max={120} step={1} unit=" mm" onChange={(v) => onChange('pinRowSpacing', v)} />}
            <RangeControl label="Průměr otvorů" value={settings.holeDiameter} min={3} max={12} step={0.5} unit=" mm" onChange={(v) => onChange('holeDiameter', v)} />
            <RangeControl label="Koncový okraj" value={settings.edgeMargin} min={10} max={60} step={1} unit=" mm" onChange={(v) => onChange('edgeMargin', v)} />
          </section>
        )}

        {settings.type === 'corner-radius' && (
          <section className="section section--accent">
            <div className="section__title"><Radius size={15} /><span>Radiusová geometrie</span></div>
            <RangeControl label="Výsledný radius" value={settings.cornerRadius} min={10} max={150} step={5} unit=" mm" onChange={(v) => onChange('cornerRadius', v)} />
            <RangeControl label="Montážní otvory" value={settings.mountingHoleDiameter} min={3} max={16} step={0.5} unit=" mm" onChange={(v) => onChange('mountingHoleDiameter', v)} />
            <RangeControl label="Odsazení otvorů" value={settings.edgeMargin} min={10} max={60} step={1} unit=" mm" onChange={(v) => onChange('edgeMargin', v)} />
          </section>
        )}
      </div>
      <div className="panel__footer">
        <div className="export-summary"><span>Výrobní geometrie</span><strong>{holeCount} {holeUnit}</strong></div>
        <div className="export-row export-row--three">
          <button onClick={() => onExport('dxf')} disabled={Boolean(exporting)}><Download size={15} />DXF</button>
          <button onClick={() => onExport('stl')} disabled={Boolean(exporting)}><Download size={15} />STL</button>
          <button onClick={() => onExport('glb')} disabled={Boolean(exporting)}><Download size={15} />GLB</button>
        </div>
      </div>
    </aside>
  )
}
