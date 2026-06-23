import type { CheckInStatus } from '@/types'
import { getSettings } from '@/lib/storage'
import { playChime, playLowTone, playMiniChime, playPartySound } from '@/lib/audio'

export function triggerHaptic(status: CheckInStatus) {
  const settings = getSettings()
  if (!settings.hapticsEnabled || !navigator.vibrate) return

  if (status === 'in') {
    navigator.vibrate(settings.chaosMode ? [100, 50, 100, 50, 200] : [100, 50, 100])
  } else if (status === 'late') {
    navigator.vibrate(80)
  }
}

export function playCheckInSound(status: CheckInStatus) {
  const settings = getSettings()
  if (!settings.soundEnabled) return

  if (status === 'in') {
    settings.chaosMode ? playPartySound() : playChime()
  } else if (status === 'late') {
    playLowTone()
  }
}

export function playSparkleSound() {
  const settings = getSettings()
  if (!settings.soundEnabled) return
  playMiniChime()
}
