import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import PageHeader from '@/components/layout/PageHeader'
import { PackingItemRow, CategoryFilter } from '@/components/packing/PackingItemRow'
import type { PackingCategory } from '@/types'

export default function PackingPage() {
  const { packingItems, members, member, packItem, assignItem, addItem } = useTrip()
  const [category, setCategory] = useState<PackingCategory | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState<PackingCategory>('misc')

  const filtered = category === 'all'
    ? packingItems
    : packingItems.filter((p) => p.category === category)

  const packedCount = packingItems.filter((p) => p.is_packed).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    await addItem(newLabel.trim(), newCategory)
    setNewLabel('')
    setShowAdd(false)
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Packing List"
        subtitle={`${packedCount}/${packingItems.length} packed`}
      />

      <div className="px-4">
        <CategoryFilter active={category} onChange={setCategory} />
      </div>

      <div className="scroll-content space-y-2">
        {filtered.map((item) => {
          const assigned = members.find((m) => m.id === item.assigned_member_id)
          return (
            <PackingItemRow
              key={item.id}
              id={item.id}
              label={item.label}
              category={item.category}
              isPacked={item.is_packed}
              assignedName={assigned?.display_name}
              canAssign
              onToggle={() => void packItem(item.id, !item.is_packed)}
              onAssign={() =>
                void assignItem(
                  item.id,
                  item.assigned_member_id === member?.id ? null : member?.id ?? null,
                )
              }
            />
          )
        })}

        {showAdd ? (
          <form onSubmit={(e) => void handleAdd(e)} className="glass-card space-y-3 p-4">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="What to pack?"
              className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as PackingCategory)}
              className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none"
            >
              <option value="outfits">Outfits</option>
              <option value="toiletries">Toiletries</option>
              <option value="shared_gear">Shared Gear</option>
              <option value="misc">Misc</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Add</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--palette-accent-light)] py-3 text-sm font-medium text-[var(--palette-accent)]"
          >
            <Plus size={16} /> Add item
          </button>
        )}
      </div>
    </div>
  )
}
