# SUPERPOWER BATTLES

When numbers become power.

A cinematic superhero battle site where **mathematical power** decides every winner. Fifty original heroes each embody `base^exponent` (bases 1–10, exponents 1–5). Higher power wins. Equal powers draw. Never random.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion (arena fight sequence)
- Remotion (30s / 900-frame compositions + MP4 export)
- Express render API (`@remotion/bundler` + `@remotion/renderer`)
- Vitest

## Quick start

```bash
npm install
npm run dev
```

- Web UI: [http://127.0.0.1:43127](http://127.0.0.1:43127)
- Render API: `http://127.0.0.1:43128`

Or run pieces separately:

```bash
npm run dev:web   # Vite only
npm run dev:api   # MP4 render server only
```

## How to fight

1. Open **Fight** (`/select`)
2. Pick Fighter A and Fighter B (or **Randomize**)
3. Choose an arena → **Enter Arena**
4. Watch the cinematic sequence; the on-screen math matches the winner
5. **Create 30s Video** to open the Video Studio with those fighters

## How to render / download MP4

1. Open **Video** (`/video`)
2. Preview the Remotion composition (exactly **30 seconds**, **30 FPS**, **900 frames**)
3. Tune aspect (16:9 / 9:16 / 1:1), theme, intensity, math timing
4. Click **Render MP4** — the Express server bundles Remotion and encodes a real H.264 file
5. When progress hits 100%, click **Download MP4**

CLI alternative (after `npm install`):

```bash
npm run remotion:studio
npm run render:cli
```

Output lands in `out/superpower-battles.mp4`. Browser renders land in `renders/` and are cleaned up after ~2 hours.

## Tournament

Open **Tournament**, pick bracket size 4/8/16/32, select heroes or randomize a full bracket. Draws use replay/tie-break (higher base, then exponent) or “Fighter A advances”. Champion expression is shown; generate a highlights video from the result.

## Tests

```bash
npm test
```

Covers: 50 unique combos, base/exponent ranges, correct powers, stronger wins, equal draws, tournament brackets, and 900-frame / 30fps timing constants.

## Project layout

```
src/heroes/          # 50 heroes + procedural SVG art
src/mathEngine/      # power math
src/battleEngine/    # deterministic fight resolution
src/tournament/      # brackets
src/animations/      # live arena fight sequence
src/pages/           # Home, Gallery, Select, Arena, Tournament, Video
src/video/           # Remotion root + 30s composition
server/              # real MP4 render + download API
```

## Remotion licensing / setup notes

- Remotion is free for individuals and companies under $1M revenue; larger orgs need a company license — see [remotion.dev/license](https://www.remotion.dev/docs/license).
- First render downloads Remotion’s Chrome headless binary; allow network access.
- System `ffmpeg` is available as a fallback; Remotion also ships platform binaries.
- If render fails, check the API logs (`npm run dev:api`), retry from the Video Studio, or use `npm run render:cli`.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `/api/render` 502 / failed fetch | Ensure `npm run dev` (or `dev:api`) is running on port 43128 |
| Render job errors about Chrome | Allow first-time Remotion browser download; retry |
| Same hero twice blocked | Enable **Mirror mode** on Fighter Select |
| Preview vs export math mismatch | Both use `resolveBattle` — regenerate if fighters changed |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Web + render API |
| `npm run build` | Production web build |
| `npm test` | Vitest suite |
| `npm run remotion:studio` | Remotion Studio |
| `npm run render:cli` | CLI MP4 render |
