import { motion } from 'framer-motion'
import { useState } from 'react'
import { fireMiniSparkle } from '@/lib/confetti'
import { playSparkleSound } from '@/lib/feedback'
import type { PackingCategory } from '@/types'
import { PACKING_CATEGORY_LABELS } from '@/types'

interface PackingItemRowProps {
  id: string
  label: string
  category: PackingCategory
  isPacked: boolean
  assignedName?: string
  canAssign: boolean
  onToggle: () => void
  onAssign: () => void
}

export function PackingItemRow({
  label,
  isPacked,
  assignedName,
  canAssign,
  onToggle,
  onAssign,
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
        <p className={`text-sm font-medium ${isPacked ? 'line-through' : ''}`}>{label}</p>
        {assignedName && (
          <p className="text-[10px] text-[var(--palette-text-muted)]">{assignedName} is bringing this</p>
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
