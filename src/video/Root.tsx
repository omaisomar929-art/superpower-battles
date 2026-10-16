import type { FC } from 'react'
import { Composition } from 'remotion'
import { HEROES } from '../heroes/data'
import {
  ASPECT_DIMENSIONS,
  VIDEO_DURATION_FRAMES,
  VIDEO_FPS,
  type VideoSettings,
} from './constants'
import {
  SuperpowerBattlesVideo,
  type BattlePair,
  type SuperpowerBattlesVideoProps,
} from './SuperpowerBattlesVideo'

const defaultBattles: BattlePair[] = [
  { a: HEROES[12], b: HEROES[16] }, // 3^3 vs 4^2
  { a: HEROES[14], b: HEROES[23] }, // 3^5 vs 5^4
  { a: HEROES[9], b: HEROES[17] }, // 2^5 vs 4^3
  { a: HEROES[49], b: HEROES[44] }, // 10^5 vs 9^5
]

const defaultSettings: VideoSettings = {
  aspect: '16:9',
  theme: 'neon',
  intensity: 'high',
  speed: 'normal',
  arena: 'neon-colosseum',
  showMath: true,
  mathTiming: 'mid',
  audioEnabled: true,
}

const VideoComp = SuperpowerBattlesVideo as unknown as FC<Record<string, unknown>>

export const RemotionRoot: FC = () => {
  const dims = ASPECT_DIMENSIONS['16:9']
  const baseProps: SuperpowerBattlesVideoProps = {
    battles: defaultBattles,
    settings: defaultSettings,
    featuredWinner: null,
  }
  return (
    <>
      <Composition
        id="SuperpowerBattles"
        component={VideoComp}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={VIDEO_FPS}
        width={dims.width}
        height={dims.height}
        defaultProps={baseProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="SuperpowerBattlesPortrait"
        component={VideoComp}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={VIDEO_FPS}
        width={ASPECT_DIMENSIONS['9:16'].width}
        height={ASPECT_DIMENSIONS['9:16'].height}
        defaultProps={
          {
            ...baseProps,
            settings: { ...defaultSettings, aspect: '9:16' },
          } as unknown as Record<string, unknown>
        }
      />
      <Composition
        id="SuperpowerBattlesSquare"
        component={VideoComp}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={VIDEO_FPS}
        width={ASPECT_DIMENSIONS['1:1'].width}
        height={ASPECT_DIMENSIONS['1:1'].height}
        defaultProps={
          {
            ...baseProps,
            settings: { ...defaultSettings, aspect: '1:1' },
          } as unknown as Record<string, unknown>
        }
      />
    </>
  )
}
