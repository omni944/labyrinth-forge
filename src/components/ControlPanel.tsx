import { Box, Download, Dices, FileBox, Palette, SlidersHorizontal } from 'lucide-react'
import type { GeneratorMode, MazeSettings, MazeStyle } from '../types'
import { GeneratorSwitcher } from './GeneratorSwitcher'

interface ControlPanelProps {
  settings: MazeSettings
  wallColor: string
  onChange: <K extends keyof MazeSettings>(key: K, value: MazeSettings[K]) => void
  onWallColorChange: (value: string) => void
  onNewSeed: () => void
  onExport: (format: 'stl' | 'glb') => void
  exporting: string | null
  mode: GeneratorMode
  onModeChange: (mode: GeneratorMode) => void
}

const STYLES: Array<{ value: MazeStyle; name: string; description: string }> = [
  { value: 'classic', name: 'Klasický', description: 'Jediné řešení, dlouhé klikaté chodby' },
  { value: 'braided', name: 'Pletený', description: 'Více cest, méně slepých ramen' },
  { value: 'rooms', name: 'Komnaty', description: 'Otevřené prostory propojené chodbami' },
]

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
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
      <span className="control__row">
        <span>{label}</span>
        <output>{value}{unit}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function ControlPanel({
  settings,
  wallColor,
  onChange,
  onWallColorChange,
  onNewSeed,
  onExport,
  exporting,
  mode,
  onModeChange,
}: ControlPanelProps) {
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
          <div className="section__title"><SlidersHorizontal size={15} /><span>Styl labyrintu</span></div>
          <div className="style-list">
            {STYLES.map((style) => (
              <button
                key={style.value}
                className={`style-card ${settings.style === style.value ? 'is-active' : ''}`}
                onClick={() => onChange('style', style.value)}
              >
                <span className="style-card__radio" />
                <span><strong>{style.name}</strong><small>{style.description}</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__title"><SlidersHorizontal size={15} /><span>Rozměry mřížky</span></div>
          <div className="two-columns">
            <RangeControl label="Sloupce" value={settings.columns} min={4} max={32} onChange={(v) => onChange('columns', v)} />
            <RangeControl label="Řádky" value={settings.rows} min={4} max={32} onChange={(v) => onChange('rows', v)} />
          </div>
          <RangeControl label="Velikost buňky" value={settings.cellSize} min={5} max={30} step={1} unit=" mm" onChange={(v) => onChange('cellSize', v)} />
        </section>

        <section className="section">
          <div className="section__title"><FileBox size={15} /><span>Geometrie modelu</span></div>
          <RangeControl label="Výška stěny" value={settings.wallHeight} min={2} max={30} step={0.5} unit=" mm" onChange={(v) => onChange('wallHeight', v)} />
          <RangeControl label="Tloušťka stěny" value={settings.wallThickness} min={0.8} max={5} step={0.2} unit=" mm" onChange={(v) => onChange('wallThickness', v)} />
          <RangeControl label="Tloušťka podlahy" value={settings.floorThickness} min={0.6} max={5} step={0.2} unit=" mm" onChange={(v) => onChange('floorThickness', v)} />
        </section>

        {settings.style === 'braided' && (
          <section className="section section--accent">
            <div className="section__title"><SlidersHorizontal size={15} /><span>Pletení cest</span></div>
            <RangeControl label="Odstranit slepé cesty" value={settings.braid} min={10} max={100} step={5} unit=" %" onChange={(v) => onChange('braid', v)} />
          </section>
        )}

        {settings.style === 'rooms' && (
          <section className="section section--accent">
            <div className="section__title"><SlidersHorizontal size={15} /><span>Komnaty</span></div>
            <RangeControl label="Počet komnat" value={settings.roomCount} min={1} max={10} onChange={(v) => onChange('roomCount', v)} />
          </section>
        )}

        <section className="section">
          <div className="section__title"><Palette size={15} /><span>Vzhled náhledu</span></div>
          <label className="color-control">
            <span>Barva stěn</span>
            <span className="color-control__picker">
              <input type="color" value={wallColor} onChange={(event) => onWallColorChange(event.target.value)} />
              <code>{wallColor.toUpperCase()}</code>
            </span>
          </label>
        </section>
      </div>

      <div className="panel__footer">
        <button className="seed-button" onClick={onNewSeed}>
          <Dices size={17} /><span>Nový labyrint</span><code>#{settings.seed}</code>
        </button>
        <div className="export-row">
          <button onClick={() => onExport('stl')} disabled={Boolean(exporting)}>
            <Download size={16} />{exporting === 'stl' ? 'Exportuji…' : 'STL'}
          </button>
          <button onClick={() => onExport('glb')} disabled={Boolean(exporting)}>
            <Download size={16} />{exporting === 'glb' ? 'Exportuji…' : 'GLB'}
          </button>
        </div>
      </div>
    </aside>
  )
}
