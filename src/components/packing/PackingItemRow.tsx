import { motion } from 'framer-motion'
import { useState } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { fireMiniSparkle } from '@/lib/confetti'
import { playSparkleSound } from '@/lib/feedback'

interface PackingItemRowProps {
  label: string
  isPacked: boolean
  isPrivate?: boolean
  assignedName?: string
  assignedToMe?: boolean
  canClaim?: boolean
  canDelete?: boolean
  onToggle: () => void
  onClaim?: () => void
  onUnclaim?: () => void
  onDelete?: () => void
  deleteLabel?: string
}

export function PackingItemRow({
  label,
  isPacked,
  isPrivate,
  assignedName,
  assignedToMe,
  canClaim,
  canDelete,
  onToggle,
  onClaim,
  onUnclaim,
  onDelete,
  deleteLabel = 'Remove this item from the list?',
}: PackingItemRowProps) {
  const [animating, setAnimating] = useState(false)

  const handleToggle = () => {
    if (!isPacked) {
      setAnimating(true)
      fireMiniSparkle()
      playSparkleSound()
      setTimeout(() => setAnimating(false), 600)
    }
    onToggle()
  }

  const handleDelete = () => {
    if (!window.confirm(deleteLabel)) return
    onDelete?.()
  }

  return (
    <motion.div
      layout
      className={`glass-card flex items-center gap-3 p-3 ${isPacked ? 'opacity-60' : ''}`}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
          isPacked
            ? 'border-[var(--palette-accent)] bg-[var(--palette-accent)] text-white'
            : 'border-[var(--palette-accent-light)] bg-white/50'
        }`}
        aria-label={isPacked ? 'Mark as not packed' : 'Mark as packed'}
      >
        {isPacked && '✓'}
      </motion.button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium ${isPacked ? 'line-through' : ''}`}>{label}</p>
          {isPrivate && (
            <Lock size={12} className="shrink-0 text-[var(--palette-text-muted)]" aria-label="Private item" />
          )}
        </div>
        {assignedName && !assignedToMe && (
          <p className="text-[10px] text-[var(--palette-text-muted)]">{assignedName} is bringing this</p>
        )}
        {assignedToMe && (
          <p className="text-[10px] text-[var(--palette-text-muted)]">You're bringing this</p>
        )}
        {isPrivate && !assignedName && (
          <p className="text-[10px] text-[var(--palette-text-muted)]">Only you can see this</p>
        )}
      </div>
      {!isPacked && canClaim && onClaim && (
        <button
          type="button"
          onClick={onClaim}
          className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-[var(--palette-accent)] transition-colors hover:bg-[var(--palette-accent)]/10"
        >
          I'll bring it
        </button>
      )}
      {!isPacked && assignedToMe && onUnclaim && (
        <button
          type="button"
          onClick={onUnclaim}
          className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-[var(--palette-text-muted)] transition-colors hover:bg-white/40"
        >
          Unclaim
        </button>
      )}
      {canDelete && onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className="shrink-0 text-[var(--palette-text-muted)] transition-colors hover:text-red-500"
          aria-label="Remove item"
        >
          <Trash2 size={14} />
        </button>
      )}
      {animating && (
        <motion.span
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          className="text-[var(--palette-accent)]"
        >
          ✦
        </motion.span>
      )}
    </motion.div>
  )
}
