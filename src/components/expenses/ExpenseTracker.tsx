import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, Copy, Check, Trash2 } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import { formatCurrency } from '@/lib/storage'
import UndoToast from '@/components/layout/UndoToast'
import type { Expense } from '@/types'

type PendingUndo =
  | { message: string; kind: 'restore'; expenses: Expense[] }
  | { message: string; kind: 'delete'; expenseId: string }

const UNDO_WINDOW_MS = 8000

function ReceiptDivider({ dashed = false }: { dashed?: boolean }) {
  return (
    <div
      className={`my-3 border-t ${dashed ? 'border-dashed' : 'border-solid'} border-[var(--palette-text)]/20`}
    />
  )
}

export default function ExpenseTracker() {
  const {
    expenses,
    members,
    member,
    trip,
    loading,
    isOrganizer,
    addNewExpense,
    clearExpenses,
    restoreExpenses,
    deleteExpense,
  } = useTrip()
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitAmong, setSplitAmong] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingUndo(null)
  }, [])

  const offerUndo = useCallback(
    (undo: PendingUndo) => {
      dismissUndo()
      setPendingUndo(undo)
      undoTimerRef.current = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS)
    },
    [dismissUndo],
  )

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (members.length === 0) return
    setPaidBy((prev) => prev || member?.id || members[0].id)
    setSplitAmong((prev) => (prev.length > 0 ? prev : members.map((m) => m.id)))
  }, [members, member?.id])

  const balances = useMemo(() => {
    const bal: Record<string, number> = {}
    members.forEach((m) => { bal[m.id] = 0 })

    expenses.forEach((exp) => {
      bal[exp.paid_by_member_id] = (bal[exp.paid_by_member_id] ?? 0) + exp.amount_cents
      exp.splits?.forEach((s) => {
        bal[s.member_id] = (bal[s.member_id] ?? 0) - s.share_cents
      })
    })
    return bal
  }, [expenses, members])

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount_cents, 0)

  const personOwes = useMemo(() => {
    return members
      .map((m) => ({ id: m.id, name: m.display_name, balance: balances[m.id] ?? 0 }))
      .filter((p) => p.balance < -1)
      .map((p) => ({ ...p, owes: -p.balance }))
      .sort((a, b) => b.owes - a.owes)
  }, [members, balances])

  const toggleSplitMember = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cents = Math.round(parseFloat(amount) * 100)
    const expenseLabel = label.trim()
    if (!expenseLabel || isNaN(cents) || cents <= 0 || splitAmong.length === 0) return
    const added = await addNewExpense(expenseLabel, cents, paidBy, splitAmong)
    setLabel('')
    setAmount('')
    setSplitAmong(members.map((m) => m.id))
    setShowForm(false)
    if (added) {
      offerUndo({ message: `Added "${expenseLabel}"`, kind: 'delete', expenseId: added.id })
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear all expenses? Tap Undo to bring them back.')) return
    const snapshot = expenses.map((exp) => ({
      ...exp,
      splits: exp.splits?.map((s) => ({ ...s })),
    }))
    setClearing(true)
    try {
      await clearExpenses()
      offerUndo({ message: 'All expenses cleared', kind: 'restore', expenses: snapshot })
    } finally {
      setClearing(false)
    }
  }

  const handleUndo = async () => {
    if (!pendingUndo) return
    const action = pendingUndo
    dismissUndo()
    if (action.kind === 'restore') await restoreExpenses(action.expenses)
    else await deleteExpense(action.expenseId)
  }

  const copySummary = () => {
    const oweLines = personOwes.map((p) => `${p.name} — owes ${formatCurrency(p.owes)}`)

    const text = [
      `${trip?.name ?? 'Trip'} — Cost Split Receipt`,
      '─'.repeat(32),
      ...oweLines,
      oweLines.length === 0 ? 'All square — no one owes anything!' : '',
      '',
      `Total spent: ${formatCurrency(totalSpent)}`,
      '',
      'All settled? Venmo your people!',
    ]
      .filter(Boolean)
      .join('\n')

    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-[var(--palette-text-muted)]">Loading expenses…</p>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {pendingUndo && (
          <UndoToast
            key="expense-undo"
            message={pendingUndo.message}
            onUndo={() => void handleUndo()}
            onDismiss={dismissUndo}
          />
        )}
      </AnimatePresence>
      <div
        className="overflow-hidden rounded-2xl border border-[var(--palette-text)]/10 bg-[#FFFBF8] p-5 shadow-sm"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--palette-text-muted)]">
            Cost Split
          </p>
          <h3 className="mt-1 font-display text-lg font-bold tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {trip?.name ?? 'Trip Receipt'}
          </h3>
          <p className="mt-0.5 text-[10px] text-[var(--palette-text-muted)]">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <ReceiptDivider />

        {expenses.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--palette-text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {isOrganizer ? 'No expenses yet — tap Add to split a bill' : 'No expenses yet — all square!'}
          </p>
        ) : personOwes.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--palette-text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            All square — no one owes anything!
          </p>
        ) : (
          <>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-[var(--palette-text-muted)]">
              Each person owes
            </p>
            <ul className="space-y-2">
              {personOwes.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{p.name}</span>
                  <span className="font-mono tabular-nums">{formatCurrency(p.owes)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {expenses.length > 0 && (
          <>
            <ReceiptDivider />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span>TOTAL</span>
                <span className="font-mono tabular-nums">{formatCurrency(totalSpent)}</span>
              </div>
            </div>
            {personOwes.length > 0 && (
              <button
                onClick={copySummary}
                className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--palette-accent)]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy receipt'}
              </button>
            )}
          </>
        )}
      </div>

      {isOrganizer && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Add Expense</h3>
            <div className="flex gap-2">
              {expenses.length > 0 && (
                <button
                  onClick={() => void handleClear()}
                  disabled={clearing}
                  className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                >
                  <Trash2 size={14} /> {clearing ? 'Clearing…' : 'Clear all'}
                </button>
              )}
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: 'var(--palette-accent)' }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {showForm && (
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="glass-card space-y-3 p-4"
            >
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="What was it for?"
                className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
              />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount ($)"
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
              />
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.display_name} paid</option>
                ))}
              </select>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                  Split evenly between
                </p>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const selected = splitAmong.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleSplitMember(m.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selected
                            ? 'text-white'
                            : 'border border-white/60 bg-white/40 text-[var(--palette-text-muted)]'
                        }`}
                        style={selected ? { background: 'var(--palette-accent)' } : undefined}
                      >
                        {m.display_name}
                      </button>
                    )
                  })}
                </div>
                {splitAmong.length > 0 && amount && !isNaN(parseFloat(amount)) && (
                  <p className="mt-2 text-center text-xs text-[var(--palette-text-muted)]">
                    {formatCurrency(Math.round((parseFloat(amount) * 100) / splitAmong.length))} each
                    · {splitAmong.length} people
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={splitAmong.length === 0}
                className="btn-primary w-full disabled:opacity-50"
              >
                Add to receipt
              </button>
            </form>
          )}
        </div>
      )}

      {!isOrganizer && expenses.length > 0 && personOwes.length === 0 && (
        <p className="text-center text-xs text-[var(--palette-text-muted)]">
          Chiara manages the cost split — ask her to add new expenses
        </p>
      )}
    </div>
  )
}
