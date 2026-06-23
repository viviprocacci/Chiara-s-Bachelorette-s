import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Camera, Luggage, DollarSign, Receipt } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import { hasCompletedOnboarding, markOnboardingComplete } from '@/lib/storage'
import VenmoIcon from '@/components/expenses/VenmoIcon'

type OnboardingStep = {
  headline: (name: string) => string
  body: string
  icons: typeof Sparkles[]
  venmoInput?: boolean
}

function getSteps(isBride: boolean): OnboardingStep[] {
  return [
    {
      headline: (name) => (isBride ? `Hey, ${name}! ✨` : `Hey, ${name}!`),
      body: isBride
        ? "It's your bachelorette — here's your trip hub for the weekend."
        : "Welcome to the trip hub — here's a quick tour.",
      icons: [Sparkles],
    },
    {
      headline: () => 'Your schedule',
      body: isBride
        ? "See the full weekend plan and check in to events with the girls."
        : "See what's on each day and check in to events (I'm in / running late / skipping).",
      icons: [Calendar],
    },
    {
      headline: () => 'Feed & photos',
      body: isBride
        ? 'Share the memories and keep everyone posted with trip announcements.'
        : 'Share moments and see trip announcements in real time.',
      icons: [Camera],
    },
    {
      headline: () => (isBride ? 'Pack & the receipt' : 'Pack & split'),
      body: isBride
        ? 'Everyone can check the packing list and add expenses on Split — see who owes what at a glance.'
        : 'Check off shared gear or add private items only you see — plus split expenses on Split.',
      icons: isBride ? [Luggage, Receipt] : [Luggage, DollarSign],
    },
    {
      headline: () => 'Link Venmo',
      body: 'Optional — lets friends pay you in one tap from Split.',
      icons: [DollarSign],
      venmoInput: true,
    },
  ]
}

type OnboardingContextValue = {
  showOnboarding: () => void
  onboardingVisible: boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

function OnboardingOverlay({ onFinish }: { onFinish: () => void }) {
  const { member, isOrganizer, updateVenmoUsername } = useTrip()
  const [step, setStep] = useState(0)
  const [venmoUsername, setVenmoUsername] = useState(member?.venmo_username ?? '')
  const [saving, setSaving] = useState(false)
  const steps = useMemo(() => getSteps(isOrganizer), [isOrganizer])

  const firstName = member?.display_name?.split(' ')[0] ?? 'babe'
  const current = steps[step]
  const isLast = step === steps.length - 1

  useEffect(() => {
    setVenmoUsername(member?.venmo_username ?? '')
  }, [member?.venmo_username])

  const finish = async (saveVenmo: boolean) => {
    if (!member) return
    setSaving(true)
    try {
      if (saveVenmo && current.venmoInput) {
        const trimmed = venmoUsername.trim()
        await updateVenmoUsername(trimmed ? trimmed : null)
      }
      markOnboardingComplete(member.id)
      onFinish()
    } finally {
      setSaving(false)
    }
  }

  const next = () => {
    if (isLast) void finish(true)
    else setStep((s) => s + 1)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
      />
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-[4.75rem] left-0 right-0 z-50 mx-auto max-w-lg px-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="glass-card overflow-hidden p-5 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-4 flex items-center gap-3">
                {current.venmoInput ? (
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{
                      background: 'var(--palette-accent-light)',
                    }}
                  >
                    <VenmoIcon size={22} />
                  </div>
                ) : (
                  current.icons.map((Icon, i) => (
                    <div
                      key={i}
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        background: 'var(--palette-accent-light)',
                        color: 'var(--palette-accent)',
                      }}
                    >
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                  ))
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold text-[var(--palette-text)]">
                    {current.headline(firstName)}
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--palette-text-muted)]">
                    {current.body}
                  </p>
                </div>
              </div>

              {current.venmoInput && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                    Venmo username
                  </label>
                  <input
                    value={venmoUsername}
                    onChange={(e) => setVenmoUsername(e.target.value)}
                    placeholder="@your-username"
                    className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mb-4 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-[var(--palette-accent)]' : 'w-1.5 bg-[var(--palette-accent)]/30'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void finish(false)}
              disabled={saving}
              className="btn-secondary flex-1 py-2.5 text-sm disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={next}
              disabled={saving}
              className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : isLast ? "Let's go ✨" : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function OnboardingProvider({ children }: { children: ReactNode }) {
  const { loading, member } = useTrip()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading || !member) return
    if (!hasCompletedOnboarding(member.id)) setShow(true)
  }, [loading, member])

  const showOnboarding = useCallback(() => setShow(true), [])
  const hideOnboarding = useCallback(() => setShow(false), [])

  return (
    <OnboardingContext.Provider value={{ showOnboarding, onboardingVisible: show }}>
      {children}
      <AnimatePresence>
        {show && member && <OnboardingOverlay onFinish={hideOnboarding} />}
      </AnimatePresence>
    </OnboardingContext.Provider>
  )
}
