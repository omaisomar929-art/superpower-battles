import { describe, expect, it } from 'vitest'
import { VILLAINS } from '../villainMode/cast'
import { getEvilStingerProfile } from '../audio/soundEngine'
import { getEvilVictoryDance } from './evilDance'

describe('evil victory dance', () => {
  it('is stable per villain and preferred style', () => {
    for (const v of VILLAINS) {
      const a = getEvilVictoryDance(v.hero, v.evilDanceStyle)
      const b = getEvilVictoryDance(v.hero, v.evilDanceStyle)
      expect(a).toEqual(b)
      expect(a.style).toBe(v.evilDanceStyle)
      expect(a.caption.length).toBeGreaterThan(0)
    }
  })

  it('gives each of the four villains a distinct dance style', () => {
    const styles = new Set(VILLAINS.map((v) => getEvilVictoryDance(v.hero, v.evilDanceStyle).style))
    expect(styles.size).toBe(4)
  })
})

describe('evil victory stinger', () => {
  it('is stable and darker than a bright hero-ish register', () => {
    for (const v of VILLAINS) {
      const a = getEvilStingerProfile(v.hero)
      const b = getEvilStingerProfile(v.hero)
      expect(a).toEqual(b)
      expect(a.bpm).toBeLessThanOrEqual(118)
      expect(a.rootHz).toBeLessThan(120)
      expect(a.noteCount).toBeGreaterThanOrEqual(5)
      expect(a.darkness).toBeGreaterThan(0.4)
    }
  })

  it('differs across villains', () => {
    const keys = VILLAINS.map((v) => {
      const p = getEvilStingerProfile(v.hero)
      return `${p.bpm}:${p.rootHz.toFixed(1)}:${p.mode}:${p.oscType}:${p.noteCount}`
    })
    expect(new Set(keys).size).toBe(4)
  })
})
