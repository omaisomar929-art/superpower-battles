import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { HEROES, getHeroById } from '../src/heroes/data'
import type { VideoSettings } from '../src/video/constants'
import { ASPECT_DIMENSIONS } from '../src/video/constants'
import type { BattlePair } from '../src/video/SuperpowerBattlesVideo'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'renders')
const PORT = Number(process.env.RENDER_PORT ?? 43128)

fs.mkdirSync(outDir, { recursive: true })

type JobStatus = 'queued' | 'bundling' | 'rendering' | 'done' | 'error'

interface Job {
  id: string
  status: JobStatus
  progress: number
  error?: string
  downloadPath?: string
  outputFile?: string
  createdAt: number
  battles: BattlePair[]
  settings: VideoSettings
  featuredWinnerId: string | null
}

const jobs = new Map<string, Job>()
let bundleLocation: string | null = null
let bundlingPromise: Promise<string> | null = null

async function ensureBundle(): Promise<string> {
  if (bundleLocation) return bundleLocation
  if (bundlingPromise) return bundlingPromise
  bundlingPromise = bundle({
    entryPoint: path.join(root, 'src/video/index.ts'),
    webpackOverride: (config) => config,
  }).then((loc) => {
    bundleLocation = loc
    return loc
  })
  return bundlingPromise
}

function compositionIdForAspect(aspect: VideoSettings['aspect']): string {
  if (aspect === '9:16') return 'SuperpowerBattlesPortrait'
  if (aspect === '1:1') return 'SuperpowerBattlesSquare'
  return 'SuperpowerBattles'
}

async function runJob(job: Job) {
  try {
    job.status = 'bundling'
    job.progress = 0.02
    const serveUrl = await ensureBundle()

    job.status = 'rendering'
    const compositionId = compositionIdForAspect(job.settings.aspect)
    const dims = ASPECT_DIMENSIONS[job.settings.aspect]
    const featuredWinner = job.featuredWinnerId ? getHeroById(job.featuredWinnerId) ?? null : null

    const inputProps = {
      battles: job.battles,
      settings: job.settings,
      featuredWinner,
    }

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    })

    const filename = `superpower-battles-${job.id}.mp4`
    const outputPath = path.join(outDir, filename)

    await renderMedia({
      composition: {
        ...composition,
        width: dims.width,
        height: dims.height,
      },
      serveUrl,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        job.progress = Math.min(0.99, 0.05 + progress * 0.94)
      },
    })

    job.progress = 1
    job.status = 'done'
    job.outputFile = outputPath
    job.downloadPath = `/api/download/${filename}`
  } catch (err) {
    job.status = 'error'
    job.error = err instanceof Error ? err.message : String(err)
    console.error('Render job failed', job.id, err)
  }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ffmpegHint: 'Remotion bundles its own ffmpeg binaries when needed' })
})

app.post('/api/render', async (req, res) => {
  try {
    const body = req.body as {
      battles: { aId: string; bId: string }[]
      settings: VideoSettings
      featuredWinnerId?: string | null
    }

    const battles: BattlePair[] = (body.battles ?? []).map((pair) => {
      const a = getHeroById(pair.aId) ?? HEROES[0]
      const b = getHeroById(pair.bId) ?? HEROES[1]
      return { a, b }
    })

    while (battles.length < 4) {
      battles.push({ a: HEROES[battles.length * 2], b: HEROES[battles.length * 2 + 1] })
    }

    const id = randomUUID().slice(0, 8)
    const job: Job = {
      id,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      battles: battles.slice(0, 4),
      settings: body.settings,
      featuredWinnerId: body.featuredWinnerId ?? null,
    }
    jobs.set(id, job)
    void runJob(job)
    res.json({ id })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/api/render/:id', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }
  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.error,
    downloadPath: job.downloadPath,
  })
})

app.delete('/api/render/:id', (req, res) => {
  const job = jobs.get(req.params.id)
  if (job?.outputFile && fs.existsSync(job.outputFile)) {
    fs.unlinkSync(job.outputFile)
  }
  jobs.delete(req.params.id)
  res.json({ ok: true })
})

app.get('/api/download/:file', (req, res) => {
  const file = req.params.file
  if (!/^superpower-battles-[a-zA-Z0-9-]+\.mp4$/.test(file)) {
    res.status(400).send('Invalid file')
    return
  }
  const full = path.join(outDir, file)
  if (!fs.existsSync(full)) {
    res.status(404).send('Not found')
    return
  }
  res.download(full, file, (err) => {
    if (err) console.error('Download error', err)
  })
})

// Cleanup old renders (>2h)
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) {
      if (job.outputFile && fs.existsSync(job.outputFile)) fs.unlinkSync(job.outputFile)
      jobs.delete(id)
    }
  }
}, 15 * 60 * 1000).unref()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Render server listening on http://127.0.0.1:${PORT}`)
})
