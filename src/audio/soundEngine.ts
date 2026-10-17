/**
 * Site audio: original MP3 background music + Web Audio fight SFX.
 * BGM starts at 30s and loops from 30s → end (never plays the intro).
 */

type FightCue = 'intro' | 'whoosh' | 'impact' | 'blast' | 'clash' | 'reveal' | 'draw'

/** Skip the opening; every play and every loop begins here. */
export const BGM_LOOP_START_SEC = 30

const BGM_SRC = '/audio/original-bg.mp3'
const BGM_VOLUME = 0.55

let sharedCtx: AudioContext | null = null
let bgAudio: HTMLAudioElement | null = null
let muted = false
let ambientDesired = true
let loopHandlerAttached = false

function getCtx(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext()
  }
  return sharedCtx
}

function getBgAudio(): HTMLAudioElement {
  if (!bgAudio) {
    bgAudio = new Audio(BGM_SRC)
    bgAudio.preload = 'auto'
    bgAudio.loop = false
    bgAudio.volume = BGM_VOLUME
  }
  if (!loopHandlerAttached) {
    loopHandlerAttached = true
    bgAudio.addEventListener('ended', () => {
      if (!ambientDesired || muted || !bgAudio) return
      bgAudio.currentTime = BGM_LOOP_START_SEC
      void bgAudio.play().catch(() => {
        /* autoplay blocked — wait for next gesture */
      })
    })
  }
  return bgAudio
}

function seekToLoopStart(audio: HTMLAudioElement): void {
  if (audio.currentTime < BGM_LOOP_START_SEC) {
    audio.currentTime = BGM_LOOP_START_SEC
  }
}

function pauseBg(): void {
  if (bgAudio) {
    bgAudio.pause()
  }
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('power-battles-muted', value ? '1' : '0')
  }
  if (muted) {
    pauseBg()
  } else if (ambientDesired) {
    void startAmbient()
  }
}

export function loadMutePreference(): boolean {
  if (typeof localStorage === 'undefined') return false
  muted = localStorage.getItem('power-battles-muted') === '1'
  return muted
}

function now(): number {
  return getCtx().currentTime
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gainLevel: number,
  when = now(),
  filterFreq?: number,
): void {
  if (muted) return
  const ctx = getCtx()
  if (ctx.state === 'suspended') void ctx.resume()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, when)

  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(gainLevel, when + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)

  if (filterFreq) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    osc.connect(filter)
    filter.connect(gain)
  } else {
    osc.connect(gain)
  }

  gain.connect(ctx.destination)
  osc.start(when)
  osc.stop(when + duration + 0.02)
}

function noiseBurst(duration: number, gainLevel: number, when = now(), highpass = 400): void {
  if (muted) return
  const ctx = getCtx()
  if (ctx.state === 'suspended') void ctx.resume()

  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  }

  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = highpass
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(gainLevel, when)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start(when)
  src.stop(when + duration)
}

export function playFightCue(cue: FightCue): void {
  if (muted) return
  const t = now()
  switch (cue) {
    case 'intro':
      tone(220, 0.35, 'sawtooth', 0.04, t, 800)
      tone(330, 0.4, 'triangle', 0.03, t + 0.08, 1200)
      break
    case 'whoosh':
      noiseBurst(0.28, 0.08, t, 600)
      tone(180, 0.22, 'sine', 0.03, t, 900)
      break
    case 'impact':
      tone(90, 0.18, 'square', 0.07, t, 400)
      noiseBurst(0.12, 0.1, t, 200)
      break
    case 'blast':
      tone(140, 0.45, 'sawtooth', 0.06, t, 1400)
      tone(420, 0.3, 'triangle', 0.04, t + 0.05, 2000)
      noiseBurst(0.35, 0.07, t, 500)
      break
    case 'clash':
      tone(110, 0.25, 'square', 0.08, t, 500)
      tone(880, 0.2, 'sawtooth', 0.05, t + 0.02, 3000)
      noiseBurst(0.4, 0.12, t, 300)
      tone(55, 0.5, 'sine', 0.06, t + 0.05, 200)
      break
    case 'reveal':
      tone(523.25, 0.35, 'triangle', 0.05, t)
      tone(659.25, 0.4, 'triangle', 0.045, t + 0.12)
      tone(783.99, 0.55, 'sine', 0.04, t + 0.24)
      break
    case 'draw':
      tone(392, 0.3, 'triangle', 0.04, t)
      tone(349.23, 0.45, 'sine', 0.035, t + 0.15)
      break
    default:
      break
  }
}

/**
 * Start (or resume) the original MP3 BGM from 30s.
 * Respects mute; autoplay may require a prior user gesture.
 */
export async function startAmbient(): Promise<void> {
  ambientDesired = true
  if (muted) return

  const audio = getBgAudio()

  const playFromLoopStart = async () => {
    if (muted || !ambientDesired) return
    seekToLoopStart(audio)
    try {
      await audio.play()
      // Some browsers ignore seek before play; re-assert after play starts.
      seekToLoopStart(audio)
    } catch {
      /* autoplay blocked — SoundProvider unlocks on first gesture */
    }
  }

  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    await playFromLoopStart()
  } else {
    await new Promise<void>((resolve) => {
      const onMeta = () => {
        audio.removeEventListener('loadedmetadata', onMeta)
        void playFromLoopStart().finally(resolve)
      }
      audio.addEventListener('loadedmetadata', onMeta)
      audio.load()
    })
  }
}

export function stopAmbient(): void {
  ambientDesired = false
  pauseBg()
}

export async function ensureAudioUnlocked(): Promise<void> {
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()
  if (ambientDesired && !muted) await startAmbient()
}
