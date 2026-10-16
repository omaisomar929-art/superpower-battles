import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Player } from '@remotion/player'
import { HEROES, getHeroById, getRandomHeroes } from '../heroes/data'
import { SuperpowerBattlesVideo, type BattlePair } from '../video/SuperpowerBattlesVideo'
import {
  ASPECT_DIMENSIONS,
  VIDEO_DURATION_FRAMES,
  VIDEO_FPS,
  type AspectRatio,
  type BattleSpeed,
  type Intensity,
  type VideoSettings,
  type VideoTheme,
} from '../video/constants'
import { resolveBattle } from '../battleEngine'
import { Download, Loader2, RefreshCw } from 'lucide-react'

function buildDefaultBattles(aId?: string | null, bId?: string | null): BattlePair[] {
  const a = getHeroById(aId ?? '') ?? HEROES[12]
  const b = getHeroById(bId ?? '') ?? HEROES[16]
  const rest = getRandomHeroes(6, [a.id, b.id])
  return [
    { a, b },
    { a: rest[0], b: rest[1] },
    { a: rest[2], b: rest[3] },
    { a: rest[4], b: rest[5] },
  ]
}

export function VideoStudio() {
  const [params] = useSearchParams()
  const [battles, setBattles] = useState<BattlePair[]>(() => buildDefaultBattles(params.get('a'), params.get('b')))
  const [settings, setSettings] = useState<VideoSettings>({
    aspect: '16:9',
    theme: 'neon',
    intensity: 'high',
    speed: 'normal',
    arena: 'neon-colosseum',
    showMath: true,
    mathTiming: 'mid',
    audioEnabled: true,
  })
  const [renderState, setRenderState] = useState<'idle' | 'rendering' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const dims = ASPECT_DIMENSIONS[settings.aspect]
  const featuredWinner = useMemo(() => {
    const last = battles[3]
    if (!last) return null
    return resolveBattle(last.a, last.b).winnerHero
  }, [battles])

  function randomize() {
    setBattles(buildDefaultBattles())
    setDownloadUrl(null)
    setRenderState('idle')
  }

  async function renderMp4() {
    setRenderState('rendering')
    setProgress(0)
    setError(null)
    setDownloadUrl(null)

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battles: battles.map((p) => ({ aId: p.a.id, bId: p.b.id })),
          settings,
          featuredWinnerId: featuredWinner?.id ?? null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Render failed (${res.status})`)
      }

      const { id } = (await res.json()) as { id: string }
      setJobId(id)
      await pollJob(id)
    } catch (err) {
      setRenderState('error')
      setError(err instanceof Error ? err.message : 'Unknown render error')
    }
  }

  async function pollJob(id: string) {
    for (let i = 0; i < 600; i += 1) {
      const res = await fetch(`/api/render/${id}`)
      if (!res.ok) throw new Error('Failed to poll render job')
      const job = (await res.json()) as {
        status: string
        progress: number
        error?: string
        downloadPath?: string
      }
      setProgress(job.progress)
      if (job.status === 'done' && job.downloadPath) {
        setDownloadUrl(job.downloadPath)
        setRenderState('done')
        return
      }
      if (job.status === 'error') {
        throw new Error(job.error ?? 'Render failed')
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    throw new Error('Render timed out')
  }

  async function retry() {
    if (jobId) {
      await fetch(`/api/render/${jobId}`, { method: 'DELETE' }).catch(() => undefined)
    }
    await renderMp4()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-widest text-fuchsia-300">VIDEO STUDIO</h1>
      <p className="mt-2 text-slate-400">
        Exact 30s · 30 FPS · 900 frames. Preview with Remotion Player, then render a real MP4.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="panel overflow-hidden rounded-3xl">
          <div className="bg-black" style={{ aspectRatio: `${dims.width} / ${dims.height}` }}>
            <Player
              component={SuperpowerBattlesVideo}
              inputProps={{ battles, settings, featuredWinner }}
              durationInFrames={VIDEO_DURATION_FRAMES}
              compositionWidth={dims.width}
              compositionHeight={dims.height}
              fps={VIDEO_FPS}
              style={{ width: '100%', height: '100%' }}
              controls
              loop
            />
          </div>
        </div>

        <div className="space-y-4">
          <Control label="Aspect">
            <select
              value={settings.aspect}
              onChange={(e) => setSettings({ ...settings, aspect: e.target.value as AspectRatio })}
              className="field"
            >
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Portrait</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </Control>
          <Control label="Theme">
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as VideoTheme })}
              className="field"
            >
              <option value="neon">Neon</option>
              <option value="inferno">Inferno</option>
              <option value="arctic">Arctic</option>
              <option value="void">Void</option>
            </select>
          </Control>
          <Control label="Intensity">
            <select
              value={settings.intensity}
              onChange={(e) => setSettings({ ...settings, intensity: e.target.value as Intensity })}
              className="field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Control>
          <Control label="Speed">
            <select
              value={settings.speed}
              onChange={(e) => setSettings({ ...settings, speed: e.target.value as BattleSpeed })}
              className="field"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </Control>
          <Control label="Arena">
            <select
              value={settings.arena}
              onChange={(e) => setSettings({ ...settings, arena: e.target.value })}
              className="field"
            >
              <option value="neon-colosseum">Neon Colosseum</option>
              <option value="void-rift">Void Rift</option>
              <option value="storm-spire">Storm Spire</option>
              <option value="ember-crater">Ember Crater</option>
            </select>
          </Control>
          <Control label="Math timing">
            <select
              value={settings.mathTiming}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  mathTiming: e.target.value as VideoSettings['mathTiming'],
                })
              }
              className="field"
            >
              <option value="early">Early</option>
              <option value="mid">Mid</option>
              <option value="late">Late</option>
            </select>
          </Control>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={settings.showMath}
              onChange={(e) => setSettings({ ...settings, showMath: e.target.checked })}
            />
            Show math on screen
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={settings.audioEnabled}
              onChange={(e) => setSettings({ ...settings, audioEnabled: e.target.checked })}
            />
            Audio bed enabled (procedural)
          </label>

          <div className="flex flex-col gap-2 pt-2">
            <button type="button" className="btn-secondary text-xs inline-flex items-center justify-center gap-2" onClick={randomize}>
              <RefreshCw size={14} /> RANDOMIZE BATTLES
            </button>
            <button
              type="button"
              className="btn-primary text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={renderState === 'rendering'}
              onClick={renderMp4}
            >
              {renderState === 'rendering' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {renderState === 'rendering' ? `RENDERING ${Math.round(progress * 100)}%` : 'RENDER MP4'}
            </button>
            {renderState === 'error' && (
              <button type="button" className="btn-secondary text-xs" onClick={retry}>
                RETRY
              </button>
            )}
            {downloadUrl && (
              <a href={downloadUrl} download className="btn-primary text-xs text-center">
                DOWNLOAD MP4
              </a>
            )}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {renderState === 'done' && <p className="text-xs text-emerald-400">Render complete. Download your 30s MP4.</p>}

          <div className="rounded-xl border border-white/10 p-3 text-[11px] text-slate-400 space-y-1">
            <div>Frames: {VIDEO_DURATION_FRAMES}</div>
            <div>FPS: {VIDEO_FPS}</div>
            <div>Duration: 30.00s</div>
            <div>Battles in export: 4</div>
            <div>
              Fighters:{' '}
              {Array.from(new Set(battles.flatMap((p) => [p.a.name, p.b.name]))).length} unique
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {battles.map((pair, i) => {
          const r = resolveBattle(pair.a, pair.b)
          return (
            <div key={i} className="panel rounded-2xl p-3 text-sm">
              <div className="text-xs text-slate-500">BATTLE {i + 1}</div>
              <div className="mt-1 font-mono text-xs">
                {pair.a.expression} vs {pair.b.expression}
              </div>
              <div className="mt-1 text-amber-200 text-xs">
                {r.winner === 'draw' ? 'DRAW' : r.winnerHero?.name} · {r.explanation}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs tracking-wide text-slate-400">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}
