import { Gamepad2, Gift, Grid3X3, Grip, Route, Wrench } from 'lucide-react'
import type { GeneratorMode } from '../types'

export function GeneratorSwitcher({ mode, onChange }: { mode: GeneratorMode; onChange: (mode: GeneratorMode) => void }) {
  return (
    <div className="generator-switch" aria-label="Typ generátoru">
      <button className={mode === 'maze' ? 'is-active' : ''} onClick={() => onChange('maze')}>
        <Route size={15} />Labyrinty
      </button>
      <button className={mode === 'organizer' ? 'is-active' : ''} onClick={() => onChange('organizer')}>
        <Grid3X3 size={15} />Organizéry
      </button>
      <button className={mode === 'template' ? 'is-active' : ''} onClick={() => onChange('template')}>
        <Wrench size={15} />Šablony
      </button>
      <button className={mode === 'gadget' ? 'is-active' : ''} onClick={() => onChange('gadget')}>
        <Gamepad2 size={15} />Gadgety
      </button>
      <button className={mode === 'skadis' ? 'is-active' : ''} onClick={() => onChange('skadis')}>
        <Grip size={15} />SKÅDIS
      </button>
      <button className={mode === 'ornament' ? 'is-active' : ''} onClick={() => onChange('ornament')}>
        <Gift size={15} />CNC ozdoby
      </button>
    </div>
  )
}
