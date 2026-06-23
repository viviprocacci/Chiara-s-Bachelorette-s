import { motion } from 'framer-motion'

const FISH = [
  { top: '15%', delay: 0, duration: 16, size: 48, flip: false, color: '#3BA4BC' },
  { top: '35%', delay: 4, duration: 20, size: 36, flip: true, color: '#A8E0EE' },
  { top: '55%', delay: 2, duration: 14, size: 52, flip: false, color: '#2D8FA5' },
  { top: '75%', delay: 7, duration: 18, size: 40, flip: true, color: '#3BA4BC' },
]

function FishSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none">
      <ellipse cx="28" cy="18" rx="22" ry="12" fill={color} />
      <polygon points="6,18 0,10 0,26" fill={color} />
      <polygon points="50,18 60,12 60,24" fill={color} opacity="0.85" />
      <circle cx="38" cy="15" r="3" fill="#1A3A42" opacity="0.5" />
      <circle cx="39" cy="14.5" r="1" fill="white" opacity="0.7" />
    </svg>
  )
}

function SwimmingFishSprite({ top, delay, duration, size, flip, color }: (typeof FISH)[0]) {
  return (
    <motion.div
      className="absolute will-change-transform opacity-30"
      style={{ top, scaleX: flip ? -1 : 1 }}
      initial={{ x: '-15vw' }}
      animate={{
        x: ['-15vw', '115vw'],
        y: [0, -8, 0, 8, 0],
      }}
      transition={{
        x: { duration, delay, repeat: Infinity, ease: 'linear' },
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <FishSvg size={size} color={color} />
    </motion.div>
  )
}

export default function SwimmingFish() {
  return (
    <div className="absolute inset-0">
      {FISH.map((f, i) => (
        <SwimmingFishSprite key={i} {...f} />
      ))}
    </div>
  )
}
