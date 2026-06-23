import { motion } from 'framer-motion'

const BIRDS = [
  { top: '12%', delay: 0, duration: 14, size: 20 },
  { top: '22%', delay: 3, duration: 18, size: 16 },
  { top: '8%', delay: 6, duration: 16, size: 14 },
  { top: '18%', delay: 9, duration: 20, size: 18 },
]

function BirdSvg({ size }: { size: number }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 40 20" fill="none">
      <path
        d="M2 14 Q10 4 20 10 Q30 4 38 14"
        stroke="#3D2818"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function FlyingBird({ top, delay, duration, size }: (typeof BIRDS)[0]) {
  return (
    <motion.div
      className="absolute will-change-transform opacity-20"
      style={{ top }}
      animate={{
        x: ['-10vw', '110vw'],
        y: [0, -12, 0, 10, 0],
        scaleY: [1, 0.85, 1, 0.85, 1],
      }}
      transition={{
        x: { duration, delay, repeat: Infinity, ease: 'linear' },
        y: { duration: duration * 0.6, delay, repeat: Infinity, ease: 'easeInOut' },
        scaleY: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <BirdSvg size={size} />
    </motion.div>
  )
}

export default function SunsetBirds() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-x-0 bottom-0 h-[35%]"
        style={{
          background:
            'linear-gradient(to top, rgba(232,101,43,0.35) 0%, rgba(245,201,154,0.25) 40%, rgba(255,228,204,0.1) 80%, transparent 100%)',
        }}
      />
      <motion.div
        className="absolute bottom-[28%] left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, #F5C99A 0%, #E8652B 50%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {BIRDS.map((b, i) => (
        <FlyingBird key={i} {...b} />
      ))}
    </div>
  )
}
