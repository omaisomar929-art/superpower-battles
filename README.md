# Power Battles

When numbers become power.

Made by **Yazan Omais** · [omaisyazan074@gmail.com](mailto:omaisyazan074@gmail.com)

Pick two of **66 original heroes**:

- **50 classic** fighters — bases 1–10 × exponents 1–5
- **5 null-base** voids — `0¹`–`0⁵` (power **0**)
- **11 power-zero void variants** — `0⁰`–`10⁰` with **game power 0** (math would say n⁰=1 for n≠0; these use a void override)

Watch a **Learning Mode** cinematic arena fight, practice **Expand Mode** (place-value powers of ten), **Power Mode** (squares, cubes, and custom exponents), play **Question Mode** (stronger / weaker / square-cube quiz → clash), face **Villain Mode / Null Overlord** (grade-6 gauntlet), play **Mini Games** arcade modes, or play **2 Player** local multiplayer (keyboard or phone touch pads). **Arena / Versus:** higher *game* power wins (void n⁰ = 0). **Question Mode**, Villain quizzes, and **Mini Games** grade with *true* math (n⁰ = 1). Never random.

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

### Expand Mode (nested under Learning)

1. From Learning Mode → **EXPAND MODE**, or open `/learning/expand` (also `/expand`)
2. Enter or pick a non-negative integer
3. See place-value expanded form with Unicode superscripts, e.g. `540 = 5×10² + 4×10¹`
4. Place-value heroes charge, clash, and victory-dance to prove the expansion
5. Conventions: `0` → `0`; skip zero digits (`100 = 1×10²`); ones place as `×10⁰` (`7 = 7×10⁰`)

### Power Mode (nested under Learning)

1. From Home / Learning → **POWER MODE**, or open `/learning/power` (also `/power`)
2. Choose **Squared** (exp 2), **Cubed** (exp 3), or **Other** (declare a positive integer exponent)
3. Enter a base → **Compute Power** — e.g. `3² = 3×3 = 9`, `2³ = 8`, `2⁴ = 16`
4. Related heroes fight with ability VFX and a victory dance on the result reveal

## Question Mode (quiz → clash)

1. **Home** → **Question Mode** (or **Question** in the nav / `/question`; `/quiz` redirects)
2. Pick a champion (or randomize)
3. Answer rotating types only: **Who is stronger?**, **Who is weaker?**, **What is n² / n³?** (e.g. What is 6²?)
4. Stronger/weaker always use unequal true powers (no Equal choice). True math: `n⁰ = 1`. Large labels under heroes show **only** base^exponent (e.g. `3⁴`) — no computed value.
5. Correct answers charge your side; misses charge the rival — then a short `FightSequence` proves the math
6. Track score, streak, and grade; **Next Question** or **New Champion**

## Villain Mode (grade 6 gauntlet)

1. **Home** → **VILLAIN MODE** (nav **Villain** / `/villain` or `/null-overlord`)
2. **Choose a villain by difficulty** (unique original bosses — not copyrighted IPs):
   - **Easy — Gloom Glyph** — simpler expanded forms, small squares/cubes, clear compares
   - **Medium — Hex Hollow** — harder numbers, trickier compares
   - **Hard — Null Overlord** — larger powers, multi-step, closer values
   - **UltraHard — Abyss Architect** — toughest grade-6 stretch (still fair)
3. Pick a champion, then clear three waves (content tuned to the chosen difficulty):
   - **Expand the Curse** → minion fight
   - **Square / Cube Trap** → charge → minion fight
   - **Stronger / Weaker Duel** → boss fight vs your chosen villain
4. Correct → score/streak + fight (hero victory dance on gauntlet clear). Wrong → villain **evil victory dance** + seeded dark Web Audio stinger, teach line, **Try Again**

Power Mode, Expand Mode, Versus, Question Mode, and Learning remain unchanged.

## Mini Games (arcade)

1. **Home** → **MINI GAMES** (nav **Mini Games** / `/minigames`)
2. Pick a game, then choose **1 Player** or **2 Player**
3. **1P** — solo score / lives. **2P** — split left/right lanes on one device (touch + optional keyboard: P1 A/D, P2 ←/→)

| Route | Game |
|---|---|
| `/minigames/meteor` | **Power Meteor Shower** — tap the stronger expression before impact |
| `/minigames/cube-comets` | **Cube Comets** — tap true squares or true cubes (wave prompt) |
| `/minigames/expand-asteroids` | **Expand Asteroids** — pick the correct expanded form before timeout |
| `/minigames/void-pull` | **Void Black-Hole Pull** — save expressions that equal the target power |
| `/minigames/laser-lattice` | **Laser Lattice** — pick which beam wins before collide |
| `/minigames/thunder` | **Thunder Round** — 45s stronger/weaker blitz high score |

Superscript math labels throughout. Site BGM / mute header control unchanged.

## 2 Player (local versus)

1. **Home** → **2 Player** (or open `/versus`)
2. Player 1 (left) and Player 2 (right) each pick a **different** hero
3. **Enter Versus** — click/tap the arena for keyboard focus; touch pads work immediately
4. Fight until HP hits 0 or the 90s timer ends (higher HP wins; still tied → draw)

### Controls

| | Move | Fly | Punch | Ability |
|---|---|---|---|---|
| **P1 (left)** | WASD | **Space** (or **W**) fly; release to fall; **S** descend | T | Y |
| **P2 (right)** | Arrow keys | **↑** fly; release to fall; **↓** descend | Enter | Shift |

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
src/minigames/       # arcade catalog + pure engines (true math)
src/pages/           # Home, Gallery, Learning, Arena, Versus, Mini Games
src/pages/minigames/ # per-game React playfields
```

