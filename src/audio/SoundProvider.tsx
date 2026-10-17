import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  ensureAudioUnlocked,
  isMuted,
  loadMutePreference,
  setMuted,
  startAmbient,
  stopAmbient,
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

    // Try immediate play (works if previously unmuted / autoplay allowed).
    void ensureAudioUnlocked()

    const unlock = () => {
      void ensureAudioUnlocked()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
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
