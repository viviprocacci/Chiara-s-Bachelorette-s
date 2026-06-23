import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Download } from 'lucide-react'
import { incrementVisitCount, getVisitCount, isInstallPromptDismissed, dismissInstallPrompt } from '@/lib/storage'

interface InstallPromptProps {
  onDismiss: () => void
}

export default function InstallPrompt({ onDismiss }: InstallPromptProps) {
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
          <Download size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add to Home Screen</p>
          <p className="text-xs text-[var(--palette-text-muted)]">
            Install for the full experience — offline schedule & notifications
          </p>
        </div>
        <button onClick={onDismiss} className="p-1 text-[var(--palette-text-muted)]">
          <X size={18} />
        </button>
      </div>
    </motion.div>
  )
}

export function useInstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null)

  useEffect(() => {
    incrementVisitCount()
    if (
      getVisitCount() >= 2 &&
      !window.matchMedia('(display-mode: standalone)').matches &&
      !isInstallPromptDismissed()
    ) {
      setShow(true)
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> })
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

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

  return { show, dismiss, install }
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
