import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Volume2, Smartphone, Sparkles, LogOut, Zap, BookOpen } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import { useOnboarding } from '@/components/layout/OnboardingOverlay'
import PageHeader from '@/components/layout/PageHeader'
import { requestPushNotifications } from '@/lib/api'

export default function SettingsPage() {
  const { settings, updateSettings, logout, isDemo } = useTrip()
  const { showOnboarding } = useOnboarding()
  const [pushStatus, setPushStatus] = useState<string | null>(null)

  const toggles = [
    {
      key: 'hapticsEnabled' as const,
      icon: Smartphone,
      label: 'Haptic feedback',
      description: 'Light vibrations on check-in',
    },
    {
      key: 'soundEnabled' as const,
      icon: Volume2,
      label: 'Sound effects',
      description: 'Chimes and celebration sounds',
    },
    {
      key: 'chaosMode' as const,
      icon: Zap,
      label: 'Chaos Mode',
      description: '3x confetti, extra haptics & party sounds',
    },
  ]

  const handleNotifications = async () => {
    const granted = await requestPushNotifications()
    updateSettings({ notificationsEnabled: granted })
    setPushStatus(granted ? 'Notifications enabled!' : 'Could not enable notifications')
    setTimeout(() => setPushStatus(null), 3000)
  }

  return (
    <div className="page-container">
      <PageHeader title="Settings" showSettings={false} />

      <div className="scroll-content space-y-4">
        {isDemo && (
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 px-4 py-3 text-xs text-blue-800">
            Running in demo mode with local data. Connect Supabase in .env for live group sync.
          </div>
        )}

        <div className="glass-card divide-y divide-white/40">
          {toggles.map(({ key, icon: Icon, label, description }) => (
            <label key={key} className="flex cursor-pointer items-center gap-4 p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--palette-accent-light)', color: 'var(--palette-accent)' }}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[10px] text-[var(--palette-text-muted)]">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[key]}
                onClick={() => updateSettings({ [key]: !settings[key] })}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  settings[key] ? 'bg-[var(--palette-accent)]' : 'bg-gray-300/60'
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
                  animate={{ left: settings[key] ? '1.375rem' : '0.125rem' }}
                />
              </button>
            </label>
          ))}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--palette-accent-light)', color: 'var(--palette-accent)' }}
            >
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Push notifications</p>
              <p className="text-[10px] text-[var(--palette-text-muted)]">
                Get alerts for schedule changes & arrivals
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleNotifications()}
            className="btn-secondary mt-3 w-full text-sm"
          >
            {settings.notificationsEnabled ? 'Notifications on' : 'Enable notifications'}
          </button>
          {pushStatus && (
            <p className="mt-2 text-center text-xs text-[var(--palette-accent)]">{pushStatus}</p>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--palette-accent-light)', color: 'var(--palette-accent)' }}
            >
              <BookOpen size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Replay tour</p>
              <p className="text-[10px] text-[var(--palette-text-muted)]">
                See how the app works again
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={showOnboarding}
            className="btn-secondary mt-3 w-full text-sm"
          >
            Start tour
          </button>
        </div>

        <div className="glass-card p-4 text-center">
          <Sparkles size={24} className="mx-auto text-[var(--palette-accent)]" />
          <p className="mt-2 font-display text-lg font-semibold">Chiara's Bachelorette</p>
          <p className="text-xs text-[var(--palette-text-muted)]">West Palm Beach · July 10–12, 2026</p>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/60 bg-red-50/40 py-3 text-sm font-medium text-red-600"
        >
          <LogOut size={16} /> Leave trip
        </button>
      </div>
    </div>
  )
}
