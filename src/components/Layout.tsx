import { NavLink, Outlet } from 'react-router-dom'
import { Swords, Users, Home } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/gallery', label: 'Heroes', icon: Users },
  { to: '/select', label: 'Fight', icon: Swords },
]

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="font-display text-sm sm:text-base tracking-[0.2em] text-fuchsia-300 glow-text">
            SUPERPOWER BATTLES
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold tracking-wide transition ${
                    isActive ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        Math decides the winner. Never random. 50 original heroes.
      </footer>
    </div>
  )
}
