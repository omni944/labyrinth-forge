# Labyrinth Forge

Webová aplikace pro parametrické generování 3D labyrintů, zásuvkových organizérů a CNC šablon. Vše běží lokálně v prohlížeči: změny parametrů se ihned promítnou do 3D náhledu a hotový model lze stáhnout pro další zpracování nebo výrobu.

**Webová aplikace:** [omni944.github.io/labyrinth-forge](https://omni944.github.io/labyrinth-forge/)

## Funkce

- tři styly labyrintu: klasický, pletený a komnaty,
- deterministické generování pomocí seedu,
- živý 3D náhled s orbitální kamerou,
- nastavitelná mřížka, velikost buněk, výška a tloušťka stěn i podlahy,
- export do binárního STL a GLB,
- rozměry v milimetrech vhodné pro přípravu 3D tisku,
- responzivní webové rozhraní.

### Zásuvkové organizéry

- rozměry zásuvky, výška přihrádek a tiskové vůle,
- pravidelná mřížka nebo asymetrické rekurzivní dělení,
- samostatné duté přihrádky se zaoblenými rohy,
- nastavitelná tloušťka stěn, dna a poloměr rohů,
- export celé sestavy do GLB,
- export jednotlivých tisknutelných přihrádek jako STL soubory v ZIP balíčku.

### CNC šablony a přípravky

- univerzální vrtací mřížky,
- šablony pro policové kolíky se systémovou roztečí 32 mm,
- radiusové frézovací šablony s montážními otvory,
- přesný 2D export DXF v milimetrech s vrstvami `OUTLINE` a `DRILLING`,
- 3D export STL a GLB.

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
