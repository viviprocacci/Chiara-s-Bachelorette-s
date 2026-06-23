import { motion } from 'framer-motion'
import { useState } from 'react'
import { Lock, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { fireMiniSparkle } from '@/lib/confetti'
import { playSparkleSound } from '@/lib/feedback'
import type { PackingCategory, PackingVisibility } from '@/types'
import { PACKING_CATEGORY_LABELS } from '@/types'

interface PackingItemRowProps {
  id: string
  label: string
  category: PackingCategory
  isPacked: boolean
  isPrivate?: boolean
  assignedName?: string
  canAssign: boolean
  canDelete?: boolean
  canReorder?: boolean
  isFirst?: boolean
  isLast?: boolean
  onToggle: () => void
  onAssign: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  deleteLabel?: string
}

export function PackingItemRow({
  label,
  isPacked,
  isPrivate,
  assignedName,
  canAssign,
  canDelete,
  canReorder,
  isFirst,
  isLast,
  onToggle,
  onAssign,
  onDelete,
  onMoveUp,
  onMoveDown,
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
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
          isPacked
            ? 'border-[var(--palette-accent)] bg-[var(--palette-accent)] text-white'
            : 'border-[var(--palette-accent-light)] bg-white/50'
        }`}
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
        {assignedName && (
          <p className="text-[10px] text-[var(--palette-text-muted)]">{assignedName} is bringing this</p>
        )}
        {isPrivate && !assignedName && (
          <p className="text-[10px] text-[var(--palette-text-muted)]">Only you can see this</p>
        )}
      </div>
      {canAssign && !isPacked && (
        <button
          onClick={onAssign}
          className="text-[10px] font-semibold uppercase tracking-wide text-[var(--palette-accent)]"
        >
          {assignedName ? 'Change' : 'Mine'}
        </button>
      )}
      {canReorder && (
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded p-0.5 text-[var(--palette-text-muted)] transition-colors hover:text-[var(--palette-accent)] disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded p-0.5 text-[var(--palette-text-muted)] transition-colors hover:text-[var(--palette-accent)] disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      )}
      {canDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="text-[var(--palette-text-muted)] transition-colors hover:text-red-500"
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

export function VisibilityFilter({
  active,
  onChange,
}: {
  active: PackingVisibility | 'all'
  onChange: (view: PackingVisibility | 'all') => void
}) {
  const views: { id: PackingVisibility | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'shared', label: 'Shared' },
    { id: 'private', label: 'Private' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {views.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            active === id ? 'text-white' : 'bg-white/40 text-[var(--palette-text-muted)]'
          }`}
          style={active === id ? { background: 'var(--palette-accent)' } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function CategoryFilter({
  active,
  onChange,
}: {
  active: PackingCategory | 'all'
  onChange: (cat: PackingCategory | 'all') => void
}) {
  const categories: (PackingCategory | 'all')[] = ['all', 'outfits', 'toiletries', 'shared_gear', 'misc']

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            active === cat
              ? 'text-white'
              : 'bg-white/40 text-[var(--palette-text-muted)]'
          }`}
          style={active === cat ? { background: 'var(--palette-accent)' } : undefined}
        >
          {cat === 'all' ? 'All' : PACKING_CATEGORY_LABELS[cat]}
        </button>
      ))}
    </div>
  )
}
