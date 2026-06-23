import { motion } from 'framer-motion'

const FLUTES = [
  { left: '8%', delay: 0, duration: 11, size: 44 },
  { left: '28%', delay: 2.5, duration: 13, size: 36 },
  { left: '52%', delay: 1.2, duration: 10, size: 48 },
  { left: '72%', delay: 4, duration: 12, size: 40 },
  { left: '88%', delay: 3, duration: 14, size: 34 },
  { left: '42%', delay: 5.5, duration: 9, size: 38 },
]

const BUBBLES = [
  { left: '15%', delay: 0, duration: 5 },
  { left: '45%', delay: 1.5, duration: 4 },
  { left: '65%', delay: 0.8, duration: 6 },
  { left: '80%', delay: 2.2, duration: 4.5 },
]

function ChampagneFlute({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" fill="none">
      <path
        d="M12 4 L28 4 L24 28 Q20 32 16 28 Z"
        fill="#F5E6A8"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      <path
        d="M20 28 L20 52"
        stroke="#D4AF37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="56" rx="8" ry="2" fill="#D4AF37" opacity="0.6" />
      <circle cx="17" cy="14" r="2" fill="#FFF8E7" opacity="0.8" />
      <circle cx="22" cy="18" r="1.5" fill="#FFF8E7" opacity="0.6" />
      <circle cx="19" cy="22" r="1" fill="#FFF8E7" opacity="0.5" />
    </svg>
  )
}

function RisingFlute({ left, delay, duration, size }: (typeof FLUTES)[0]) {
  return (
    <motion.div
      className="absolute will-change-transform"
      style={{ left, bottom: 0 }}
      initial={{ y: '20vh', x: 0, scale: 1, opacity: 0.35 }}
      animate={{
        y: ['20vh', '-85vh', '-85vh'],
        x: [0, 8, -6, 4, 0],
        scale: [1, 1, 1.4, 0],
        opacity: [0.35, 0.4, 0.5, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.75, 0.85, 1],
      }}
    >
      <ChampagneFlute size={size} />
    </motion.div>
  )
}

function Bubble({ left, delay, duration }: (typeof BUBBLES)[0]) {
  return (
    <motion.div
      className="absolute h-2 w-2 rounded-full bg-[#E8A0BF] opacity-30 will-change-transform"
      style={{ left, bottom: 0 }}
      animate={{ y: ['10vh', '-105vh'], x: [0, 6, -4, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export default function FloatingProsecco() {
  return (
    <div className="absolute inset-0">
      {BUBBLES.map((b, i) => (
        <Bubble key={`bubble-${i}`} {...b} />
      ))}
      {FLUTES.map((f, i) => (
        <RisingFlute key={`flute-${i}`} {...f} />
      ))}
    </div>
  )
}
