import { NavLink } from 'react-router-dom'
import { Home, Calendar, Camera, Luggage, DollarSign } from 'lucide-react'
import { useTrip } from '@/context/TripContext'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/feed', icon: Camera, label: 'Feed' },
  { to: '/packing', icon: Luggage, label: 'Packing' },
  { to: '/expenses', icon: DollarSign, label: 'Split' },
]

export default function BottomNav() {
  const { feedPosts } = useTrip()
  const recentCount = feedPosts.filter(
    (p) => Date.now() - new Date(p.created_at).getTime() < 86400000,
  ).length

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/40 bg-white/60 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[var(--palette-accent)]' : 'text-[var(--palette-text-muted)]'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
            {to === '/feed' && recentCount > 0 && (
              <span
                className="absolute right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: 'var(--palette-accent)' }}
              >
                {recentCount > 9 ? '9+' : recentCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
