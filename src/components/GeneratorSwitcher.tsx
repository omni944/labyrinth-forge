import { Grid3X3, Route, Wrench } from 'lucide-react'
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
    </div>
  )
}
