import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Share } from 'lucide-react'
import { incrementVisitCount, getVisitCount, isInstallPromptDismissed, dismissInstallPrompt } from '@/lib/storage'

export type InstallPromptVariant = 'ios' | 'native' | 'fallback'

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

const COPY: Record<InstallPromptVariant, string> = {
  ios: 'Tap Share, then "Add to Home Screen" to install this app on your device.',
  native: 'Install for the full experience — offline schedule & notifications.',
  fallback: 'Add to Home Screen from your browser menu to install this app on your device.',
}

interface InstallPromptProps {
  onDismiss: () => void
  onInstall?: () => void
  variant: InstallPromptVariant
  canInstall?: boolean
}

export default function InstallPrompt({ onDismiss, onInstall, variant, canInstall }: InstallPromptProps) {
  const Icon = variant === 'ios' ? Share : Download

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-lg"
    >
      <div
        className="flex items-center gap-3 rounded-2xl border border-white/60 p-4 shadow-lg backdrop-blur-xl"
        style={{ background: 'var(--palette-bg-secondary)' }}
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: 'var(--palette-accent)' }}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add to Home Screen</p>
          <p className="text-xs text-[var(--palette-text-muted)]">{COPY[variant]}</p>
        </div>
        {canInstall && onInstall && (
          <button
            type="button"
            onClick={onInstall}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: 'var(--palette-accent)' }}
          >
            Install
          </button>
        )}
        <button type="button" onClick={onDismiss} className="p-1 text-[var(--palette-text-muted)]">
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )
}

export function useInstallPrompt({ enabled = true }: { enabled?: boolean } = {}) {
  const [show, setShow] = useState(false)
  const [eligible, setEligible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    incrementVisitCount()
    if (getVisitCount() >= 1 && !isStandalone() && !isInstallPromptDismissed()) {
      setEligible(true)
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> })
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  useEffect(() => {
    setShow(eligible && enabled)
  }, [eligible, enabled])

  const dismiss = useCallback(() => {
    dismissInstallPrompt()
    setShow(false)
  }, [])

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
    }
    dismissInstallPrompt()
    setShow(false)
  }, [deferredPrompt])

  const variant: InstallPromptVariant = canInstall ? 'native' : isIOS() ? 'ios' : 'fallback'

  return { show, dismiss, install, variant, canInstall }
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-lg"
    >
      <div
        className="glass-card flex items-center justify-between p-4 shadow-lg"
        onClick={onClose}
      >
        <p className="text-sm font-medium">{message}</p>
        <button className="ml-3 text-[var(--palette-text-muted)]">
          <X size={16} />
        </button>
      </div>
    </motion.div>
  )
}
