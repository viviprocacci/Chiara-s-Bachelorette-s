import type { AppSettings, SessionState } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const STORAGE_VERSION = 'prod_v1'
const SESSION_KEY = `chiara_bach_${STORAGE_VERSION}_session`
const SETTINGS_KEY = `chiara_bach_${STORAGE_VERSION}_settings`
const VISIT_KEY = `chiara_bach_${STORAGE_VERSION}_visits`
const INSTALL_DISMISSED_KEY = `chiara_bach_${STORAGE_VERSION}_install_dismissed`
const ONBOARDING_KEY = `chiara_bach_${STORAGE_VERSION}_onboarding`
export const PUSH_SUB_KEY = `chiara_bach_${STORAGE_VERSION}_push_sub`

const LEGACY_KEYS = [
  'chiara_bach_session',
  'chiara_bach_settings',
  'chiara_bach_visits',
  'chiara_bach_install_dismissed',
  'chiara_bach_onboarding',
  'chiara_bach_push_sub',
  'chiara_bach_demo_state',
  'chiara_bach_demo_state_v2',
]

/** Drop dev/test localStorage on first load after deploy. */
export function purgeLegacyStorage() {
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key)
  }
}

function getOnboardingMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function hasCompletedOnboarding(memberId: string): boolean {
  return getOnboardingMap()[memberId] === '1'
}

export function markOnboardingComplete(memberId: string): void {
  const map = getOnboardingMap()
  map[memberId] = '1'
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(map))
}

export function getSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SessionState) : null
  } catch {
    return null
  }
}

export function setSession(session: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function incrementVisitCount(): number {
  const count = parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10) + 1
  localStorage.setItem(VISIT_KEY, String(count))
  return count
}

export function getVisitCount(): number {
  return parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10)
}

export function isInstallPromptDismissed(): boolean {
  return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISSED_KEY, '1')
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString()
}

export function timeUntil(time: string): string | null {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)
  const diff = target.getTime() - now.getTime()
  if (diff < 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function simplifyDebts(
  balances: Record<string, number>,
  memberNames: Record<string, string>,
): string[] {
  return simplifyPairwiseDebts(balances).map(
    (p) =>
      `${memberNames[p.debtorId] ?? 'Someone'} owes ${memberNames[p.creditorId] ?? 'someone'} ${formatCurrency(p.amountCents)}`,
  )
}

export interface PairwiseDebt {
  debtorId: string
  creditorId: string
  amountCents: number
}

/** Greedy debt simplification — who owes whom how much. */
export function simplifyPairwiseDebts(balances: Record<string, number>): PairwiseDebt[] {
  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < -1) debtors.push({ id, amount: -balance })
    else if (balance > 1) creditors.push({ id, amount: balance })
  }

  const pairs: PairwiseDebt[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount)
    pairs.push({
      debtorId: debtors[i].id,
      creditorId: creditors[j].id,
      amountCents: pay,
    })
    debtors[i].amount -= pay
    creditors[j].amount -= pay
    if (debtors[i].amount < 1) i++
    if (creditors[j].amount < 1) j++
  }
  return pairs
}

export function getDebtsOwedTo(
  creditorId: string,
  balances: Record<string, number>,
  memberNames: Record<string, string>,
): { id: string; name: string; amount: number }[] {
  return simplifyPairwiseDebts(balances)
    .filter((p) => p.creditorId === creditorId)
    .map((p) => ({
      id: p.debtorId,
      name: memberNames[p.debtorId] ?? 'Someone',
      amount: p.amountCents,
    }))
}
