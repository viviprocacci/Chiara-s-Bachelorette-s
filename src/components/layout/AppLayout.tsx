import type { ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import BottomNav from './BottomNav'
import DayDecorations from './DayDecorations'
import OnboardingProvider, { useOnboarding } from './OnboardingOverlay'
import InstallPrompt, { useInstallPrompt } from './InstallPrompt'
import { RealtimeToasts } from '@/hooks/useRealtime'

function AppShell({ children }: { children: ReactNode }) {
  const { onboardingVisible } = useOnboarding()
  const { show, dismiss, install, variant, canInstall } = useInstallPrompt({ enabled: !onboardingVisible })

  return (
    <div className="relative mx-auto h-full max-w-lg">
      <RealtimeToasts />
      {children}
      <BottomNav />
      <AnimatePresence>
        {show && (
          <InstallPrompt
            onDismiss={dismiss}
            onInstall={install}
            variant={variant}
            canInstall={canInstall}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DayDecorations />
      <OnboardingProvider>
        <AppShell>{children}</AppShell>
      </OnboardingProvider>
    </>
  )
}
