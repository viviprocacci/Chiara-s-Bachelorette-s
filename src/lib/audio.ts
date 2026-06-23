let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, volume = 0.15, type: OscillatorType = 'sine') {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

export function playChime() {
  playTone(880, 0.15, 0.12)
  setTimeout(() => playTone(1108, 0.2, 0.1), 80)
  setTimeout(() => playTone(1318, 0.3, 0.08), 160)
}

export function playPartySound() {
  const notes = [523, 659, 784, 1046, 784, 1046]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, 0.1, 'triangle'), i * 100)
  })
}

export function playLowTone() {
  playTone(440, 0.25, 0.08, 'sine')
}

export function playMiniChime() {
  playTone(1046, 0.1, 0.06)
}
