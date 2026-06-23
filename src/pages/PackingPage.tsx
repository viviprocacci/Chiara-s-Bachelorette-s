import { useMemo, useState } from 'react'
import { Plus, Users, Lock } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import PageHeader from '@/components/layout/PageHeader'
import { PackingItemRow } from '@/components/packing/PackingItemRow'
import type { PackingItem, PackingVisibility } from '@/types'

type ListTab = PackingVisibility

function sortItems(items: PackingItem[]) {
  return [...items].sort((a, b) => {
    if (a.is_packed !== b.is_packed) return a.is_packed ? 1 : -1
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (orderDiff !== 0) return orderDiff
    return a.label.localeCompare(b.label)
  })
}

function actionError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  return 'Something went wrong — try again.'
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
  } = useTrip()
  const [tab, setTab] = useState<ListTab>('shared')
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleItems = useMemo(
    () => sortItems(packingItems.filter((p) => p.visibility === tab)),
    [packingItems, tab],
  )
  const packedCount = visibleItems.filter((p) => p.is_packed).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newLabel.trim()
    if (!trimmed || adding) return
    setError(null)
    setAdding(true)
    try {
      await addItem(trimmed, 'misc', tab)
      setNewLabel('')
    } catch (err) {
      setError(actionError(err))
    } finally {
      setAdding(false)
    }
  }

  const runAction = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(actionError(err))
    }
  }

  const tabs: { id: ListTab; label: string; icon: typeof Users }[] = [
    { id: 'shared', label: 'Group', icon: Users },
    { id: 'private', label: 'Mine', icon: Lock },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Packing List"
        subtitle={
          loading
            ? 'Loading…'
            : `${packedCount}/${visibleItems.length} packed`
        }
      />

      <div className="px-4 pb-2">
        <div className="flex rounded-xl border border-white/60 bg-white/40 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id)
                setError(null)
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                tab === id ? 'text-white shadow-sm' : 'text-[var(--palette-text-muted)]'
              }`}
              style={tab === id ? { background: 'var(--palette-accent)' } : undefined}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-content space-y-4">
        <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={tab === 'shared' ? 'Add for the group…' : 'Add to your list…'}
            disabled={adding}
            className="min-w-0 flex-1 rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newLabel.trim() || adding}
            className="btn-primary flex shrink-0 items-center gap-1 px-4 py-2.5 text-sm disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </form>

        {error && (
          <p className="rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--palette-text-muted)]">Loading packing list…</p>
        ) : visibleItems.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-sm font-medium text-[var(--palette-text)]">Nothing here yet</p>
            <p className="mt-1 text-xs text-[var(--palette-text-muted)]">
              {tab === 'private'
                ? 'Your personal packing list — only you can see these items.'
                : 'Add shared gear the whole group can see and claim.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map((item) => {
              const assigned = members.find((m) => m.id === item.assigned_member_id)
              const isPrivate = item.visibility === 'private'
              const isCreator = item.created_by_member_id === member?.id
              const assignedToMe = item.assigned_member_id === member?.id
              const canDelete = isPrivate ? isCreator || isOrganizer : true
              const canClaim = tab === 'shared' && !item.assigned_member_id

              return (
                <PackingItemRow
                  key={item.id}
                  label={item.label}
                  isPacked={item.is_packed}
                  isPrivate={isPrivate}
                  assignedName={assigned?.display_name}
                  assignedToMe={assignedToMe}
                  canClaim={canClaim}
                  canDelete={canDelete}
                  deleteLabel={
                    isPrivate
                      ? 'Remove this private item?'
                      : 'Remove this from the group list?'
                  }
                  onToggle={() =>
                    void runAction(() => packItem(item.id, !item.is_packed))
                  }
                  onClaim={
                    tab === 'shared'
                      ? () => void runAction(() => assignItem(item.id, member?.id ?? null))
                      : undefined
                  }
                  onUnclaim={
                    assignedToMe
                      ? () => void runAction(() => assignItem(item.id, null))
                      : undefined
                  }
                  onDelete={() => void runAction(() => removeItem(item.id))}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
