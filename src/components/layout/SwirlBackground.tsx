import { motion } from 'framer-motion'

const blobs = [
  { className: 'left-1/2 top-1/3 h-64 w-64 -translate-x-1/2', delay: 0, duration: 8 },
  { className: 'right-[-4rem] top-[15%] h-48 w-56', delay: 1.5, duration: 10 },
  { className: 'bottom-[20%] left-[-3rem] h-52 w-44', delay: 0.8, duration: 9 },
  { className: 'bottom-[-2rem] right-[10%] h-40 w-48', delay: 2, duration: 11 },
]

export default function SwirlBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--palette-gradient)' }}
      />
      <motion.svg
        className="absolute -right-20 -top-20 h-96 w-96 opacity-[0.08]"
        viewBox="0 0 200 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <path
          d="M100,20 Q160,60 140,120 Q120,180 60,160 Q0,140 20,80 Q40,20 100,20"
          fill="none"
          stroke="var(--palette-accent)"
          strokeWidth="1.5"
        />
        <path
          d="M100,40 Q140,70 130,110 Q120,150 80,140 Q40,130 50,90 Q60,50 100,40"
          fill="none"
          stroke="var(--palette-accent)"
          strokeWidth="1"
        />
      </motion.svg>
      <motion.svg
        className="absolute -bottom-32 -left-16 h-80 w-80 opacity-[0.06]"
        viewBox="0 0 200 200"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      >
        <path
          d="M100,10 C150,10 190,50 190,100 C190,150 150,190 100,190 C50,190 10,150 10,100 C10,50 50,10 100,10"
          fill="none"
          stroke="var(--palette-accent)"
          strokeWidth="1.5"
        />
      </motion.svg>
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 blur-3xl ${blob.className}`}
          style={{ background: i % 2 === 0 ? 'var(--palette-accent-light)' : 'var(--palette-accent)' }}
          animate={{
            y: [0, -12, 0, 8, 0],
            x: [0, 6, 0, -4, 0],
            scale: [1, 1.05, 1, 0.98, 1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: blob.delay,
          }}
        />
      ))}
    </div>
  )
}
