/**
 * Site audio: original MP3 background music + Web Audio fight SFX.
 * BGM starts at 35s and loops from 35s → end (never plays the intro).
 * Victory stingers are procedural (Web Audio) — never copyrighted clips.
 */

import type { Hero } from '../heroes/types'
import { getAbilityFx, type AbilityFamily } from '../animations/abilityFx'
import { powerToIntensity } from '../animations/victoryDance'

export type FightCue =
  | 'intro'
  | 'whoosh'
  | 'impact'
  | 'blast'
  | 'clash'
  | 'reveal'
  | 'draw'
  | 'ability-fire'
  | 'ability-void'
  | 'ability-ice'
  | 'ability-lightning'
  | 'ability-cosmic'
  | 'ability-shadow'
  | 'ability-earth'
  | 'ability-wind'
  | 'ability-plasma'
  | 'ability-crystal'

/** Result of attempting BGM autoplay on mount. */
export type AutoplayResult = 'playing' | 'muted-playing' | 'blocked' | 'skipped'

/** Skip the opening; every play and every loop begins here. */
export const BGM_LOOP_START_SEC = 35

const BGM_SRC = '/audio/original-bg.mp3'
const BGM_VOLUME = 0.55

let sharedCtx: AudioContext | null = null
let bgAudio: HTMLAudioElement | null = null
let muted = false
let ambientDesired = true
let loopHandlerAttached = false
/** True while playing muted only to bypass autoplay policy; awaiting first gesture to unmute. */
let awaitingGestureUnmute = false
/** Active victory-stinger duck restore timer. */
let bgmDuckTimer: ReturnType<typeof setTimeout> | null = null
let bgmPreDuckVolume = 0.55

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

/** Force playback cursor to the loop start (used on mount / explicit start). */
function forceLoopStart(audio: HTMLAudioElement): void {
  audio.currentTime = BGM_LOOP_START_SEC
}

/** If the browser ignored a prior seek and is still in the intro, jump to 35s. */
function ensurePastIntro(audio: HTMLAudioElement): void {
  if (audio.currentTime < BGM_LOOP_START_SEC) {
    audio.currentTime = BGM_LOOP_START_SEC
  }
}

async function waitForMetadata(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) return
  await new Promise<void>((resolve) => {
    const onMeta = () => {
      audio.removeEventListener('loadedmetadata', onMeta)
      resolve()
    }
    audio.addEventListener('loadedmetadata', onMeta)
    audio.load()
  })
}

function pauseBg(): void {
  if (bgAudio) {
    bgAudio.pause()
  }
}

export function isMuted(): boolean {
  return muted
}

const MUTE_SESSION_KEY = 'power-battles-muted'

export function setMuted(value: boolean): void {
  muted = value
  awaitingGestureUnmute = false
  // Session-scoped so a stuck mute from prior testing does not silence new visits.
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(MUTE_SESSION_KEY, value ? '1' : '0')
  }
  if (muted) {
    const audio = bgAudio
    if (audio) {
      audio.muted = false
      pauseBg()
    }
  } else if (ambientDesired) {
    void startAmbient()
  }
}

/** Default unmuted each browser session; mute toggle still works within the session. */
export function loadMutePreference(): boolean {
  if (typeof localStorage !== 'undefined') {
    // Drop legacy persistent mute so first-time / returning users are not blocked.
    localStorage.removeItem(MUTE_SESSION_KEY)
  }
  if (typeof sessionStorage === 'undefined') {
    muted = false
    return false
  }
  muted = sessionStorage.getItem(MUTE_SESSION_KEY) === '1'
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
    case 'ability-fire':
      noiseBurst(0.32, 0.09, t, 500)
      tone(160, 0.28, 'sawtooth', 0.045, t, 1100)
      tone(90, 0.35, 'sine', 0.03, t + 0.04, 400)
      break
    case 'ability-void':
      tone(48, 0.55, 'sine', 0.07, t, 180)
      tone(72, 0.45, 'triangle', 0.04, t + 0.05, 220)
      noiseBurst(0.5, 0.06, t, 120)
      break
    case 'ability-ice':
      noiseBurst(0.18, 0.08, t, 2200)
      tone(980, 0.12, 'triangle', 0.04, t, 4000)
      tone(640, 0.2, 'sine', 0.03, t + 0.06, 3000)
      break
    case 'ability-lightning':
      noiseBurst(0.08, 0.12, t, 1500)
      tone(1200, 0.08, 'square', 0.05, t, 5000)
      tone(180, 0.15, 'sawtooth', 0.04, t + 0.03, 900)
      break
    case 'ability-cosmic':
      tone(220, 0.4, 'sine', 0.05, t, 1600)
      tone(440, 0.35, 'triangle', 0.04, t + 0.08, 2400)
      tone(660, 0.3, 'sine', 0.03, t + 0.16, 2800)
      break
    case 'ability-shadow':
      tone(70, 0.4, 'triangle', 0.05, t, 300)
      noiseBurst(0.35, 0.05, t, 250)
      tone(110, 0.25, 'sine', 0.03, t + 0.1, 400)
      break
    case 'ability-earth':
      tone(55, 0.35, 'square', 0.06, t, 250)
      noiseBurst(0.28, 0.09, t, 180)
      tone(90, 0.2, 'sine', 0.035, t + 0.08, 350)
      break
    case 'ability-wind':
      noiseBurst(0.4, 0.07, t, 800)
      tone(300, 0.3, 'sine', 0.025, t, 2000)
      break
    case 'ability-plasma':
      tone(380, 0.28, 'sawtooth', 0.045, t, 2200)
      tone(760, 0.22, 'triangle', 0.035, t + 0.05, 3200)
      noiseBurst(0.22, 0.06, t, 900)
      break
    case 'ability-crystal':
      tone(880, 0.15, 'triangle', 0.04, t)
      tone(1320, 0.18, 'sine', 0.03, t + 0.05)
      noiseBurst(0.12, 0.05, t + 0.02, 2800)
      break
    default:
      break
  }
}

/**
 * Start (or resume) the original MP3 BGM from 35s, unmuted.
 * Respects app mute; may still fail without a user gesture.
 */
export async function startAmbient(): Promise<void> {
  ambientDesired = true
  if (muted) return

  const audio = getBgAudio()
  await waitForMetadata(audio)
  if (muted || !ambientDesired) return

  awaitingGestureUnmute = false
  audio.muted = false
  forceLoopStart(audio)
  try {
    await audio.play()
    // Some browsers ignore seek before play; re-assert after play starts.
    ensurePastIntro(audio)
  } catch {
    /* autoplay blocked — SoundProvider unlocks on first gesture */
  }
}

/**
 * On mount: seek to 35s, try unmuted play immediately.
 * If blocked, fall back to muted autoplay (unmute on first gesture).
 * If that also fails, return 'blocked' so the provider plays on first gesture.
 */
export async function tryAutoplayAmbient(): Promise<AutoplayResult> {
  ambientDesired = true
  if (muted) return 'skipped'

  const audio = getBgAudio()
  await waitForMetadata(audio)
  if (muted || !ambientDesired) return 'skipped'

  forceLoopStart(audio)

  try {
    audio.muted = false
    awaitingGestureUnmute = false
    await audio.play()
    ensurePastIntro(audio)
    return 'playing'
  } catch {
    /* unmuted autoplay blocked — try muted */
  }

  if (muted || !ambientDesired) return 'skipped'

  try {
    audio.muted = true
    forceLoopStart(audio)
    await audio.play()
    ensurePastIntro(audio)
    awaitingGestureUnmute = true
    return 'muted-playing'
  } catch {
    audio.muted = false
    awaitingGestureUnmute = false
    return 'blocked'
  }
}

/** Unmute element after muted-autoplay fallback (call from a user gesture). */
export async function unlockAmbientSound(): Promise<void> {
  if (muted) return
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()

  const audio = getBgAudio()
  audio.muted = false
  awaitingGestureUnmute = false
  ambientDesired = true

  if (audio.paused) {
    forceLoopStart(audio)
    try {
      await audio.play()
      ensurePastIntro(audio)
    } catch {
      /* still blocked */
    }
  }
}

export function stopAmbient(): void {
  ambientDesired = false
  awaitingGestureUnmute = false
  pauseBg()
}

export async function ensureAudioUnlocked(): Promise<void> {
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()
  if (!ambientDesired || muted) return
  if (awaitingGestureUnmute) {
    await unlockAmbientSound()
    return
  }
  const audio = getBgAudio()
  // Already playing with sound — do not restart from 35s on incidental gestures.
  if (!audio.paused && !audio.muted) return
  await startAmbient()
}

/* ─── Victory stinger (procedural, per-hero) ─────────────────────────── */

type ScaleMode = 'major' | 'minor' | 'pentatonic' | 'whole' | 'chromatic-dark'

interface VictoryStingerProfile {
  bpm: number
  rootHz: number
  mode: ScaleMode
  oscType: OscillatorType
  noteCount: number
  durationSec: number
  brightness: number
  family: AbilityFamily
}

const MAJOR = [0, 4, 7, 12, 16, 19, 24]
const MINOR = [0, 3, 7, 12, 15, 19, 24]
const PENTA = [0, 3, 5, 7, 10, 12, 15]
const WHOLE = [0, 2, 4, 6, 8, 10, 12]
const DARK = [0, 1, 3, 6, 7, 8, 11, 12]

const SCALES: Record<ScaleMode, number[]> = {
  major: MAJOR,
  minor: MINOR,
  pentatonic: PENTA,
  whole: WHOLE,
  'chromatic-dark': DARK,
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '').trim()
  if (h.length === 3) {
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
    }
  }
  if (h.length >= 6) {
    return {
      r: parseInt(h.slice(0, 2), 16) || 0,
      g: parseInt(h.slice(2, 4), 16) || 0,
      b: parseInt(h.slice(4, 6), 16) || 0,
    }
  }
  return { r: 80, g: 120, b: 200 }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: h * 360, s, l }
}

function familyTimbre(family: AbilityFamily): {
  osc: OscillatorType
  mode: ScaleMode
  rootBias: number
  bell: boolean
  drone: boolean
} {
  switch (family) {
    case 'void':
      return { osc: 'sine', mode: 'chromatic-dark', rootBias: 55, bell: false, drone: true }
    case 'fire':
      return { osc: 'sawtooth', mode: 'major', rootBias: 196, bell: false, drone: false }
    case 'ice':
      return { osc: 'triangle', mode: 'pentatonic', rootBias: 392, bell: true, drone: false }
    case 'lightning':
      return { osc: 'square', mode: 'whole', rootBias: 330, bell: false, drone: false }
    case 'cosmic':
      return { osc: 'sine', mode: 'major', rootBias: 262, bell: true, drone: true }
    case 'shadow':
      return { osc: 'triangle', mode: 'minor', rootBias: 98, bell: false, drone: true }
    case 'earth':
      return { osc: 'square', mode: 'minor', rootBias: 82, bell: false, drone: false }
    case 'wind':
      return { osc: 'sine', mode: 'pentatonic', rootBias: 294, bell: false, drone: false }
    case 'plasma':
      return { osc: 'sawtooth', mode: 'whole', rootBias: 220, bell: false, drone: false }
    case 'crystal':
      return { osc: 'triangle', mode: 'major', rootBias: 440, bell: true, drone: false }
    default:
      return { osc: 'triangle', mode: 'major', rootBias: 220, bell: false, drone: false }
  }
}

function hashStr(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Build a unique victory jingle profile from hero power + colors + ability family. */
export function getVictoryStingerProfile(hero: Hero): VictoryStingerProfile {
  const fx = getAbilityFx(hero)
  const timbre = familyTimbre(fx.family)
  const intensity = powerToIntensity(hero.power)
  const main = rgbToHsl(parseHex(hero.mainColor).r, parseHex(hero.mainColor).g, parseHex(hero.mainColor).b)
  const sec = rgbToHsl(
    parseHex(hero.secondaryColor).r,
    parseHex(hero.secondaryColor).g,
    parseHex(hero.secondaryColor).b,
  )
  const seed = hashStr(hero.id)

  // Warm hues → faster; cool/dark → slower. Power pushes tempo up.
  const hueTempo = 88 + (main.h / 360) * 70 + main.l * 40
  const bpm = Math.round(Math.min(168, Math.max(72, hueTempo + intensity * 28 + (seed % 18) - 9)))

  // Color lightness + hue nudge root; family sets base register.
  const rootHz = timbre.rootBias * (0.85 + main.l * 0.35 + ((seed % 12) / 100)) * (0.95 + sec.s * 0.12)

  const noteCount = Math.min(12, Math.round(4 + intensity * 3.5 + (seed % 3)))
  const durationSec = Math.min(3.6, 1.15 + intensity * 0.95 + (seed % 5) * 0.08)

  // Dark / low-sat colors prefer minor / dark modes unless family forces otherwise.
  let mode = timbre.mode
  if (main.l < 0.28 && mode === 'major') mode = 'minor'
  if (main.s < 0.2 && fx.family === 'void') mode = 'chromatic-dark'

  return {
    bpm,
    rootHz,
    mode,
    oscType: timbre.osc,
    noteCount,
    durationSec,
    brightness: Math.min(1, 0.35 + main.l * 0.5 + intensity * 0.2),
    family: fx.family,
  }
}

function duckBgm(durationSec: number): void {
  const audio = bgAudio
  if (!audio || muted) return
  if (bgmDuckTimer) {
    clearTimeout(bgmDuckTimer)
    bgmDuckTimer = null
  }
  bgmPreDuckVolume = audio.volume > 0.05 ? audio.volume : BGM_VOLUME
  audio.volume = Math.max(0.08, bgmPreDuckVolume * 0.22)
  bgmDuckTimer = setTimeout(() => {
    bgmDuckTimer = null
    if (!bgAudio || muted) return
    bgAudio.volume = ambientDesired ? BGM_VOLUME : bgmPreDuckVolume
  }, Math.ceil(durationSec * 1000) + 120)
}

function midiOffsetToHz(rootHz: number, semitones: number): number {
  return rootHz * Math.pow(2, semitones / 12)
}

function playBellPartial(freq: number, when: number, gainLevel: number, dur: number): void {
  tone(freq, dur, 'sine', gainLevel, when)
  tone(freq * 2.01, dur * 0.7, 'triangle', gainLevel * 0.35, when + 0.01)
  tone(freq * 3.01, dur * 0.4, 'sine', gainLevel * 0.18, when + 0.02)
}

function playDrone(freq: number, when: number, gainLevel: number, dur: number): void {
  tone(freq, dur, 'sine', gainLevel, when, freq * 2.5)
  tone(freq * 1.5, dur * 0.9, 'triangle', gainLevel * 0.4, when + 0.05, freq * 3)
}

/**
 * Play an original procedural victory stinger unique to this hero.
 * Ducks BGM briefly, then restores. No-ops when muted.
 */
export function playVictoryStinger(hero: Hero): void {
  if (muted) return
  const profile = getVictoryStingerProfile(hero)
  const timbre = familyTimbre(profile.family)
  const t0 = now()
  const ctx = getCtx()
  if (ctx.state === 'suspended') void ctx.resume()

  duckBgm(profile.durationSec)

  const beat = 60 / profile.bpm
  const scale = SCALES[profile.mode]
  const seed = hashStr(hero.id)

  // Opening hit — family flavor
  if (timbre.drone) {
    playDrone(profile.rootHz * 0.5, t0, 0.05 + profile.brightness * 0.03, profile.durationSec * 0.85)
  }
  if (timbre.bell) {
    playBellPartial(profile.rootHz * 2, t0, 0.045 + profile.brightness * 0.025, 0.55)
  } else {
    noiseBurst(0.12, 0.06 + profile.brightness * 0.03, t0, profile.family === 'lightning' ? 1800 : 400)
  }

  // Melodic fanfare notes
  for (let i = 0; i < profile.noteCount; i += 1) {
    const deg = scale[(seed + i * 3) % scale.length]!
    const octave = i > profile.noteCount * 0.55 ? 12 : 0
    const freq = midiOffsetToHz(profile.rootHz, deg + octave)
    const when = t0 + 0.08 + i * beat * (0.45 + ((seed >> (i % 8)) & 1) * 0.12)
    const dur = beat * (0.55 + (i % 3) * 0.15) + (i === profile.noteCount - 1 ? 0.35 : 0)
    const gain =
      (0.028 + profile.brightness * 0.028) * (i === profile.noteCount - 1 ? 1.25 : 1) *
      (profile.oscType === 'sawtooth' || profile.oscType === 'square' ? 0.75 : 1)

    if (timbre.bell && i % 2 === 0) {
      playBellPartial(freq, when, gain, dur)
    } else {
      const filter =
        profile.family === 'void'
          ? 280
          : profile.family === 'fire'
            ? 2200
            : 900 + profile.brightness * 1600
      tone(freq, dur, profile.oscType, gain, when, filter)
    }

    // Harmony on even beats for richer high-power fanfares
    if (profile.noteCount >= 7 && i % 2 === 0) {
      const harm = midiOffsetToHz(profile.rootHz, deg + 7)
      tone(harm, dur * 0.85, 'sine', gain * 0.45, when + 0.01, 1800)
    }
  }

  // Closing resolve chord
  const resolveAt = t0 + profile.durationSec * 0.72
  const resolveGain = 0.035 + profile.brightness * 0.025
  tone(profile.rootHz, 0.55, 'sine', resolveGain, resolveAt)
  tone(midiOffsetToHz(profile.rootHz, profile.mode === 'minor' || profile.mode === 'chromatic-dark' ? 3 : 4), 0.5, 'triangle', resolveGain * 0.7, resolveAt + 0.02)
  tone(midiOffsetToHz(profile.rootHz, 7), 0.6, 'sine', resolveGain * 0.55, resolveAt + 0.04)
  if (profile.noteCount >= 8) {
    tone(midiOffsetToHz(profile.rootHz, 12), 0.45, 'triangle', resolveGain * 0.4, resolveAt + 0.06)
  }
}
