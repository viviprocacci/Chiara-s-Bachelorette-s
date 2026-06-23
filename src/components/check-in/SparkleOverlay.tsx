import { motion } from 'framer-motion'

interface SparkleOverlayProps {
  show: boolean
}

export default function SparkleOverlay({ show }: SparkleOverlayProps) {
  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-lg"
          initial={{
            opacity: 1,
            x: `${30 + Math.random() * 40}vw`,
            y: `${30 + Math.random() * 40}vh`,
            scale: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.5],
            rotate: [0, 180],
          }}
          transition={{ duration: 1, delay: i * 0.05 }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  )
}
