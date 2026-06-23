import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTrip } from '@/context/TripContext'
import FloatingProsecco from '@/components/decorations/FloatingProsecco'
import SwimmingFish from '@/components/decorations/SwimmingFish'
import SunsetBirds from '@/components/decorations/SunsetBirds'

function DecorationContent({ paletteKey }: { paletteKey: string }) {
  switch (paletteKey) {
    case 'prosecco_pink':
      return <FloatingProsecco />
    case 'mamma_mia_blue':
      return <SwimmingFish />
    case 'aperol_sunset':
      return <SunsetBirds />
    default:
      return null
  }
}

export default function DayDecorations() {
  const { days, activeDayId } = useTrip()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const activeDay = days.find((d) => d.id === activeDayId)
  const paletteKey = activeDay?.palette_key ?? 'default'

  if (reducedMotion) return null

  return (
    <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={paletteKey}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <DecorationContent paletteKey={paletteKey} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
