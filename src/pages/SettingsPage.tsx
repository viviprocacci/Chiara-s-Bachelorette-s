import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Volume2, Smartphone, Sparkles, LogOut, BookOpen, Users } from 'lucide-react'
import { useTrip } from '@/context/TripContext'
import { useOnboarding } from '@/components/layout/OnboardingOverlay'
import PageHeader from '@/components/layout/PageHeader'
import { requestPushNotifications } from '@/lib/api'
import VenmoIcon from '@/components/expenses/VenmoIcon'

export default function SettingsPage() {
  const { member, settings, updateSettings, updateVenmoUsername, logout, isDemo, isOrganizer, restoreMembers } =
    useTrip()
  const { showOnboarding } = useOnboarding()
  const [pushStatus, setPushStatus] = useState<string | null>(null)
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null)
  const [venmoUsername, setVenmoUsername] = useState(member?.venmo_username ?? '')
  const [venmoStatus, setVenmoStatus] = useState<string | null>(null)
  const [venmoSaving, setVenmoSaving] = useState(false)

  useEffect(() => {
    setVenmoUsername(member?.venmo_username ?? '')
  }, [member?.venmo_username])

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
  ]

  const handleNotifications = async () => {
    const granted = await requestPushNotifications()
    updateSettings({ notificationsEnabled: granted })
    setPushStatus(granted ? 'Notifications enabled!' : 'Could not enable notifications')
    setTimeout(() => setPushStatus(null), 3000)
  }

  const handleRestoreMembers = async () => {
    setRestoreStatus(null)
    try {
      await restoreMembers()
      setRestoreStatus('Guest list restored — everyone can pick their name again on join')
    } catch {
      setRestoreStatus('Could not restore — run migration 008_restore_members.sql in Supabase')
    }
    setTimeout(() => setRestoreStatus(null), 4000)
  }

  const handleSaveVenmo = async () => {
    setVenmoStatus(null)
    setVenmoSaving(true)
    try {
      const trimmed = venmoUsername.trim()
      await updateVenmoUsername(trimmed ? trimmed : null)
      setVenmoStatus('Venmo username saved')
    } catch {
      setVenmoStatus('Could not save — run migration 017_member_venmo.sql in Supabase')
    } finally {
      setVenmoSaving(false)
      setTimeout(() => setVenmoStatus(null), 3000)
    }
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
              style={{ background: 'rgba(0, 140, 255, 0.12)' }}
            >
              <VenmoIcon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Venmo username</p>
              <p className="text-[10px] text-[var(--palette-text-muted)]">
                Friends can pay you in one tap from Split
              </p>
            </div>
          </div>
          <input
            value={venmoUsername}
            onChange={(e) => setVenmoUsername(e.target.value)}
            placeholder="@your-username"
            className="mt-3 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button
            type="button"
            onClick={() => void handleSaveVenmo()}
            disabled={venmoSaving}
            className="btn-secondary mt-3 w-full text-sm disabled:opacity-50"
          >
            {venmoSaving ? 'Saving…' : 'Save Venmo username'}
          </button>
          {venmoStatus && (
            <p className="mt-2 text-center text-xs text-[var(--palette-accent)]">{venmoStatus}</p>
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

        {isOrganizer && !isDemo && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--palette-accent-light)', color: 'var(--palette-accent)' }}
              >
                <Users size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Restore guest list</p>
                <p className="text-[10px] text-[var(--palette-text-muted)]">
                  Bring back all 9 names if the join screen is empty
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleRestoreMembers()}
              className="btn-secondary mt-3 w-full text-sm"
            >
              Restore names
            </button>
            {restoreStatus && (
              <p className="mt-2 text-center text-xs text-[var(--palette-accent)]">{restoreStatus}</p>
            )}
          </div>
        )}

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
