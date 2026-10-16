import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { Hero } from '../heroes/types'
import { resolveBattle } from '../battleEngine'
import { TIMELINE, type VideoSettings } from './constants'
import { HeroArt } from '../heroes/HeroArt'
import { formatPower } from '../mathEngine'

export interface BattlePair {
  a: Hero
  b: Hero
}

export interface SuperpowerBattlesVideoProps {
  battles: BattlePair[]
  settings: VideoSettings
  featuredWinner?: Hero | null
}

const THEME_BG: Record<VideoSettings['theme'], string> = {
  neon: 'linear-gradient(160deg, #050816 0%, #1a0b2e 40%, #0b1d3a 100%)',
  inferno: 'linear-gradient(160deg, #1a0505 0%, #3b0a0a 45%, #1a0a05 100%)',
  arctic: 'linear-gradient(160deg, #031018 0%, #0a2540 45%, #062033 100%)',
  void: 'linear-gradient(160deg, #050508 0%, #150828 50%, #080510 100%)',
}

function Particles({ count, color }: { count: number; color: string }) {
  const frame = useCurrentFrame()
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = (i * 97) % 100
        const y = (i * 53 + frame * (0.2 + (i % 5) * 0.05)) % 120
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y - 10}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              borderRadius: '50%',
              background: color,
              opacity: 0.25 + (i % 4) * 0.1,
            }}
          />
        )
      })}
    </>
  )
}

function IntroScene({ battles }: { battles: BattlePair[] }) {
  const frame = useCurrentFrame()
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const subY = interpolate(frame, [15, 40], [30, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Orbitron, sans-serif',
      }}
    >
      <div style={{ opacity: titleOpacity, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: 8,
            color: '#e879f9',
            textShadow: '0 0 40px #a855f7',
          }}
        >
          SUPERPOWER BATTLES
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            color: '#7dd3fc',
            transform: `translateY(${subY}px)`,
            letterSpacing: 4,
          }}
        >
          WHEN NUMBERS BECOME POWER.
        </div>
        <div style={{ marginTop: 40, color: '#94a3b8', fontSize: 18 }}>
          {battles.length} battles · math decides everything
        </div>
      </div>
    </AbsoluteFill>
  )
}

function BattleScene({ pair, settings, label }: { pair: BattlePair; settings: VideoSettings; label: string }) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const result = resolveBattle(pair.a, pair.b)

  const introEnd = Math.floor(durationInFrames * 0.18)
  const fightEnd = Math.floor(durationInFrames * 0.55)
  const compareEnd = Math.floor(durationInFrames * 0.78)

  const clash = interpolate(frame, [introEnd, fightEnd], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const mathReveal =
    settings.mathTiming === 'early'
      ? interpolate(frame, [introEnd, introEnd + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : settings.mathTiming === 'late'
        ? interpolate(frame, [compareEnd - 10, compareEnd + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        : interpolate(frame, [fightEnd, compareEnd], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const aX = interpolate(clash, [0, 1], [-80, 20])
  const bX = interpolate(clash, [0, 1], [80, -20])
  const shake = frame > fightEnd && frame < compareEnd ? Math.sin(frame * 1.8) * 6 : 0

  const phase =
    frame < introEnd ? 'INTRO' : frame < fightEnd ? 'BATTLE' : frame < compareEnd ? 'POWER CHECK' : 'RESULT'

  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 18,
          letterSpacing: 6,
          fontFamily: 'monospace',
        }}
      >
        {label} · {phase}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          padding: '80px 80px 120px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ transform: `translateX(${aX}px)`, textAlign: 'center', width: '38%' }}>
          <HeroArt hero={pair.a} size={220} animated />
          <div style={{ color: pair.a.mainColor, fontSize: 28, fontWeight: 800, marginTop: 12 }}>{pair.a.name}</div>
          <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 22 }}>{pair.a.expression}</div>
          <div
            style={{
              marginTop: 8,
              height: 10,
              background: '#1e293b',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(8, 100 - clash * (result.winner === 'b' ? 90 : result.winner === 'draw' ? 50 : 20))}%`,
                height: '100%',
                background: pair.a.secondaryColor,
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', width: '24%' }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#f472b6',
              textShadow: '0 0 30px #db2777',
              opacity: clash,
            }}
          >
            VS
          </div>
          {settings.showMath && (
            <div
              style={{
                opacity: mathReveal,
                marginTop: 20,
                padding: 16,
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid #334155',
                borderRadius: 12,
                color: '#f8fafc',
                fontFamily: 'monospace',
                fontSize: 16,
              }}
            >
              <div>
                {result.expressionA} = {formatPower(result.powerA)}
              </div>
              <div style={{ margin: '8px 0', color: '#94a3b8' }}>vs</div>
              <div>
                {result.expressionB} = {formatPower(result.powerB)}
              </div>
            </div>
          )}
        </div>

        <div style={{ transform: `translateX(${bX}px)`, textAlign: 'center', width: '38%' }}>
          <HeroArt hero={pair.b} size={220} animated />
          <div style={{ color: pair.b.mainColor, fontSize: 28, fontWeight: 800, marginTop: 12 }}>{pair.b.name}</div>
          <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 22 }}>{pair.b.expression}</div>
          <div
            style={{
              marginTop: 8,
              height: 10,
              background: '#1e293b',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(8, 100 - clash * (result.winner === 'a' ? 90 : result.winner === 'draw' ? 50 : 20))}%`,
                height: '100%',
                background: pair.b.secondaryColor,
              }}
            />
          </div>
        </div>
      </div>

      {frame >= compareEnd && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              padding: '16px 36px',
              background: 'rgba(2,6,23,0.9)',
              border: '2px solid #e879f9',
              borderRadius: 16,
              color: '#fdf4ff',
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {result.winner === 'draw'
              ? `DRAW · ${result.explanation}`
              : `WINNER: ${result.winnerHero?.name} · ${result.explanation}`}
          </div>
        </div>
      )}
    </AbsoluteFill>
  )
}

function OutroScene({ winner }: { winner: Hero | null }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#94a3b8', letterSpacing: 8, fontSize: 18, marginBottom: 16 }}>FEATURED WINNER</div>
        {winner ? (
          <>
            <HeroArt hero={winner} size={260} animated />
            <div style={{ color: winner.mainColor, fontSize: 40, fontWeight: 900, marginTop: 16 }}>{winner.name}</div>
            <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 28, marginTop: 8 }}>
              {winner.expression} = {formatPower(winner.power)}
            </div>
          </>
        ) : (
          <div style={{ color: '#f8fafc', fontSize: 36 }}>SPECTACULAR DRAW</div>
        )}
        <div style={{ marginTop: 40, color: '#a78bfa', fontSize: 22, letterSpacing: 4 }}>SUPERPOWER BATTLES</div>
      </div>
    </AbsoluteFill>
  )
}

export function SuperpowerBattlesVideo({ battles, settings, featuredWinner }: SuperpowerBattlesVideoProps) {
  const safeBattles = battles.slice(0, 4)
  while (safeBattles.length < 4 && battles[0]) {
    safeBattles.push(battles[safeBattles.length % battles.length])
  }

  const intensityParticles = settings.intensity === 'high' ? 60 : settings.intensity === 'medium' ? 36 : 18
  const lastResult = safeBattles[3] ? resolveBattle(safeBattles[3].a, safeBattles[3].b) : null
  const winner = featuredWinner ?? lastResult?.winnerHero ?? safeBattles[0]?.a ?? null

  const segments = [
    TIMELINE.battle1,
    TIMELINE.battle2,
    TIMELINE.battle3,
    TIMELINE.battle4,
  ]

  return (
    <AbsoluteFill style={{ background: THEME_BG[settings.theme], overflow: 'hidden' }}>
      <Particles count={intensityParticles} color={settings.theme === 'inferno' ? '#fb923c' : '#a78bfa'} />

      <Sequence from={TIMELINE.intro.start} durationInFrames={TIMELINE.intro.end - TIMELINE.intro.start}>
        <IntroScene battles={safeBattles} />
      </Sequence>

      {safeBattles.map((pair, index) => {
        const seg = segments[index]
        return (
          <Sequence
            key={`battle-${index}`}
            from={seg.start}
            durationInFrames={seg.end - seg.start}
          >
            <BattleScene pair={pair} settings={settings} label={`BATTLE ${index + 1}`} />
          </Sequence>
        )
      })}

      <Sequence from={TIMELINE.outro.start} durationInFrames={TIMELINE.outro.end - TIMELINE.outro.start}>
        <OutroScene winner={winner} />
      </Sequence>
    </AbsoluteFill>
  )
}
