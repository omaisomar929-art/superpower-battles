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

const UNLOCK_EVENTS = ['pointerdown', 'touchstart', 'click', 'keydown'] as const

export function useSound() {
  return useContext(SoundContext)
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(() => loadMutePreference())

  useEffect(() => {
    if (muted) return undefined

    let cancelled = false
    let unlocked = false

    // Prefer unmuted autoplay immediately; fall back to muted play or first gesture.
    void tryAutoplayAmbient()

    const onGesture = () => {
      if (cancelled || unlocked) return
      unlocked = true
      // Unmute muted-autoplay, or start play if autoplay was fully blocked.
      void ensureAudioUnlocked()
      removeUnlockListeners()
    }

    function addUnlockListeners() {
      for (const event of UNLOCK_EVENTS) {
        window.addEventListener(event, onGesture, { capture: true, passive: true })
        document.addEventListener(event, onGesture, { capture: true, passive: true })
      }
    }

    function removeUnlockListeners() {
      for (const event of UNLOCK_EVENTS) {
        window.removeEventListener(event, onGesture, { capture: true })
        document.removeEventListener(event, onGesture, { capture: true })
      }
    }

    addUnlockListeners()

    return () => {
      cancelled = true
      removeUnlockListeners()
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
