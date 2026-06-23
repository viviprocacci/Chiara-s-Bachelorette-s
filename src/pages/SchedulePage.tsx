import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import PageHeader from '@/components/layout/PageHeader'
import DayTabs from '@/components/layout/DayTabs'
import EventCard from '@/components/schedule/EventCard'
import type { EventType } from '@/types'

export default function SchedulePage() {
  const {
    loading,
    activeDayId,
    getDayEvents,
    getEventCheckIns,
    isOrganizer,
    addNewEvent,
  } = useTrip()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('12:00')
  const [eventType, setEventType] = useState<EventType>('other')

  const dayEvents = activeDayId ? getDayEvents(activeDayId) : []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDayId || !title) return
    await addNewEvent(activeDayId, {
      title,
      event_type: eventType,
      start_time: startTime,
      end_time: null,
      location: null,
      notes: null,
      sort_order: dayEvents.length,
    })
    setTitle('')
    setShowAdd(false)
  }

  if (loading) {
    return <div className="page-container items-center justify-center"><div className="animate-pulse text-2xl">✦</div></div>
  }

  return (
    <div className="page-container">
      <PageHeader title="Schedule" subtitle="Day by day, drip by drip" />

      <DayTabs />

      <div className="scroll-content space-y-3">
        {dayEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--palette-text-muted)]">
            No events yet — add one below
          </p>
        ) : (
          dayEvents.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              checkIns={getEventCheckIns(event.id)}
              index={i}
            />
          ))
        )}

        {isOrganizer && (
          <>
            {showAdd ? (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={(e) => void handleAdd(e)}
                className="glass-card space-y-3 p-4"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event name"
                  className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1 rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none"
                  />
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="flex-1 rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="brunch">Brunch</option>
                    <option value="boat">Boat</option>
                    <option value="dinner">Dinner</option>
                    <option value="club">Club</option>
                    <option value="spa">Spa</option>
                    <option value="pilates">Pilates</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">Add Event</button>
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </motion.form>
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--palette-accent-light)] py-4 text-sm font-medium text-[var(--palette-accent)]"
              >
                <Plus size={16} /> Add event
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
