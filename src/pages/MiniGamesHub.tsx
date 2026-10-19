import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Joystick, Sparkles } from 'lucide-react'
import { MINI_GAMES } from '../minigames/catalog'

export function MiniGamesHub() {
  return (
    <div className="relative mx-auto min-h-[calc(100dvh-8rem)] max-w-5xl overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_10%,rgba(56,189,248,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_60%,rgba(244,114,182,0.12),transparent_45%)]" />
        <motion.div
          className="absolute left-1/2 top-20 -translate-x-1/2 font-display text-[16vw] leading-none text-sky-500/[0.07]"
          animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ARCADE
        </motion.div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 text-xs font-semibold tracking-widest text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
          >
            HOME
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.35em] text-slate-500">
            <Joystick size={14} /> Arcade
          </span>
        </div>

        <motion.h1
          className="mt-4 font-display text-3xl tracking-[0.22em] text-sky-100 sm:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          MINI GAMES
        </motion.h1>
        <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
          Grade-6 power math, arcade style. Each game opens with <strong className="text-sky-200">1 Player</strong> or{' '}
          <strong className="text-rose-200">2 Player</strong> — split lanes for one phone or smart board. True math:{' '}
          n<sup>0</sup> = 1.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {MINI_GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                to={`/minigames/${game.id}`}
                className="group flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-white/25 hover:bg-black/55"
                style={{ boxShadow: `inset 0 0 0 1px ${game.accentSoft}` }}
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.35em]"
                    style={{ color: game.accent }}
                  >
                    {game.tagline}
                  </p>
                  <h2 className="mt-2 font-display text-lg tracking-[0.14em] text-white sm:text-xl">
                    {game.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">{game.blurb}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] text-slate-300 transition group-hover:text-sky-200">
                  <Sparkles size={14} style={{ color: game.accent }} />
                  PLAY
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
