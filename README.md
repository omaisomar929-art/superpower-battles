# Power Battles

When numbers become power.

Made by **Yazan Omais** · [omaisyazan074@gmail.com](mailto:omaisyazan074@gmail.com)

Pick two of **66 original heroes**:

- **50 classic** fighters — bases 1–10 × exponents 1–5
- **5 null-base** voids — `0¹`–`0⁵` (power **0**)
- **11 power-zero void variants** — `0⁰`–`10⁰` with **game power 0** (math would say n⁰=1 for n≠0; these use a void override)

Watch a **Learning Mode** cinematic arena fight, or play **2 Player** local multiplayer (keyboard or phone touch pads). **Higher power wins. Equal powers draw. Power 0 loses to any positive. Two zeros draw. Never random.**

No video render server. No separate API. Just the site.

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Learning Mode (cinematic)

1. **Home** → **Learning Mode** (or open **Learning** in the nav / `/select`)
2. Choose Fighter A and Fighter B (or **Randomize**)
3. **Enter Arena**
4. Watch the animated sequence; both fighters punch and fire unique abilities; the math on screen matches the winner
5. **Back to Learning Mode** or **Random Rematch**

## 2 Player (local versus)

1. **Home** → **2 Player** (or open `/versus`)
2. Player 1 (left) and Player 2 (right) each pick a **different** hero
3. **Enter Versus** — click/tap the arena for keyboard focus; touch pads work immediately
4. Fight until HP hits 0 or the 90s timer ends (higher HP wins; still tied → draw)

### Controls

| | Move | Fly (hold-to-ascend) | Punch | Ability |
|---|---|---|---|---|
| **P1 (left)** | WASD | Hold **W** or **Space** to ascend; release to fall; **S** descend | T | Y |
| **P2 (right)** | Arrow keys | Hold **↑** to ascend; release to fall; **↓** descend | Enter | Shift |

### Phone / touch

On `/versus` arena, dual on-screen pads appear:

- **P1** — left side: d-pad (move + fly), Punch, Ability
- **P2** — right side: same layout mirrored

Large tap targets, `touch-action: none`, scroll/zoom blocked while fighting. Keyboard still works on desktop.

### Damage rules (math-gated)

- Attacker power **>** defender → punches & abilities deal damage
- Attacker power **<** defender → hits land visually but **0 damage** (blocked)
- **Equal** power → both can damage
- Power expressions (`base^exponent = power`) are shown in the HUD

Use the speaker icon in the header to mute/unmute background music and fight SFX. Site-wide BGM is the original MP3 at `public/audio/original-bg.mp3` (served as `/audio/original-bg.mp3`), starting at **0:35** and looping from 35s → end (the opening is never played). On load the app calls `tryAutoplayAmbient()` (unmuted first, muted fallback if needed). True unmuted autoplay may still be blocked by the browser with zero interaction — that is browser policy, not something the app can force. Any first `pointerdown` / `touchstart` / `click` / `keydown` on normal UI unlocks/starts BGM if not muted (no dedicated audio-start button). Mute preference is session-scoped (default unmuted each visit). Fight cues remain Web Audio synthesis.

## Stack

- React + TypeScript + Vite + Tailwind
- Framer Motion (arena sequence)
- HTMLAudioElement BGM + Web Audio fight SFX
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
src/animations/      # live arena fight sequence + ability / punch VFX
src/versus/          # 2P damage rules + controllable arena + touch pads
src/audio/           # MP3 BGM (from 0:35) + fight SFX
public/audio/        # original-bg.mp3
src/pages/           # Home, Gallery, Learning Mode select, Arena, Versus
```
