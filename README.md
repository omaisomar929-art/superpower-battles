# SUPERPOWER BATTLES

When numbers become power.

Pick two of **50 original heroes**. Each hero is `base^exponent` (bases 1–10, exponents 1–5). Watch a live arena fight. **Higher power wins. Equal powers draw. Never random.**

No video render server. No separate API. Just the site.

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## How to fight

1. **Home** → **Pick Fighters** (or open **Fight**)
2. Choose Fighter A and Fighter B (or **Randomize**)
3. **Enter Arena**
4. Watch the animated sequence; the math on screen matches the winner
5. **Pick New Fighters** or **Random Rematch**

## Stack

- React + TypeScript + Vite + Tailwind
- Framer Motion (arena sequence)
- Vitest

## Tests

```bash
npm test
```

Checks: 50 unique combos, bases/exponents, correct powers, stronger wins, equal draws, tournament helpers.

## Project layout

```
src/heroes/          # 50 heroes + procedural SVG art
src/mathEngine/      # power math
src/battleEngine/    # deterministic fight resolution
src/animations/      # live arena fight sequence
src/pages/           # Home, Gallery, Select, Arena
```
