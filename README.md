# Labyrinth Forge

Webová aplikace pro parametrické generování 3D labyrintů, zásuvkových organizérů, CNC šablon a praktických gadgetů. Vše běží lokálně v prohlížeči: změny parametrů se ihned promítnou do 3D náhledu a hotový model lze stáhnout pro další zpracování nebo výrobu.

**Webová aplikace:** [omni944.github.io/labyrinth-forge](https://omni944.github.io/labyrinth-forge/)

## Funkce

- tři styly labyrintu: klasický, pletený a komnaty,
- obdélníkový nebo kruhový tvar s nezávislou šířkou cesty a tloušťkou stěny,
- deterministické generování pomocí seedu,
- živý 3D náhled s orbitální kamerou,
- nastavitelná mřížka, šířka cest, výška a tloušťka stěn i podlahy,
- export do binárního STL, GLB a výrobního SVG,
- rozměry v milimetrech vhodné pro přípravu 3D tisku,
- responzivní webové rozhraní.

### Zásuvkové organizéry

- rozměry zásuvky, výška přihrádek a tiskové vůle,
- pravidelná mřížka nebo asymetrické rekurzivní dělení,
- pravidelný rastr až 12 × 12 samostatných krabiček,
- individuální dělení každé krabičky bez přepážky, na poloviny nebo na čtvrtiny,
- samostatné duté přihrádky se zaoblenými rohy,
- nastavitelná tloušťka stěn, dna a poloměr rohů,
- export celé sestavy do GLB,
- export jednotlivých tisknutelných přihrádek jako STL soubory v ZIP balíčku.

### CNC šablony a přípravky

- univerzální vrtací mřížky,
- šablony pro policové kolíky se systémovou roztečí 32 mm,
- radiusové frézovací šablony s montážními otvory,
- velkoformátové polotovary až 2500 × 2500 mm a preset celé desky 2500 × 1250 mm,
- nastavitelný rastr svislých drážek pro panely kompatibilní s IKEA SKÅDIS,
- přesný 2D export DXF v milimetrech s vrstvami `OUTLINE` a `DRILLING`,
- 2D export SVG; u běžných šablon také 3D export STL a GLB.

### CNC a 3D gadgety

- kabelový hřeben s nastavitelnými drážkami,
- stojan na vrtáky, frézy, nástroje nebo pera,
- skládací stojánek na telefon ze základny, opěrky a předního dorazu,
- nástěnný věšák na klíče se zářezy a montážními otvory,
- dvouvrstvý držák tužkových i větších baterií s nastavitelným rastrem, vůlí a pevným dnem,
- dvoudílný stojan na sluchátka se spojovacím slotem a širokou horní opěrkou,
- parametrický SKÅDIS háček s jedním zadním zámkem,
- SKÅDIS držák nástrojů s nastavitelnými otvory a dvěma zámky,
- SKÅDIS polička s předním dorazem a dvěma zámky,
- DXF a SVG rozložení jednotlivých dílů pro CNC obrábění,
- STL a generic 3MF v milimetrech pro Bambu Studio a další slicery.

## Spuštění

```bash
npm install
npm run dev
```

Produkční sestavení a testy:

```bash
npm test
npm run build
```

## Ovládání 3D náhledu

- levé tlačítko myši: otáčení,
- kolečko: přiblížení,
- pravé tlačítko myši: posun.

STL je bez jednotek; hodnoty aplikace jsou navržené jako milimetry, což odpovídá běžnému nastavení slicerů.

Výchozí SKÅDIS rastr je určený jako nastavitelný výrobní základ. Před obráběním celé desky doporučujeme ověřit rozměr drážky, rozteč a vůli na malém vzorku s konkrétním příslušenstvím.

Také závěsné SKÅDIS gadgety mají nastavitelnou tloušťku desky, rozměr drážky, rozteč zámků a dvě výrobní vůle. Před tiskem finálního doplňku doporučujeme vytisknout háček jako testovací kus a hodnoty doladit podle konkrétní desky, materiálu a kalibrace tiskárny.
