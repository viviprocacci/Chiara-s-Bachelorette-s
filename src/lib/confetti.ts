import confetti from 'canvas-confetti'
import type { CheckInStatus } from '@/types'

const MAMMA_MIA_COLORS = [
  '#E8A0BF',
  '#F5D0CB',
  '#D4AF37',
  '#3BA4BC',
  '#A8E0EE',
  '#E8652B',
  '#F5C99A',
  '#FCE8E4',
]

function getConfettiColors(): string[] {
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--palette-accent')
    .trim()
  const accentLight = getComputedStyle(document.documentElement)
    .getPropertyValue('--palette-accent-light')
    .trim()
  if (accent) {
    return [accent, accentLight || accent, ...MAMMA_MIA_COLORS].filter(Boolean)
  }
  return MAMMA_MIA_COLORS
}

export function fireCheckInConfetti(status: CheckInStatus, origin?: { x: number; y: number }) {
  if (status !== 'in') return

  const colors = getConfettiColors()
  confetti({
    origin: origin ?? { x: 0.5, y: 0.7 },
    spread: 60,
    ticks: 100,
    gravity: 0.8,
    decay: 0.92,
    startVelocity: 30,
    particleCount: 40,
    colors,
  })
}

export function fireMiniSparkle() {
  confetti({
    particleCount: 12,
    spread: 40,
    startVelocity: 15,
    gravity: 1.2,
    ticks: 60,
    origin: { x: 0.5, y: 0.5 },
    colors: getConfettiColors(),
    scalar: 0.6,
  })
}
