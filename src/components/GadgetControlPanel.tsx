import { Box, Cable, CircleDot, Download, Gamepad2, Ruler, Smartphone } from 'lucide-react'
import type { GadgetSettings, GadgetType, GeneratorMode } from '../types'
import { GeneratorSwitcher } from './GeneratorSwitcher'

interface Props {
  settings: GadgetSettings
  partCount: number
  mode: GeneratorMode
  onModeChange: (mode: GeneratorMode) => void
  onChange: <K extends keyof GadgetSettings>(key: K, value: GadgetSettings[K]) => void
  onExport: (format: 'dxf' | 'stl' | '3mf') => void
  exporting: string | null
}

const TYPES: Array<{ value: GadgetType; name: string; description: string }> = [
  { value: 'cable-comb', name: 'Kabelový hřeben', description: 'Organizér nabíjecích a datových kabelů' },
  { value: 'tool-rack', name: 'Stojan na nástroje', description: 'Rastr otvorů pro vrtáky, frézy nebo pera' },
  { value: 'phone-stand', name: 'Stojánek na telefon', description: 'Skládací základna a šikmá opěrka' },
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

export function GadgetControlPanel({ settings, partCount, mode, onModeChange, onChange, onExport, exporting }: Props) {
  return (
    <aside className="panel">
      <div className="panel__brand">
        <div className="brand-mark"><Box size={20} strokeWidth={2.2} /></div>
        <div><strong>LABYRINTH</strong><span>FORGE</span></div>
      </div>
      <div className="panel__scroll">
        <section className="section section--generator"><GeneratorSwitcher mode={mode} onChange={onModeChange} /></section>
        <section className="section">
          <div className="section__title"><Gamepad2 size={15} /><span>Typ gadgetu</span></div>
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
          <div className="section__title"><Ruler size={15} /><span>Základní rozměry</span></div>
          <RangeControl label="Šířka" value={settings.gadgetWidth} min={60} max={300} step={5} unit=" mm" onChange={(v) => onChange('gadgetWidth', v)} />
          <RangeControl label={settings.type === 'phone-stand' ? 'Hloubka základny' : 'Hloubka'} value={settings.gadgetDepth} min={40} max={240} step={5} unit=" mm" onChange={(v) => onChange('gadgetDepth', v)} />
          <RangeControl label="Tloušťka materiálu" value={settings.materialThickness} min={3} max={30} step={0.5} unit=" mm" onChange={(v) => onChange('materialThickness', v)} />
        </section>

        {settings.type === 'cable-comb' && (
          <section className="section section--accent">
            <div className="section__title"><Cable size={15} /><span>Kabelové drážky</span></div>
            <RangeControl label="Počet drážek" value={settings.cableSlotCount} min={2} max={10} onChange={(v) => onChange('cableSlotCount', v)} />
            <RangeControl label="Šířka drážky" value={settings.cableSlotWidth} min={4} max={24} step={1} unit=" mm" onChange={(v) => onChange('cableSlotWidth', v)} />
            <RangeControl label="Hloubka drážky" value={settings.cableSlotDepth} min={10} max={60} step={1} unit=" mm" onChange={(v) => onChange('cableSlotDepth', v)} />
          </section>
        )}

        {settings.type === 'tool-rack' && (
          <section className="section section--accent">
            <div className="section__title"><CircleDot size={15} /><span>Rastr nástrojů</span></div>
            <div className="two-columns">
              <RangeControl label="Sloupce" value={settings.toolColumns} min={1} max={10} onChange={(v) => onChange('toolColumns', v)} />
              <RangeControl label="Řádky" value={settings.toolRows} min={1} max={6} onChange={(v) => onChange('toolRows', v)} />
            </div>
            <RangeControl label="Průměr otvorů" value={settings.toolHoleDiameter} min={3} max={30} step={0.5} unit=" mm" onChange={(v) => onChange('toolHoleDiameter', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.toolMargin} min={10} max={50} step={1} unit=" mm" onChange={(v) => onChange('toolMargin', v)} />
          </section>
        )}

        {settings.type === 'phone-stand' && (
          <section className="section section--accent">
            <div className="section__title"><Smartphone size={15} /><span>Telefon a spoj</span></div>
            <RangeControl label="Výška opěrky" value={settings.phoneBackHeight} min={90} max={220} step={5} unit=" mm" onChange={(v) => onChange('phoneBackHeight', v)} />
            <RangeControl label="Úhel opěrky" value={settings.phoneAngle} min={50} max={80} step={1} unit="°" onChange={(v) => onChange('phoneAngle', v)} />
            <RangeControl label="Tloušťka telefonu" value={settings.deviceThickness} min={7} max={22} step={0.5} unit=" mm" onChange={(v) => onChange('deviceThickness', v)} />
            <RangeControl label="Vůle spoje" value={settings.fitClearance} min={0.1} max={1.2} step={0.1} unit=" mm" onChange={(v) => onChange('fitClearance', v)} />
          </section>
        )}
      </div>
      <div className="panel__footer">
        <div className="export-summary"><span>CNC + Bambu Studio</span><strong>{partCount} {partCount === 1 ? 'díl' : 'díly'}</strong></div>
        <div className="export-row export-row--three">
          <button onClick={() => onExport('dxf')} disabled={Boolean(exporting)}><Download size={15} />DXF</button>
          <button onClick={() => onExport('stl')} disabled={Boolean(exporting)}><Download size={15} />STL</button>
          <button onClick={() => onExport('3mf')} disabled={Boolean(exporting)}><Download size={15} />3MF</button>
        </div>
      </div>
    </aside>
  )
}
