import confetti from 'canvas-confetti'
import { getSettings } from '@/lib/storage'
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

  const settings = getSettings()
  const multiplier = settings.chaosMode ? 3 : 1
  const colors = getConfettiColors()
  const defaults = {
    origin: origin ?? { x: 0.5, y: 0.7 },
    spread: settings.chaosMode ? 100 : 60,
    ticks: settings.chaosMode ? 200 : 100,
    gravity: 0.8,
    decay: 0.92,
    startVelocity: settings.chaosMode ? 45 : 30,
    colors,
  }

  for (let i = 0; i < multiplier; i++) {
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: settings.chaosMode ? 80 : 40,
        origin: {
          x: (defaults.origin.x ?? 0.5) + (Math.random() - 0.5) * 0.2,
          y: defaults.origin.y,
        },
      })
    }, i * 150)
  }

  if (settings.chaosMode) {
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      })
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      })
    }, 300)
  }
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
