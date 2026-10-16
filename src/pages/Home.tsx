import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HEROES } from '../heroes/data'
import { HeroArt } from '../heroes/HeroArt'

export function Home() {
  const left = HEROES[14]
  const right = HEROES[23]

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-10 top-24 opacity-40"
          animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HeroArt hero={left} size={280} animated />
        </motion.div>
        <motion.div
          className="absolute -right-10 top-32 opacity-40"
          animate={{ x: [0, -20, 0], y: [0, 12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HeroArt hero={right} size={280} animated />
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[18vw] text-fuchsia-500/10"
          animate={{ scale: [1, 1.04, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          VS
        </motion.div>
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center">
        <motion.h1
          className="font-display text-4xl sm:text-6xl md:text-7xl tracking-[0.12em] text-fuchsia-300 glow-text"
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7 }}
        >
          SUPERPOWER BATTLES
        </motion.h1>
        <motion.p
          className="mt-6 font-display text-xl sm:text-3xl tracking-[0.18em] text-sky-300"
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          WHEN NUMBERS BECOME POWER.
        </motion.p>
        <p className="mt-4 max-w-xl text-base sm:text-lg text-slate-300">
          Fifty original heroes. Each one is a living equation. Higher power wins — always.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link to="/select" className="btn-primary">
            GENERATE BATTLE
          </Link>
          <Link to="/gallery" className="btn-secondary">
            EXPLORE 50 HEROES
          </Link>
          <Link to="/tournament" className="btn-secondary">
            START TOURNAMENT
          </Link>
        </div>
      </section>
    </div>
  )
}
