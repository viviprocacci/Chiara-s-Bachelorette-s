import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTrip } from '@/context/TripContext'
import { Toast } from '@/components/layout/InstallPrompt'

export function useRealtimeToasts() {
  const { feedPosts, announcements } = useTrip()
  const [toast, setToast] = useState<string | null>(null)
  const prevFeedCount = useRef(feedPosts.length)
  const prevFeedFirstId = useRef(feedPosts[0]?.id)
  const prevAnnounceCount = useRef(announcements.length)
  const prevAnnounceFirstId = useRef(announcements[0]?.id)

  useEffect(() => {
    if (feedPosts.length > prevFeedCount.current || feedPosts[0]?.id !== prevFeedFirstId.current) {
      if (prevFeedFirstId.current && feedPosts[0]) {
        const name = feedPosts[0].poster?.display_name ?? 'Someone'
        setToast(`${name} posted a photo`)
        const timer = setTimeout(() => setToast(null), 5000)
        prevFeedCount.current = feedPosts.length
        prevFeedFirstId.current = feedPosts[0]?.id
        return () => clearTimeout(timer)
      }
    }
    prevFeedCount.current = feedPosts.length
    prevFeedFirstId.current = feedPosts[0]?.id
  }, [feedPosts])

  useEffect(() => {
    const latest = announcements[0]
    if (!latest || latest.announcement_type === 'general') {
      prevAnnounceCount.current = announcements.length
      prevAnnounceFirstId.current = latest?.id
      return
    }
    if (announcements.length > prevAnnounceCount.current || latest.id !== prevAnnounceFirstId.current) {
      if (prevAnnounceFirstId.current && latest) {
        setToast(latest.message)
        const timer = setTimeout(() => setToast(null), 5000)
        prevAnnounceCount.current = announcements.length
        prevAnnounceFirstId.current = latest.id
        return () => clearTimeout(timer)
      }
    }
    prevAnnounceCount.current = announcements.length
    prevAnnounceFirstId.current = latest?.id
  }, [announcements])

  return { toast, dismiss: () => setToast(null) }
}

export function RealtimeToasts() {
  const { toast, dismiss } = useRealtimeToasts()

  return (
    <AnimatePresence>
      {toast && <Toast message={toast} onClose={dismiss} />}
    </AnimatePresence>
  )
}
