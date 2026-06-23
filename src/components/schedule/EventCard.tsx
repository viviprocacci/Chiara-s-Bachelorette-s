import {
  UtensilsCrossed,
  Ship,
  Wine,
  Music,
  Sparkles,
  Activity,
  MapPin,
  Clock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Event, CheckIn } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'
import { eventTypeAccents } from '@/theme/palettes'
import { formatTime } from '@/lib/storage'

const iconMap = {
  brunch: UtensilsCrossed,
  boat: Ship,
  dinner: Wine,
  club: Music,
  spa: Sparkles,
  pilates: Activity,
  other: MapPin,
}

interface EventCardProps {
  event: Event
  checkIns?: CheckIn[]
  index?: number
  compact?: boolean
}

export default function EventCard({ event, checkIns = [], index = 0, compact = false }: EventCardProps) {
  const Icon = iconMap[event.event_type] ?? MapPin
  const accent = eventTypeAccents[event.event_type] ?? 'var(--palette-accent)'
  const inCount = checkIns.filter((c) => c.status === 'in').length
  const lateCount = checkIns.filter((c) => c.status === 'late').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to={`/event/${event.id}`} className="block">
        <div className="glass-card group relative overflow-hidden p-4 transition-transform active:scale-[0.98]">
          <div
            className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
            style={{ background: accent }}
          />
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${accent}22`, color: accent }}
            >
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                {EVENT_TYPE_LABELS[event.event_type]}
              </p>
              <h3 className="font-display text-lg font-semibold leading-tight text-[var(--palette-text)]">
                {event.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[var(--palette-text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(event.start_time)}
                  {event.end_time && ` – ${formatTime(event.end_time)}`}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin size={12} />
                    {event.location}
                  </span>
                )}
              </div>
              {!compact && checkIns.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {checkIns.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white"
                        style={{
                          background: c.member?.avatar_color ?? accent,
                          opacity: c.status === 'skip' ? 0.4 : 1,
                        }}
                        title={c.member?.display_name}
                      >
                        {c.member?.display_name?.[0]}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--palette-text-muted)]">
                    {inCount} in{lateCount > 0 ? ` · ${lateCount} late` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
