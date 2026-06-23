import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Copy, Check, Trash2, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import { formatCurrency } from '@/lib/storage'
import UndoToast from '@/components/layout/UndoToast'
import VenmoIcon, { openVenmoPay } from '@/components/expenses/VenmoIcon'
import type { Expense } from '@/types'

type PendingUndo =
  | { message: string; kind: 'restore'; expenses: Expense[] }
  | { message: string; kind: 'delete'; expenseId: string }

const UNDO_WINDOW_MS = 8000

function ReceiptDivider({ dashed = false }: { dashed?: boolean }) {
  return (
    <div
      className={`my-3 border-t ${dashed ? 'border-dashed' : 'border-solid'} border-[var(--palette-text)]/15`}
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

  const memberName = useCallback(
    (id: string) => members.find((m) => m.id === id)?.display_name ?? 'Someone',
    [members],
  )

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

  const myBalance = member ? (balances[member.id] ?? 0) : 0
  const youOwe = myBalance < -1 ? -myBalance : 0
  const youAreOwed = myBalance > 1 ? myBalance : 0
  const allSquare = youOwe === 0 && youAreOwed === 0

  const peopleWhoOwe = useMemo(() => {
    return members
      .map((m) => ({ id: m.id, name: m.display_name, balance: balances[m.id] ?? 0 }))
      .filter((p) => p.balance < -1)
      .map((p) => ({ ...p, amount: -p.balance }))
      .sort((a, b) => b.amount - a.amount)
  }, [members, balances])

  const peopleOwed = useMemo(() => {
    return members
      .map((m) => ({
        id: m.id,
        name: m.display_name,
        venmo_username: m.venmo_username,
        balance: balances[m.id] ?? 0,
      }))
      .filter((p) => p.balance > 1)
      .map((p) => ({ ...p, amount: p.balance }))
      .sort((a, b) => b.amount - a.amount)
  }, [members, balances])

  const primaryCreditor = useMemo(() => {
    if (youOwe <= 0) return null
    return peopleOwed.find((p) => p.id !== member?.id) ?? null
  }, [youOwe, peopleOwed, member?.id])

  const venmoPayNote = useMemo(() => {
    if (youOwe <= 0) return null
    return primaryCreditor
      ? `${trip?.name ?? 'Trip'} — pay ${primaryCreditor.name.split(' ')[0]}`
      : `${trip?.name ?? 'Trip'} split`
  }, [youOwe, primaryCreditor, trip?.name])

  const handleVenmoPay = () => {
    if (youOwe <= 0 || !venmoPayNote) return
    openVenmoPay(youOwe, venmoPayNote, primaryCreditor?.venmo_username ?? undefined)
  }

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

  const handleRemoveExpense = async (exp: Expense) => {
    if (!window.confirm(`Remove "${exp.label}" from the receipt?`)) return
    const snapshot: Expense = {
      ...exp,
      splits: exp.splits?.map((s) => ({ ...s })),
    }
    try {
      await deleteExpense(exp.id)
      offerUndo({ message: `Removed "${exp.label}"`, kind: 'restore', expenses: [snapshot] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/policy|permission|42501|RLS|row-level security/i.test(msg)) {
        window.alert(
          'Could not remove expense — run migration 016_expense_member_delete.sql in Supabase.',
        )
      } else {
        window.alert('Could not remove expense — try again.')
      }
    }
  }

  const copySummary = () => {
    const oweLines = peopleWhoOwe.map((p) => `${p.name} owes ${formatCurrency(p.amount)}`)
    const owedLines = peopleOwed.map((p) => `${p.name} is owed ${formatCurrency(p.amount)}`)

    const text = [
      `${trip?.name ?? 'Trip'} — Cost Split`,
      '─'.repeat(32),
      youOwe > 0 ? `You owe: ${formatCurrency(youOwe)}` : '',
      youAreOwed > 0 ? `You are owed: ${formatCurrency(youAreOwed)}` : '',
      allSquare && expenses.length > 0 ? 'All square!' : '',
      '',
      oweLines.length > 0 ? 'Owes:' : '',
      ...oweLines,
      '',
      owedLines.length > 0 ? 'Is owed:' : '',
      ...owedLines,
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

      {/* Personal balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        <div
          className={`glass-card flex flex-col items-center p-4 ${
            youOwe > 0 ? 'ring-2 ring-red-200/80' : ''
          }`}
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-400">
            <ArrowDownLeft size={18} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--palette-text-muted)]">
            You owe
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-red-500">
            {youOwe > 0 ? formatCurrency(youOwe) : '—'}
          </p>
          {youOwe > 0 && venmoPayNote && (
            <button
              type="button"
              onClick={handleVenmoPay}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-[#008CFF]/10 px-3 py-1.5 text-[11px] font-semibold text-[#008CFF] transition-colors hover:bg-[#008CFF]/20 active:scale-95"
            >
              <VenmoIcon size={16} />
              Pay on Venmo
            </button>
          )}
        </div>

        <div
          className={`glass-card flex flex-col items-center p-4 ${
            youAreOwed > 0 ? 'ring-2 ring-emerald-200/80' : ''
          }`}
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--palette-text-muted)]">
            You are owed
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-emerald-600">
            {youAreOwed > 0 ? formatCurrency(youAreOwed) : '—'}
          </p>
        </div>
      </motion.div>

      {allSquare && expenses.length > 0 && (
        <p className="text-center text-xs font-medium text-[var(--palette-text-muted)]">
          All square — nothing to settle
        </p>
      )}

      {/* Group breakdown */}
      {expenses.length > 0 && (peopleWhoOwe.length > 0 || peopleOwed.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3.5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-red-400">
              <ArrowDownLeft size={12} />
              Owes
            </p>
            {peopleWhoOwe.length === 0 ? (
              <p className="text-xs text-[var(--palette-text-muted)]">Nobody</p>
            ) : (
              <ul className="space-y-2">
                {peopleWhoOwe.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`truncate font-medium ${
                        p.id === member?.id ? 'text-red-500' : ''
                      }`}
                    >
                      {p.id === member?.id ? 'You' : p.name}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums font-semibold text-red-500">
                      {formatCurrency(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-card p-3.5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
              <ArrowUpRight size={12} />
              Is owed
            </p>
            {peopleOwed.length === 0 ? (
              <p className="text-xs text-[var(--palette-text-muted)]">Nobody</p>
            ) : (
              <ul className="space-y-2">
                {peopleOwed.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`truncate font-medium ${
                        p.id === member?.id ? 'text-emerald-600' : ''
                      }`}
                    >
                      {p.id === member?.id ? 'You' : p.name}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums font-semibold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Receipt */}
      <div
        className="overflow-hidden rounded-2xl border border-[var(--palette-text)]/10 bg-[#FFFBF8] p-5 shadow-sm"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-[var(--palette-text-muted)]">
              <Receipt size={11} />
              Receipt
            </p>
            <h3
              className="mt-1 font-display text-lg font-bold tracking-tight"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {trip?.name ?? 'Trip'}
            </h3>
            <p className="mt-0.5 text-[10px] text-[var(--palette-text-muted)]">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {expenses.length > 0 && (
            <button
              onClick={copySummary}
              className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--palette-accent)]/30 bg-white/60 px-2.5 py-1 text-[10px] font-semibold text-[var(--palette-accent)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>

        <ReceiptDivider />

        {expenses.length === 0 ? (
          <p
            className="py-6 text-center text-xs text-[var(--palette-text-muted)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            No expenses yet — tap Add to split a bill
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {expenses.map((exp) => (
                <li key={exp.id} className="flex items-start gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleRemoveExpense(exp)}
                    className="mt-px shrink-0 font-mono text-sm leading-4 text-[var(--palette-text)]/30 transition-colors hover:text-[var(--palette-text)]/65"
                    aria-label={`Remove ${exp.label}`}
                  >
                    −
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1 text-xs">
                      <span className="min-w-0 truncate font-semibold">{exp.label}</span>
                      <span
                        className="mb-0.5 min-w-[0.5rem] flex-1 border-b border-dotted border-[var(--palette-text)]/20"
                        aria-hidden
                      />
                      <span className="shrink-0 font-mono tabular-nums font-semibold">
                        {formatCurrency(exp.amount_cents)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[var(--palette-text-muted)]">
                      {memberName(exp.paid_by_member_id)} paid
                      {exp.splits && exp.splits.length > 0 && (
                        <> · split {exp.splits.length}</>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <ReceiptDivider dashed />

            <div className="flex items-baseline gap-1 text-xs font-semibold">
              <span>TOTAL</span>
              <span
                className="mb-0.5 min-w-[0.5rem] flex-1 border-b border-dotted border-[var(--palette-text)]/20"
                aria-hidden
              />
              <span className="font-mono tabular-nums">{formatCurrency(totalSpent)}</span>
            </div>
          </>
        )}
      </div>

      {/* Add expense — all members */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Add Expense</h3>
          <div className="flex gap-2">
            {isOrganizer && expenses.length > 0 && (
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

        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={(e) => void handleSubmit(e)}
              className="glass-card space-y-3 overflow-hidden p-4"
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
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
