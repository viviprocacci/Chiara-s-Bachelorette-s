import { motion } from 'framer-motion'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export default function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-[var(--palette-bg-secondary)] p-3 shadow-lg backdrop-blur-xl">
        <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: 'var(--palette-accent)' }}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 px-1 text-xs text-[var(--palette-text-muted)]"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
