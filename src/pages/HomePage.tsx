import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import PageHeader from '@/components/layout/PageHeader'
import EventCard from '@/components/schedule/EventCard'
import { formatTime, timeUntil, formatDate } from '@/lib/storage'

export default function HomePage() {
  const {
    loading,
    member,
    days,
    getTodayDay,
    getNextEvent,
    getDayEvents,
    getEventCheckIns,
    feedPosts,
    announcements,
  } = useTrip()
  const today = getTodayDay()
  const nextEvent = getNextEvent()
  const todayEvents = today ? getDayEvents(today.id) : []
  const latestPost = feedPosts[0]
  const scheduleAlert = announcements.find((a) => a.announcement_type === 'schedule_change')

  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-3xl text-[var(--palette-accent)]"
        >
          ✦
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <PageHeader
        title={`Hey, ${member?.display_name?.split(' ')[0] ?? 'babe'}`}
        subtitle={today ? formatDate(today.date) : 'Mamma Mia in West Palm'}
      />

      <div className="scroll-content space-y-4">
        {nextEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card overflow-hidden p-5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--palette-accent)]">
              <Sparkles size={14} />
              Up Next
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold">{nextEvent.title}</h2>
            <p className="mt-1 text-sm text-[var(--palette-text-muted)]">
              {formatTime(nextEvent.start_time)}
              {timeUntil(nextEvent.start_time) && ` · in ${timeUntil(nextEvent.start_time)}`}
            </p>
            <Link
              to={`/event/${nextEvent.id}`}
              className="mt-4 flex items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: 'var(--palette-accent)' }}
            >
              Check in <ChevronRight size={16} />
            </Link>
          </motion.div>
        )}

        {latestPost && (
          <Link to="/feed" className="block">
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <span className="text-lg">📸</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                    Latest from the feed
                  </p>
                  <p className="truncate text-sm">
                    {latestPost.poster?.display_name ?? 'Someone'}
                    {latestPost.caption ? `: ${latestPost.caption}` : ' shared a photo'}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--palette-text-muted)]" />
              </div>
              <img
                src={latestPost.image_url}
                alt=""
                className="h-32 w-full object-cover"
              />
            </div>
          </Link>
        )}

        {scheduleAlert && (
          <div className="glass-card flex items-center gap-3 p-4">
            <span className="text-lg">📅</span>
            <p className="text-sm">{scheduleAlert.message}</p>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              {today ? "Today's Plan" : 'Schedule Preview'}
            </h3>
            <Link to="/schedule" className="text-xs font-semibold text-[var(--palette-accent)]">
              Full schedule
            </Link>
          </div>
          <div className="space-y-3">
            {(todayEvents.length > 0 ? todayEvents : days.length > 0 ? getDayEvents(days[0].id) : []).map(
              (event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  checkIns={getEventCheckIns(event.id)}
                  index={i}
                  compact
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
