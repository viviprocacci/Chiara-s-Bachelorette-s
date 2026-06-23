import { motion } from 'framer-motion'
import type { Announcement } from '@/types'

interface AnnouncementCardProps {
  announcement: Announcement
  index?: number
  compact?: boolean
}

const typeIcons: Record<string, string> = {
  schedule_change: '📅',
  arrival: '📍',
  general: '💌',
}

export default function AnnouncementCard({ announcement, index = 0, compact = false }: AnnouncementCardProps) {
  const time = new Date(announcement.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const date = new Date(announcement.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`glass-card ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{typeIcons[announcement.announcement_type] ?? '💌'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-[var(--palette-text)]">{announcement.message}</p>
          <p className="mt-1.5 text-[10px] text-[var(--palette-text-muted)]">
            {date} at {time}
            {announcement.creator && ` · ${announcement.creator.display_name}`}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
