# Power Battles

When numbers become power.

Made by **Yazan Omais** · [omaisyazan074@gmail.com](mailto:omaisyazan074@gmail.com)

Pick two of **66 original heroes**:

- **50 classic** fighters — bases 1–10 × exponents 1–5
- **5 null-base** voids — `0¹`–`0⁵` (power **0**)
- **11 power-zero void variants** — `0⁰`–`10⁰` with **game power 0** (math would say n⁰=1 for n≠0; these use a void override)

Watch a live arena fight. **Higher power wins. Equal powers draw. Power 0 loses to any positive. Two zeros draw. Never random.**

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

Use the speaker icon in the header to mute/unmute ambient audio and fight SFX. Audio is **original Web Audio synthesis** across all pages — Marvel’s *Portals* cannot be included (copyright).

## Stack

- React + TypeScript + Vite + Tailwind
- Framer Motion (arena sequence)
- Web Audio API (ambient + clash SFX)
- Vitest

## Tests

```bash
npm test
```

Checks: 66 heroes, bases/exponents (including 0), power-zero void override, stronger wins, equal draws, zero-power rules, tournament helpers.

## Project layout

```
src/heroes/          # 66 heroes + procedural SVG art
src/mathEngine/      # power math + Unicode / <sup> notation
src/battleEngine/    # deterministic fight resolution
src/animations/      # live arena fight sequence
src/audio/           # original ambient + fight SFX
src/pages/           # Home, Gallery, Select, Arena
```
