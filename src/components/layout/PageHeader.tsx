import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useTrip } from '@/context/TripContext'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showSettings?: boolean
}

export default function PageHeader({ title, subtitle, showSettings = true }: PageHeaderProps) {
  const { trip, member } = useTrip()

  return (
    <header className="flex items-start justify-between px-4 pb-3 pt-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--palette-text-muted)]">
          {trip?.name}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--palette-text)]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--palette-text-muted)]">{subtitle}</p>
        )}
      </div>
      {showSettings && (
        <Link
          to="/settings"
          className="flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 py-1.5 backdrop-blur-sm"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: member?.avatar_color ?? 'var(--palette-accent)' }}
          >
            {member?.display_name?.[0]?.toUpperCase()}
          </div>
          <Settings size={16} className="text-[var(--palette-text-muted)]" />
        </Link>
      )}
    </header>
  )
}
