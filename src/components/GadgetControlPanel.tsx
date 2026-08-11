import { Battery, Box, Cable, CircleDot, Download, Gamepad2, Gift, Grip, Headphones, KeyRound, Ruler, Smartphone, Wrench } from 'lucide-react'
import type { GadgetSettings, GadgetType, GeneratorMode } from '../types'
import { GeneratorSwitcher } from './GeneratorSwitcher'

interface Props {
  settings: GadgetSettings
  partCount: number
  mode: GeneratorMode
  onModeChange: (mode: GeneratorMode) => void
  onChange: <K extends keyof GadgetSettings>(key: K, value: GadgetSettings[K]) => void
  onExport: (format: 'dxf' | 'svg' | 'stl' | '3mf') => void
  exporting: string | null
}

type GadgetTypeSection = { name: string; types: Array<{ value: GadgetType; name: string; description: string }> }

const GADGET_TYPE_SECTIONS: GadgetTypeSection[] = [
  { name: 'Dílna a organizace', types: [
    { value: 'cable-comb', name: 'Kabelový hřeben', description: 'Organizér nabíjecích a datových kabelů' },
    { value: 'tool-rack', name: 'Stojan na nástroje', description: 'Rastr otvorů pro vrtáky, frézy nebo pera' },
    { value: 'key-rack', name: 'Věšák na klíče', description: 'Nástěnná lišta se zářezy a montážními otvory' },
    { value: 'battery-holder', name: 'Držák baterií', description: 'Vrtaná horní deska se samostatným pevným dnem' },
  ] },
  { name: 'Stojánky', types: [
    { value: 'phone-stand', name: 'Stojánek na telefon', description: 'Skládací základna a šikmá opěrka' },
    { value: 'headphone-stand', name: 'Stojan na sluchátka', description: 'Dvoudílný stojan se širokou horní opěrkou' },
  ] },
]

const SKADIS_TYPE_SECTIONS: GadgetTypeSection[] = [
  { name: 'SKÅDIS doplňky', types: [
    { value: 'skadis-hook', name: 'SKÅDIS háček', description: 'Nosný J-hák se spodním stabilizačním kolíkem' },
    { value: 'skadis-tool-holder', name: 'SKÅDIS držák šroubováků', description: 'Jedna řada otvorů pro šroubováky, pilníky nebo pera' },
    { value: 'skadis-pliers-holder', name: 'SKÅDIS držák kleští', description: 'Otevřené drážky pro kleště, nůžky a podobné nástroje' },
    { value: 'skadis-drill-bit-holder', name: 'SKÅDIS držák vrtáků', description: 'Dvě vodicí desky s rastrem otvorů pro vrtáky' },
    { value: 'skadis-spool-holder', name: 'SKÅDIS držák cívek', description: 'Vodorovné trny s koncovými dorazy pro cívky' },
    { value: 'skadis-container', name: 'SKÅDIS box', description: 'Otevřený zásobník na drobné nářadí a materiál' },
    { value: 'skadis-shelf', name: 'SKÅDIS polička', description: 'Polička se dvěma J-háky a spodními kolíky' },
  ] },
]

const ORNAMENT_TYPE_SECTIONS: GadgetTypeSection[] = [
  { name: 'Personalizované', types: [
    { value: 'name-ornament', name: 'Baňka se jménem', description: 'Jméno propojené s osmi vánočními motivy' },
  ] },
  { name: 'Propracované dekory', types: [
    { value: 'mandala-ornament', name: 'Radiální mandala', description: 'Tři prstence lístků, kapek a diamantových výřezů' },
    { value: 'tree-of-life-ornament', name: 'Strom života', description: 'Rozvětvená koruna, jemné listy a kořeny v kruhovém rámu' },
    { value: 'nordic-snowflake-ornament', name: 'Severská vločka', description: 'Šestiosá vločka s bočními větvemi a ornamentálními průřezy' },
    { value: 'woodland-ornament', name: 'Půlnoční les', description: 'Vrstvené hory, smrky, jelen a zavěšený měsíc' },
    { value: 'leaping-reindeer-ornament', name: 'Jelen ve sněhu', description: 'Skákající jelen, tři vločky a jemné sněžení v plné baňce' },
  ] },
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
  const isSkadis = settings.type.startsWith('skadis-')
  const isOrnament = settings.type.endsWith('-ornament')
  const isNameOrnament = settings.type === 'name-ornament'
  const typeSections = mode === 'skadis' ? SKADIS_TYPE_SECTIONS : mode === 'ornament' ? ORNAMENT_TYPE_SECTIONS : GADGET_TYPE_SECTIONS
  const typeTitle = mode === 'skadis' ? 'Typ SKÅDIS doplňku' : mode === 'ornament' ? 'Typ CNC ozdoby' : 'Typ gadgetu'
  const TypeIcon = mode === 'skadis' ? Grip : mode === 'ornament' ? Gift : Gamepad2
  return (
    <aside className="panel">
      <div className="panel__brand">
        <div className="brand-mark"><Box size={20} strokeWidth={2.2} /></div>
        <div><strong>LABYRINTH</strong><span>FORGE</span></div>
      </div>
      <div className="panel__scroll">
        <section className="section section--generator"><GeneratorSwitcher mode={mode} onChange={onModeChange} /></section>
        <section className="section">
          <div className="section__title"><TypeIcon size={15} /><span>{typeTitle}</span></div>
          <div className="gadget-sections">
            {typeSections.map((group) => (
              <div className="gadget-category" key={group.name}>
                <h3>{group.name}</h3>
                <div className="style-list">
                  {group.types.map((type) => (
                    <button key={type.value} className={`style-card ${settings.type === type.value ? 'is-active' : ''}`} onClick={() => onChange('type', type.value)}>
                      <span className="style-card__radio" />
                      <span><strong>{type.name}</strong><small>{type.description}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section__title"><Ruler size={15} /><span>Základní rozměry</span></div>
          <RangeControl label={isOrnament ? 'Průměr baňky' : 'Šířka'} value={settings.gadgetWidth} min={isOrnament ? 80 : 60} max={300} step={5} unit=" mm" onChange={(v) => onChange('gadgetWidth', v)} />
          {!isOrnament && <RangeControl label={isSkadis ? 'Vyložení od desky' : settings.type === 'phone-stand' || settings.type === 'headphone-stand' ? 'Hloubka základny' : 'Hloubka'} value={settings.gadgetDepth} min={20} max={240} step={5} unit=" mm" onChange={(v) => onChange('gadgetDepth', v)} />}
          <RangeControl label={isSkadis ? 'Tloušťka tisku' : 'Tloušťka materiálu'} value={settings.materialThickness} min={3} max={30} step={0.5} unit=" mm" onChange={(v) => onChange('materialThickness', v)} />
        </section>

        {isOrnament && (
          <section className="section section--accent">
            <div className="section__title"><Gift size={15} /><span>{isNameOrnament ? 'Osobní ozdoba' : 'Konstrukce dekoru'}</span></div>
            {isNameOrnament && <>
              <label className="text-control">
                <span>Jméno nebo krátký text</span>
                <input type="text" value={settings.ornamentName} maxLength={14} placeholder="ANNA" onChange={(event) => onChange('ornamentName', event.target.value)} />
              </label>
              <label className="select-control">
                <span>Vánoční motiv</span>
                <select value={settings.ornamentStyle} onChange={(event) => onChange('ornamentStyle', event.target.value as GadgetSettings['ornamentStyle'])}>
                  <option value="snowflake">Vločka a hvězdy</option>
                  <option value="trees">Stromečky a hvězdy</option>
                  <option value="bells">Zvonečky a baňky</option>
                  <option value="reindeer">Sob s parohy</option>
                  <option value="village">Zimní vesnice</option>
                  <option value="holly">Cesmína a baňky</option>
                  <option value="angel">Anděl a hvězdy</option>
                  <option value="gifts">Dárky a mašle</option>
                </select>
              </label>
            </>}
            <RangeControl label="Šířka obvodového rámu" value={settings.ornamentFrameWidth} min={3} max={12} step={0.5} unit=" mm" onChange={(v) => onChange('ornamentFrameWidth', v)} />
            <RangeControl label="Minimální šířka můstků" value={settings.ornamentBridgeWidth} min={2.4} max={10} step={0.2} unit=" mm" onChange={(v) => onChange('ornamentBridgeWidth', v)} />
            <RangeControl label="Otvor pro zavěšení" value={settings.ornamentHangingHole} min={3} max={12} step={0.5} unit=" mm" onChange={(v) => onChange('ornamentHangingHole', v)} />
            <p className="section-note">{isNameOrnament ? 'Jednodílný průřez spojuje rám, jméno i vánoční motivy. Diakritika se převede na znaky bez háčků a čárek.' : 'Všechny detaily jsou parametricky propojené do jediného vyrobitelného dílu. Šířka můstků řídí odolnost jemných částí.'} SVG a DXF obsahují hotové vnější i vnitřní CNC kontury.</p>
          </section>
        )}

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

        {settings.type === 'key-rack' && (
          <section className="section section--accent">
            <div className="section__title"><KeyRound size={15} /><span>Háčky a montáž</span></div>
            <RangeControl label="Počet háčků" value={settings.cableSlotCount} min={2} max={10} onChange={(v) => onChange('cableSlotCount', v)} />
            <RangeControl label="Šířka zářezu" value={settings.cableSlotWidth} min={4} max={24} step={1} unit=" mm" onChange={(v) => onChange('cableSlotWidth', v)} />
            <RangeControl label="Hloubka zářezu" value={settings.cableSlotDepth} min={10} max={55} step={1} unit=" mm" onChange={(v) => onChange('cableSlotDepth', v)} />
            <RangeControl label="Montážní otvory" value={settings.mountingHoleDiameter} min={3} max={12} step={0.5} unit=" mm" onChange={(v) => onChange('mountingHoleDiameter', v)} />
          </section>
        )}

        {settings.type === 'battery-holder' && (
          <section className="section section--accent">
            <div className="section__title"><Battery size={15} /><span>Baterie a dno</span></div>
            <div className="two-columns">
              <RangeControl label="Sloupce" value={settings.batteryColumns} min={1} max={10} onChange={(v) => onChange('batteryColumns', v)} />
              <RangeControl label="Řádky" value={settings.batteryRows} min={1} max={6} onChange={(v) => onChange('batteryRows', v)} />
            </div>
            <RangeControl label="Průměr baterie" value={settings.batteryDiameter} min={8} max={36} step={0.5} unit=" mm" onChange={(v) => onChange('batteryDiameter', v)} />
            <RangeControl label="Vůle otvoru" value={settings.batteryClearance} min={0.1} max={2} step={0.1} unit=" mm" onChange={(v) => onChange('batteryClearance', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.toolMargin} min={10} max={50} step={1} unit=" mm" onChange={(v) => onChange('toolMargin', v)} />
            <RangeControl label="Tloušťka dna" value={settings.baseThickness} min={1.5} max={10} step={0.5} unit=" mm" onChange={(v) => onChange('baseThickness', v)} />
          </section>
        )}

        {settings.type === 'headphone-stand' && (
          <section className="section section--accent">
            <div className="section__title"><Headphones size={15} /><span>Stojina a spoj</span></div>
            <RangeControl label="Výška stojanu" value={settings.standHeight} min={160} max={340} step={5} unit=" mm" onChange={(v) => onChange('standHeight', v)} />
            <RangeControl label="Šířka stojiny" value={settings.stemWidth} min={25} max={80} step={1} unit=" mm" onChange={(v) => onChange('stemWidth', v)} />
            <RangeControl label="Šířka opěrky" value={settings.headrestWidth} min={70} max={180} step={5} unit=" mm" onChange={(v) => onChange('headrestWidth', v)} />
            <RangeControl label="Vůle spoje" value={settings.fitClearance} min={0.1} max={1.2} step={0.1} unit=" mm" onChange={(v) => onChange('fitClearance', v)} />
          </section>
        )}

        {isSkadis && (
          <section className="section section--accent">
            <div className="section__title"><Grip size={15} /><span>SKÅDIS zámek</span></div>
            <div className="two-columns">
              <RangeControl label="Šířka drážky" value={settings.skadisSlotWidth} min={3} max={8} step={0.1} unit=" mm" onChange={(v) => onChange('skadisSlotWidth', v)} />
              <RangeControl label="Výška drážky" value={settings.skadisSlotHeight} min={10} max={22} step={0.5} unit=" mm" onChange={(v) => onChange('skadisSlotHeight', v)} />
            </div>
            <RangeControl label="Tloušťka desky" value={settings.skadisPanelThickness} min={3} max={8} step={0.2} unit=" mm" onChange={(v) => onChange('skadisPanelThickness', v)} />
            {settings.type !== 'skadis-hook' && <RangeControl label="Rozteč zámků" value={settings.skadisMountSpacing} min={20} max={80} step={20} unit=" mm" onChange={(v) => onChange('skadisMountSpacing', v)} />}
            <RangeControl label="Vůle v drážce" value={settings.fitClearance} min={0.1} max={1.2} step={0.1} unit=" mm" onChange={(v) => onChange('fitClearance', v)} />
            <RangeControl label="Vůle za deskou" value={settings.skadisBackClearance} min={0.1} max={1.5} step={0.1} unit=" mm" onChange={(v) => onChange('skadisBackClearance', v)} />
            {settings.type !== 'skadis-hook' && <RangeControl label="Zaoblení hran těla" value={settings.skadisEdgeRadius} min={0} max={6} step={0.5} unit=" mm" onChange={(v) => onChange('skadisEdgeRadius', v)} />}
            <p className="section-note">Nosný J-hák se zasune horní částí drážky a po spuštění zachytí za deskou; spodní kolík brání vyklopení. Nejdřív vytiskněte testovací kus a dolaďte vůle podle své desky.</p>
            {settings.type !== 'skadis-hook' && <p className="section-note">Zaoblení se použije jen na tělo doplňku. J-háky a stabilizátory zůstávají rozměrově přesné a bez zaoblení.</p>}
          </section>
        )}

        {settings.type === 'skadis-tool-holder' && (
          <section className="section">
            <div className="section__title"><Wrench size={15} /><span>Otvory pro nástroje</span></div>
            <RangeControl label="Počet otvorů" value={settings.toolColumns} min={1} max={8} onChange={(v) => onChange('toolColumns', v)} />
            <RangeControl label="Průměr otvorů" value={settings.toolHoleDiameter} min={5} max={35} step={0.5} unit=" mm" onChange={(v) => onChange('toolHoleDiameter', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.toolMargin} min={8} max={30} step={1} unit=" mm" onChange={(v) => onChange('toolMargin', v)} />
          </section>
        )}

        {settings.type === 'skadis-pliers-holder' && (
          <section className="section">
            <div className="section__title"><Wrench size={15} /><span>Drážky pro kleště</span></div>
            <RangeControl label="Počet drážek" value={settings.toolColumns} min={1} max={6} onChange={(v) => onChange('toolColumns', v)} />
            <RangeControl label="Šířka drážek" value={settings.toolHoleDiameter} min={8} max={32} step={0.5} unit=" mm" onChange={(v) => onChange('toolHoleDiameter', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.toolMargin} min={8} max={30} step={1} unit=" mm" onChange={(v) => onChange('toolMargin', v)} />
          </section>
        )}

        {settings.type === 'skadis-drill-bit-holder' && (
          <section className="section">
            <div className="section__title"><CircleDot size={15} /><span>Rastr vrtáků</span></div>
            <div className="two-columns">
              <RangeControl label="Sloupce" value={settings.toolColumns} min={2} max={10} onChange={(v) => onChange('toolColumns', v)} />
              <RangeControl label="Řádky" value={settings.toolRows} min={1} max={5} onChange={(v) => onChange('toolRows', v)} />
            </div>
            <RangeControl label="Průměr otvorů" value={settings.toolHoleDiameter} min={2} max={14} step={0.5} unit=" mm" onChange={(v) => onChange('toolHoleDiameter', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.toolMargin} min={6} max={24} step={1} unit=" mm" onChange={(v) => onChange('toolMargin', v)} />
          </section>
        )}

        {settings.type === 'skadis-spool-holder' && (
          <section className="section">
            <div className="section__title"><CircleDot size={15} /><span>Trny pro cívky</span></div>
            <RangeControl label="Počet trnů" value={settings.toolColumns} min={1} max={4} onChange={(v) => onChange('toolColumns', v)} />
            <RangeControl label="Okrajová vzdálenost" value={settings.toolMargin} min={10} max={35} step={1} unit=" mm" onChange={(v) => onChange('toolMargin', v)} />
          </section>
        )}
      </div>
      <div className="panel__footer">
        <div className="export-summary"><span>{isSkadis ? 'SKÅDIS · 3D tisk' : isOrnament ? 'CNC / laser + 3D tisk' : 'CNC + Bambu Studio'}</span><strong>{isSkadis || isOrnament ? '1 model' : `${partCount} ${partCount === 1 ? 'díl' : 'díly'}`}</strong></div>
        <div className={`export-row ${isSkadis ? '' : 'export-row--four'}`}>
          {!isSkadis && <button onClick={() => onExport('dxf')} disabled={Boolean(exporting)}><Download size={15} />DXF</button>}
          {!isSkadis && <button onClick={() => onExport('svg')} disabled={Boolean(exporting)}><Download size={15} />SVG</button>}
          <button onClick={() => onExport('stl')} disabled={Boolean(exporting)}><Download size={15} />STL</button>
          <button onClick={() => onExport('3mf')} disabled={Boolean(exporting)}><Download size={15} />3MF</button>
        </div>
      </div>
    </aside>
  )
}
