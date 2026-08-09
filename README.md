# Labyrinth Forge

Webová aplikace pro parametrické generování 3D labyrintů. Vše běží lokálně v prohlížeči: změny parametrů se ihned promítnou do 3D náhledu a hotový model lze stáhnout pro další zpracování nebo 3D tisk.

## Funkce

- tři styly labyrintu: klasický, pletený a komnaty,
- deterministické generování pomocí seedu,
- živý 3D náhled s orbitální kamerou,
- nastavitelná mřížka, velikost buněk, výška a tloušťka stěn i podlahy,
- export do binárního STL a GLB,
- rozměry v milimetrech vhodné pro přípravu 3D tisku,
- responzivní webové rozhraní.

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
