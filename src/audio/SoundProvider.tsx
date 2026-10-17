import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  ensureAudioUnlocked,
  isMuted,
  loadMutePreference,
  setMuted,
  startAmbient,
  stopAmbient,
  tryAutoplayAmbient,
} from './soundEngine'

interface SoundContextValue {
  muted: boolean
  toggleMute: () => void
}

const SoundContext = createContext<SoundContextValue>({
  muted: false,
  toggleMute: () => undefined,
})

export function useSound() {
  return useContext(SoundContext)
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(() => loadMutePreference())

  useEffect(() => {
    if (muted) return undefined

    let cancelled = false

    // Prefer unmuted autoplay immediately; fall back to muted play or first gesture.
    void tryAutoplayAmbient()

    const onGesture = () => {
      if (cancelled) return
      // Unmute muted-autoplay, or start play if autoplay was fully blocked.
      void ensureAudioUnlocked()
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)

    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [muted])

  useEffect(() => {
    return () => stopAmbient()
  }, [])

  function toggleMute() {
    const next = !isMuted()
    setMuted(next)
    setMutedState(next)
    // Unmute is always a user gesture — start BGM from 35s reliably.
    if (!next) void startAmbient()
  }

  return <SoundContext.Provider value={{ muted, toggleMute }}>{children}</SoundContext.Provider>
}
