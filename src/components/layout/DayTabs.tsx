import { motion } from 'framer-motion'
import { useTrip } from '@/context/TripContext'
import { formatShortDate } from '@/lib/storage'
import { isToday } from '@/lib/storage'

export default function DayTabs() {
  const { days, activeDayId, setActiveDayId } = useTrip()

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
      {days.map((day) => {
        const active = day.id === activeDayId
        const today = isToday(day.date)
        return (
          <motion.button
            key={day.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDayId(day.id)}
            className={`flex-shrink-0 rounded-2xl px-4 py-2.5 text-left transition-all ${
              active
                ? 'text-white shadow-md'
                : 'border border-white/50 bg-white/30 text-[var(--palette-text)] backdrop-blur-sm'
            }`}
            style={active ? { background: 'var(--palette-accent)' } : undefined}
          >
            <span className="block text-xs font-medium opacity-80">{day.label}</span>
            <span className="block text-sm font-semibold">{formatShortDate(day.date)}</span>
            {today && (
              <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-wide ${active ? 'text-white/80' : 'text-[var(--palette-accent)]'}`}>
                Today
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
