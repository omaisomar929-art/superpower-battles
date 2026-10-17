/**
 * Original Web Audio synthesis — ambient loop + anime-inspired clash SFX.
 * No copyrighted samples or ripped OST.
 */

type FightCue = 'intro' | 'whoosh' | 'impact' | 'blast' | 'clash' | 'reveal' | 'draw'

let sharedCtx: AudioContext | null = null
let ambientNodes: { gain: GainNode; stop: () => void } | null = null
let muted = false
let ambientDesired = true

function getCtx(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext()
  }
  return sharedCtx
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
    stopAmbient()
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

export async function startAmbient(): Promise<void> {
  ambientDesired = true
  if (muted) return
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()
  if (ambientNodes) return

  const master = ctx.createGain()
  master.gain.value = 0.035
  master.connect(ctx.destination)

  const oscillators: OscillatorNode[] = []
  const freqs = [55, 82.5, 110, 164.8]
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    const gain = ctx.createGain()
    osc.type = i % 2 === 0 ? 'sine' : 'triangle'
    osc.frequency.value = freq
    lfo.frequency.value = 0.08 + i * 0.03
    lfoGain.gain.value = 4 + i
    gain.gain.value = 0.2 / (i + 1)
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    osc.connect(gain)
    gain.connect(master)
    osc.start()
    lfo.start()
    oscillators.push(osc, lfo)
  })

  // Soft pulsing pad
  const pulse = ctx.createOscillator()
  const pulseGain = ctx.createGain()
  pulse.type = 'sine'
  pulse.frequency.value = 220
  pulseGain.gain.value = 0.01
  const pulseLfo = ctx.createOscillator()
  const pulseLfoGain = ctx.createGain()
  pulseLfo.frequency.value = 0.15
  pulseLfoGain.gain.value = 0.008
  pulseLfo.connect(pulseLfoGain)
  pulseLfoGain.connect(pulseGain.gain)
  pulse.connect(pulseGain)
  pulseGain.connect(master)
  pulse.start()
  pulseLfo.start()
  oscillators.push(pulse, pulseLfo)

  ambientNodes = {
    gain: master,
    stop: () => {
      oscillators.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* already stopped */
        }
      })
      master.disconnect()
    },
  }
}

export function stopAmbient(): void {
  ambientDesired = false
  if (ambientNodes) {
    ambientNodes.stop()
    ambientNodes = null
  }
}

export async function ensureAudioUnlocked(): Promise<void> {
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()
  if (ambientDesired && !muted) await startAmbient()
}
