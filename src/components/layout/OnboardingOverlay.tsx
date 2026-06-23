import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Camera, Luggage, DollarSign, Receipt } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import { hasCompletedOnboarding, markOnboardingComplete } from '@/lib/storage'

type OnboardingStep = {
  headline: (name: string) => string
  body: string
  icons: typeof Sparkles[]
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
        ? "Everyone can check the packing list — you're the bride, so on Split tap Add to put expenses on the group receipt."
        : 'Check off the packing list and see what you owe on the group receipt.',
      icons: isBride ? [Luggage, Receipt] : [Luggage, DollarSign],
    },
  ]
}

type OnboardingContextValue = {
  showOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}

function OnboardingOverlay({ onFinish }: { onFinish: () => void }) {
  const { member, isOrganizer } = useTrip()
  const [step, setStep] = useState(0)
  const steps = useMemo(() => getSteps(isOrganizer), [isOrganizer])

  const firstName = member?.display_name?.split(' ')[0] ?? 'babe'
  const current = steps[step]
  const isLast = step === steps.length - 1

  const finish = () => {
    if (member) markOnboardingComplete(member.id)
    onFinish()
  }

  const next = () => {
    if (isLast) finish()
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
                {current.icons.map((Icon, i) => (
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
                ))}
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold text-[var(--palette-text)]">
                    {current.headline(firstName)}
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--palette-text-muted)]">
                    {current.body}
                  </p>
                </div>
              </div>
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
            <button type="button" onClick={finish} className="btn-secondary flex-1 py-2.5 text-sm">
              Skip
            </button>
            <button type="button" onClick={next} className="btn-primary flex-1 py-2.5 text-sm">
              {isLast ? "Let's go ✨" : 'Next'}
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
    <OnboardingContext.Provider value={{ showOnboarding }}>
      {children}
      <AnimatePresence>
        {show && member && <OnboardingOverlay onFinish={hideOnboarding} />}
      </AnimatePresence>
    </OnboardingContext.Provider>
  )
}
