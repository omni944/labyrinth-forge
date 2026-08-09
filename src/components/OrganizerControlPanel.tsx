import { Box, Download, Grid3X3, PanelsTopLeft, Radius, Ruler, SlidersHorizontal } from 'lucide-react'
import type { GeneratorMode, OrganizerLayout, OrganizerSettings } from '../types'
import { GeneratorSwitcher } from './GeneratorSwitcher'

interface Props {
  settings: OrganizerSettings
  mode: GeneratorMode
  onModeChange: (mode: GeneratorMode) => void
  onChange: <K extends keyof OrganizerSettings>(key: K, value: OrganizerSettings[K]) => void
  onExport: (format: 'stl' | 'glb') => void
  exporting: string | null
}

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

const LAYOUTS: Array<{ value: OrganizerLayout; name: string; description: string }> = [
  { value: 'grid', name: 'Pravidelná mřížka', description: 'Stejně velké přihrádky v řádcích a sloupcích' },
  { value: 'recursive', name: 'Asymetrické dělení', description: 'Různé velikosti podle poměrů dělení' },
]

export function OrganizerControlPanel({ settings, mode, onModeChange, onChange, onExport, exporting }: Props) {
  return (
    <aside className="panel">
      <div className="panel__brand">
        <div className="brand-mark"><Box size={20} strokeWidth={2.2} /></div>
        <div><strong>LABYRINTH</strong><span>FORGE</span></div>
      </div>
      <div className="panel__scroll">
        <section className="section section--generator">
          <GeneratorSwitcher mode={mode} onChange={onModeChange} />
        </section>
        <section className="section">
          <div className="section__title"><PanelsTopLeft size={15} /><span>Způsob dělení</span></div>
          <div className="style-list">
            {LAYOUTS.map((layout) => (
              <button key={layout.value} className={`style-card ${settings.layout === layout.value ? 'is-active' : ''}`} onClick={() => onChange('layout', layout.value)}>
                <span className="style-card__radio" />
                <span><strong>{layout.name}</strong><small>{layout.description}</small></span>
              </button>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section__title"><Ruler size={15} /><span>Rozměry zásuvky</span></div>
          <RangeControl label="Šířka" value={settings.drawerWidth} min={120} max={800} step={5} unit=" mm" onChange={(v) => onChange('drawerWidth', v)} />
          <RangeControl label="Hloubka" value={settings.drawerDepth} min={120} max={800} step={5} unit=" mm" onChange={(v) => onChange('drawerDepth', v)} />
          <RangeControl label="Výška přihrádek" value={settings.binHeight} min={20} max={180} step={2} unit=" mm" onChange={(v) => onChange('binHeight', v)} />
        </section>
        <section className="section">
          <div className="section__title"><Grid3X3 size={15} /><span>Rozvržení</span></div>
          {settings.layout === 'grid' ? (
            <div className="two-columns">
              <RangeControl label="Sloupce" value={settings.columns} min={1} max={6} onChange={(v) => onChange('columns', v)} />
              <RangeControl label="Řádky" value={settings.rows} min={1} max={6} onChange={(v) => onChange('rows', v)} />
            </div>
          ) : (
            <>
              <RangeControl label="Úroveň dělení" value={settings.iterations} min={1} max={2} onChange={(v) => onChange('iterations', v)} />
              <RangeControl label="Poměr šířky" value={settings.widthSplit} min={0.25} max={0.75} step={0.05} onChange={(v) => onChange('widthSplit', v)} />
              <RangeControl label="Poměr hloubky" value={settings.depthSplit} min={0.25} max={0.75} step={0.05} onChange={(v) => onChange('depthSplit', v)} />
            </>
          )}
          <RangeControl label="Okraj zásuvky" value={settings.outerGap} min={0.5} max={10} step={0.5} unit=" mm" onChange={(v) => onChange('outerGap', v)} />
          <RangeControl label="Mezera mezi díly" value={settings.innerGap} min={0.5} max={8} step={0.5} unit=" mm" onChange={(v) => onChange('innerGap', v)} />
        </section>
        <section className="section">
          <div className="section__title"><Radius size={15} /><span>Geometrie přihrádek</span></div>
          <RangeControl label="Tloušťka stěny" value={settings.wallThickness} min={1} max={5} step={0.2} unit=" mm" onChange={(v) => onChange('wallThickness', v)} />
          <RangeControl label="Tloušťka dna" value={settings.bottomThickness} min={0.8} max={5} step={0.2} unit=" mm" onChange={(v) => onChange('bottomThickness', v)} />
          <RangeControl label="Zaoblení rohů" value={settings.cornerRadius} min={1} max={35} step={1} unit=" mm" onChange={(v) => onChange('cornerRadius', v)} />
        </section>
      </div>
      <div className="panel__footer">
        <div className="export-summary"><span>Připraveno k exportu</span><strong>{settings.layout === 'grid' ? settings.rows * settings.columns : 4 ** settings.iterations} dílů</strong></div>
        <div className="export-row">
          <button onClick={() => onExport('stl')} disabled={Boolean(exporting)}><Download size={16} />{exporting === 'stl' ? 'Balím…' : 'STL ZIP'}</button>
          <button onClick={() => onExport('glb')} disabled={Boolean(exporting)}><Download size={16} />{exporting === 'glb' ? 'Exportuji…' : 'GLB'}</button>
        </div>
      </div>
    </aside>
  )
}
