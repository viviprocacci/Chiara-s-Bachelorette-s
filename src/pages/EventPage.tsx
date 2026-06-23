import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Clock, ExternalLink } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import CheckInButtons from '@/components/check-in/CheckInButtons'
import { formatTime } from '@/lib/storage'
import { EVENT_TYPE_LABELS, CHECK_IN_LABELS } from '@/types'
import type { CheckInStatus } from '@/types'

export default function EventPage() {
  const { id } = useParams()
  const {
    events,
    members,
    getEventCheckIns,
    getMyCheckIn,
    checkIn,
    isOrganizer,
    moveEventTime,
  } = useTrip()
  const [checkingIn, setCheckingIn] = useState(false)
  const [editTime, setEditTime] = useState(false)
  const [newTime, setNewTime] = useState('')

  const event = events.find((e) => e.id === id)
  const checkIns = event ? getEventCheckIns(event.id) : []
  const myCheckIn = event ? getMyCheckIn(event.id) : undefined

  if (!event) {
    return (
      <div className="page-container items-center justify-center">
        <p className="text-sm text-[var(--palette-text-muted)]">Event not found</p>
        <Link to="/schedule" className="mt-4 text-[var(--palette-accent)]">Back to schedule</Link>
      </div>
    )
  }

  const handleCheckIn = async (status: CheckInStatus) => {
    setCheckingIn(true)
    try {
      await checkIn(event.id, status)
    } finally {
      setCheckingIn(false)
    }
  }

  const handleTimeChange = async () => {
    if (!newTime) return
    await moveEventTime(event.id, newTime)
    setEditTime(false)
  }

  const mapUrl = event.location
    ? `https://maps.google.com/?q=${encodeURIComponent(event.location)}`
    : null

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 px-4 pb-2 pt-2">
        <Link to="/schedule" className="rounded-full bg-white/40 p-2 backdrop-blur-sm">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
            {EVENT_TYPE_LABELS[event.event_type]}
          </p>
          <h1 className="font-display text-2xl font-bold">{event.title}</h1>
        </div>
      </div>

      <div className="scroll-content space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card space-y-3 p-5"
        >
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-[var(--palette-accent)]" />
            <span>{formatTime(event.start_time)}</span>
            {event.end_time && <span>– {formatTime(event.end_time)}</span>}
            {isOrganizer && (
              <button
                onClick={() => {
                  setNewTime(event.start_time)
                  setEditTime(!editTime)
                }}
                className="ml-auto text-[10px] font-semibold uppercase text-[var(--palette-accent)]"
              >
                Edit time
              </button>
            )}
          </div>
          {editTime && (
            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 rounded-xl border border-white/60 bg-white/50 px-3 py-2 text-sm"
              />
              <button onClick={() => void handleTimeChange()} className="btn-primary px-4 py-2 text-sm">
                Save
              </button>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-[var(--palette-accent)]" />
              <span>{event.location}</span>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[var(--palette-accent)]"
                >
                  Map <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
          {event.notes && (
            <p className="rounded-xl bg-white/40 px-3 py-2 text-sm text-[var(--palette-text-muted)]">
              {event.notes}
            </p>
          )}
        </motion.div>

        <div className="glass-card p-5">
          <CheckInButtons
            currentStatus={myCheckIn?.status}
            onCheckIn={handleCheckIn}
            loading={checkingIn}
          />
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Who's coming</h3>
          <div className="space-y-2">
            {members.map((m) => {
              const ci = checkIns.find((c) => c.member_id === m.id)
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-white/30 px-3 py-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: m.avatar_color }}
                  >
                    {m.display_name[0]}
                  </div>
                  <span className="flex-1 text-sm font-medium">{m.display_name}</span>
                  <span className="text-xs text-[var(--palette-text-muted)]">
                    {ci ? CHECK_IN_LABELS[ci.status] : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
