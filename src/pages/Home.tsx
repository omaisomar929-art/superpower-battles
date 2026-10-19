import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HEROES, TOTAL_HERO_COUNT } from '../heroes/data'
import { HeroArt } from '../heroes/HeroArt'

export function Home() {
  const left = HEROES[14]
  const right = HEROES[23]

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12),transparent_55%)]" />
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/60 to-transparent"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[18vw] text-sky-500/10"
          animate={{ scale: [1, 1.04, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          VS
        </motion.div>
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center">
        <motion.p
          className="mb-4 text-[11px] uppercase tracking-[0.45em] text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Live arena · Math decides
        </motion.p>

        <motion.h1
          className="font-display text-5xl sm:text-7xl md:text-8xl tracking-[0.14em] text-sky-200 glow-text"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.75 }}
        >
          POWER BATTLES
        </motion.h1>

        <motion.p
          className="mt-6 font-display text-lg sm:text-2xl tracking-[0.22em] text-amber-200/90"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.6 }}
        >
          WHEN NUMBERS BECOME POWER.
        </motion.p>

        <motion.div
          className="mt-8 max-w-md rounded-2xl border border-white/10 bg-black/40 px-6 py-5 backdrop-blur-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65 }}
        >
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Credits</p>
          <p className="mt-2 font-display text-base tracking-[0.12em] text-white">
            Made by <span className="text-sky-300">Yazan Omais</span>
          </p>
          <a
            href="mailto:omaisyazan074@gmail.com"
            className="mt-2 inline-block text-sm text-slate-300 transition hover:text-sky-300"
          >
            omaisyazan074@gmail.com
          </a>
        </motion.div>

        <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-300">
          {TOTAL_HERO_COUNT} original heroes — including null-base voids (0¹–0⁵) and power-zero void
          variants (0⁰–10⁰). Higher power wins. Always.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Link to="/select" className="btn-primary">
            LEARNING MODE
          </Link>
          <Link to="/learning/expand" className="btn-secondary">
            EXPAND MODE
          </Link>
          <Link to="/learning/power" className="btn-primary">
            POWER MODE
          </Link>
          <Link to="/question" className="btn-primary">
            QUESTION MODE
          </Link>
          <Link to="/versus" className="btn-secondary">
            2 PLAYER
          </Link>
          <Link to="/gallery" className="btn-secondary">
            EXPLORE HEROES
          </Link>
        </div>
      </section>
    </div>
  )
}
