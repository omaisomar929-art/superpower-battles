import { NavLink, Outlet } from 'react-router-dom'
import { Swords, Users, Home, Volume2, VolumeX, Gamepad2, HelpCircle, Zap } from 'lucide-react'
import { useSound } from '../audio/SoundProvider'
import { TOTAL_HERO_COUNT } from '../heroes/data'

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/gallery', label: 'Heroes', icon: Users },
  { to: '/select', label: 'Learning', icon: Swords },
  { to: '/learning/power', label: 'Power', icon: Zap },
  { to: '/versus', label: '2 Player', icon: Gamepad2 },
  { to: '/question', label: 'Question', icon: HelpCircle },
]

export function Layout() {
  const { muted, toggleMute } = useSound()

  return (
    <div className="app-shell flex min-h-[100dvh] flex-col">
      <header className="app-header sticky top-0 z-40 border-b border-white/10 bg-[#050816]/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="font-display text-sm sm:text-base tracking-[0.2em] text-sky-300 glow-text">
            POWER BATTLES
          </NavLink>
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wide transition ${
                      isActive ? 'bg-sky-500/20 text-sky-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={toggleMute}
              className="ml-1 inline-flex items-center justify-center rounded-lg border border-white/10 p-2 text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
              aria-label={muted ? 'Unmute background music' : 'Mute background music'}
              title={muted ? 'Unmute background music' : 'Mute background music'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </header>
      <main className="app-main flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <footer className="app-footer border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-500">
        <p>Math decides the winner. Never random. {TOTAL_HERO_COUNT} original heroes · Made by Yazan Omais</p>
        <p className="mt-1 text-[10px] text-slate-600">Original background music · starts at 0:35</p>
      </footer>
    </div>
  )
}
