import type { ReactNode } from 'react'
import BottomNav from './BottomNav'
import DayDecorations from './DayDecorations'
import OnboardingProvider from './OnboardingOverlay'
import { RealtimeToasts } from '@/hooks/useRealtime'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DayDecorations />
      <OnboardingProvider>
        <div className="relative mx-auto h-full max-w-lg">
          <RealtimeToasts />
          {children}
          <BottomNav />
        </div>
      </OnboardingProvider>
    </>
  )
}
