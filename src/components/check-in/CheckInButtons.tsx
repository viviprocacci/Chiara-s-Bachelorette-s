import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CheckInStatus } from '@/types'
import { CHECK_IN_LABELS } from '@/types'
import { fireCheckInConfetti } from '@/lib/confetti'
import { playCheckInSound, triggerHaptic } from '@/lib/feedback'
import SparkleOverlay from '@/components/check-in/SparkleOverlay'

interface CheckInButtonsProps {
  currentStatus?: CheckInStatus
  onCheckIn: (status: CheckInStatus) => Promise<void>
  loading?: boolean
}

const statusConfig: Record<CheckInStatus, { emoji: string; className: string }> = {
  in: { emoji: '✨', className: 'border-emerald-200 bg-emerald-50/80 text-emerald-800' },
  late: { emoji: '⏰', className: 'border-amber-200 bg-amber-50/80 text-amber-800' },
  skip: { emoji: '💤', className: 'border-gray-200 bg-gray-50/80 text-gray-600' },
}

export default function CheckInButtons({ currentStatus, onCheckIn, loading }: CheckInButtonsProps) {
  const [showSparkle, setShowSparkle] = useState(false)

  const handleCheckIn = async (status: CheckInStatus, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    }

    triggerHaptic(status)
    playCheckInSound(status)
    fireCheckInConfetti(status, origin)
    if (status === 'in') {
      setShowSparkle(true)
      setTimeout(() => setShowSparkle(false), 1000)
    }

    await onCheckIn(status)
  }

  return (
    <>
      <SparkleOverlay show={showSparkle} />
      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-[var(--palette-text-muted)]">
          {currentStatus ? `You're marked: ${CHECK_IN_LABELS[currentStatus]}` : 'RSVP for this event'}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {(Object.keys(statusConfig) as CheckInStatus[]).map((status) => {
            const config = statusConfig[status]
            const isActive = currentStatus === status
            return (
              <motion.button
                key={status}
                whileTap={{ scale: 0.96 }}
                disabled={loading}
                onClick={(e) => void handleCheckIn(status, e)}
                className={`relative overflow-hidden rounded-2xl border-2 px-5 py-4 text-left font-medium transition-all ${
                  isActive
                    ? `${config.className} ring-2 ring-[var(--palette-accent)] ring-offset-1`
                    : 'border-white/60 bg-white/40 text-[var(--palette-text)] backdrop-blur-sm'
                }`}
              >
                <AnimatePresence>
                  {isActive && status === 'in' && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                </AnimatePresence>
                <span className="mr-2">{config.emoji}</span>
                {CHECK_IN_LABELS[status]}
              </motion.button>
            )
          })}
        </div>
      </div>
    </>
  )
}
