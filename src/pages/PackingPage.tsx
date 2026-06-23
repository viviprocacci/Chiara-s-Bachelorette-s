import { useMemo, useState } from 'react'
import { Plus, Users, Lock } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import PageHeader from '@/components/layout/PageHeader'
import { PackingItemRow, CategoryFilter, VisibilityFilter } from '@/components/packing/PackingItemRow'
import type { PackingCategory, PackingItem, PackingVisibility } from '@/types'

type ListView = 'all' | PackingVisibility

function sortItems(items: PackingItem[]) {
  return [...items].sort((a, b) => {
    if (a.is_packed !== b.is_packed) return a.is_packed ? 1 : -1
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (orderDiff !== 0) return orderDiff
    return a.label.localeCompare(b.label)
  })
}

export default function PackingPage() {
  const {
    packingItems,
    members,
    member,
    loading,
    isOrganizer,
    packItem,
    assignItem,
    addItem,
    removeItem,
    reorderItems,
  } = useTrip()
  const [category, setCategory] = useState<PackingCategory | 'all'>('all')
  const [listView, setListView] = useState<ListView>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState<PackingCategory>('misc')
  const [newVisibility, setNewVisibility] = useState<PackingVisibility>('shared')

  const canReorderList = category === 'all'

  const byCategory = useMemo(() => {
    if (category === 'all') return packingItems
    return packingItems.filter((p) => p.category === category)
  }, [packingItems, category])

  const sharedItems = useMemo(
    () => sortItems(byCategory.filter((p) => p.visibility === 'shared')),
    [byCategory],
  )
  const privateItems = useMemo(
    () => sortItems(byCategory.filter((p) => p.visibility === 'private')),
    [byCategory],
  )

  const visibleItems = listView === 'all' ? byCategory : listView === 'shared' ? sharedItems : privateItems
  const packedCount = visibleItems.filter((p) => p.is_packed).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    try {
      await addItem(newLabel.trim(), newCategory, newVisibility)
      setNewLabel('')
      setNewVisibility('shared')
      setShowAdd(false)
    } catch {
      window.alert('Could not add item — try again.')
    }
  }

  const handleMove = async (items: PackingItem[], index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await reorderItems(next.map((item) => item.id))
    } catch {
      window.alert('Could not reorder — try again.')
    }
  }

  const renderItems = (items: PackingItem[], options: { canReorder: boolean }) =>
    items.map((item, index) => {
      const assigned = members.find((m) => m.id === item.assigned_member_id)
      const isPrivate = item.visibility === 'private'
      const isCreator = item.created_by_member_id === member?.id
      const canDelete = isPrivate ? isCreator || isOrganizer : true

      return (
        <PackingItemRow
          key={item.id}
          id={item.id}
          label={item.label}
          category={item.category}
          isPacked={item.is_packed}
          isPrivate={isPrivate}
          assignedName={assigned?.display_name}
          canAssign={!isPrivate}
          canDelete={canDelete}
          canReorder={options.canReorder}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          deleteLabel={
            isPrivate
              ? 'Remove this private item?'
              : 'Remove this from the group list?'
          }
          onToggle={async () => {
            try {
              await packItem(item.id, !item.is_packed)
            } catch {
              window.alert('Could not update item — try again.')
            }
          }}
          onAssign={async () => {
            try {
              await assignItem(
                item.id,
                item.assigned_member_id === member?.id ? null : member?.id ?? null,
              )
            } catch {
              window.alert('Could not assign item — try again.')
            }
          }}
          onDelete={async () => {
            try {
              await removeItem(item.id)
            } catch {
              window.alert('Could not remove item — try again.')
            }
          }}
          onMoveUp={() => void handleMove(items, index, 'up')}
          onMoveDown={() => void handleMove(items, index, 'down')}
        />
      )
    })

  const showSharedSection = listView !== 'private' && sharedItems.length > 0
  const showPrivateSection = listView !== 'shared' && privateItems.length > 0

  return (
    <div className="page-container">
      <PageHeader
        title="Packing List"
        subtitle={
          loading
            ? 'Loading…'
            : `${packedCount}/${visibleItems.length} packed${canReorderList ? ' · use arrows to reorder' : ''}`
        }
      />

      <div className="space-y-2 px-4">
        <VisibilityFilter active={listView} onChange={setListView} />
        <CategoryFilter active={category} onChange={setCategory} />
      </div>

      <div className="scroll-content space-y-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--palette-text-muted)]">Loading packing list…</p>
        ) : visibleItems.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-sm font-medium text-[var(--palette-text)]">Nothing here yet</p>
            <p className="mt-1 text-xs text-[var(--palette-text-muted)]">
              {listView === 'private'
                ? 'Add a private item only you will see.'
                : 'Add shared gear for the group or keep personal items private.'}
            </p>
          </div>
        ) : listView === 'all' ? (
          <>
            {showSharedSection && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--palette-text-muted)]">
                  <Users size={12} />
                  Group list
                </h3>
                {renderItems(sharedItems, { canReorder: canReorderList })}
              </section>
            )}
            {showPrivateSection && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--palette-text-muted)]">
                  <Lock size={12} />
                  Just mine
                </h3>
                {renderItems(privateItems, { canReorder: canReorderList })}
              </section>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {renderItems(
              listView === 'shared' ? sharedItems : privateItems,
              { canReorder: canReorderList },
            )}
          </div>
        )}

        {showAdd ? (
          <form onSubmit={(e) => void handleAdd(e)} className="glass-card space-y-3 p-4">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="What to pack?"
              className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
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

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                Who can see this?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewVisibility('shared')}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    newVisibility === 'shared'
                      ? 'border-[var(--palette-accent)] bg-[var(--palette-accent)]/15 text-[var(--palette-text)]'
                      : 'border-white/60 bg-white/40 text-[var(--palette-text-muted)]'
                  }`}
                >
                  <Users size={16} />
                  Shared
                  <span className="text-[10px] font-normal opacity-80">Everyone sees it</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewVisibility('private')}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    newVisibility === 'private'
                      ? 'border-[var(--palette-accent)] bg-[var(--palette-accent)]/15 text-[var(--palette-text)]'
                      : 'border-white/60 bg-white/40 text-[var(--palette-text-muted)]'
                  }`}
                >
                  <Lock size={16} />
                  Private
                  <span className="text-[10px] font-normal opacity-80">Only you</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Add</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">
                Cancel
              </button>
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
