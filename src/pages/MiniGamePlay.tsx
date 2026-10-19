import { Navigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { getMiniGame, isMiniGameId } from '../minigames/catalog'
import type { PlayerMode } from '../minigames/types'
import { ModePicker } from './minigames/shared'
import { MeteorGame } from './minigames/MeteorGame'
import { CubeCometsGame } from './minigames/CubeCometsGame'
import { ExpandAsteroidsGame } from './minigames/ExpandAsteroidsGame'
import { VoidPullGame } from './minigames/VoidPullGame'
import { LaserLatticeGame } from './minigames/LaserLatticeGame'
import { ThunderRoundGame } from './minigames/ThunderRoundGame'

export function MiniGamePlay() {
  const { gameId } = useParams()
  const [mode, setMode] = useState<PlayerMode | null>(null)

  if (!gameId || !isMiniGameId(gameId)) {
    return <Navigate to="/minigames" replace />
  }

  const meta = getMiniGame(gameId)
  if (!meta) return <Navigate to="/minigames" replace />

  if (mode === null) {
    return (
      <ModePicker
        title={meta.title}
        blurb={meta.blurb}
        accent={meta.accent}
        onPick={setMode}
      />
    )
  }

  switch (gameId) {
    case 'meteor':
      return <MeteorGame mode={mode} />
    case 'cube-comets':
      return <CubeCometsGame mode={mode} />
    case 'expand-asteroids':
      return <ExpandAsteroidsGame mode={mode} />
    case 'void-pull':
      return <VoidPullGame mode={mode} />
    case 'laser-lattice':
      return <LaserLatticeGame mode={mode} />
    case 'thunder':
      return <ThunderRoundGame mode={mode} />
    default:
      return <Navigate to="/minigames" replace />
  }
}
