# Power Battles

When numbers become power.

Made by **Yazan Omais** · [omaisyazan074@gmail.com](mailto:omaisyazan074@gmail.com)

Pick two of **55 original heroes** (50 classic `base^exponent` fighters plus 5 null-power void fighters). Each classic hero uses bases 1–10 and exponents 1–5. Null fighters are `0¹`–`0⁵` with power **0**. Watch a live arena fight. **Higher power wins. Equal powers draw. Zero loses to any positive power. Never random.**

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

Use the speaker icon in the header to mute/unmute ambient audio and fight SFX (original Web Audio synthesis).

## Stack

- React + TypeScript + Vite + Tailwind
- Framer Motion (arena sequence)
- Web Audio API (ambient + clash SFX)
- Vitest

## Tests

```bash
npm test
```

Checks: 55 heroes (50 classic + 5 zeros), bases/exponents, correct powers, stronger wins, equal draws, zero-power rules, tournament helpers.

## Project layout

```
src/heroes/          # 55 heroes + procedural SVG art
src/mathEngine/      # power math + Unicode / <sup> notation
src/battleEngine/    # deterministic fight resolution
src/animations/      # live arena fight sequence
src/audio/           # ambient + fight SFX
src/pages/           # Home, Gallery, Select, Arena
```
