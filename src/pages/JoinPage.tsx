import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { validateInvite, getAvailableMembers, joinTrip, isSupabaseConfigured } from '@/lib/api'
import { setSession, getSession } from '@/lib/storage'
import { DEMO_INVITE_CODE, DEMO_PIN } from '@/lib/demo-data'
import type { Trip, TripMember } from '@/types'

function joinErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message: string }).message)
    if (/anonymous|not authenticated|auth/i.test(msg)) {
      return 'Sign-in failed — in Supabase go to Authentication → Providers and enable Anonymous sign-ins, then refresh'
    }
    if (/already taken|unavailable/i.test(msg)) return msg
    if (/claim_trip_member|function/i.test(msg)) {
      return 'Database setup incomplete — run migration 006_claim_member.sql in Supabase SQL Editor'
    }
    if (/row-level security|permission denied|42501/i.test(msg)) {
      return 'Database permission issue — run migrations 004 and 006 in Supabase SQL Editor'
    }
    return msg
  }
  return 'Could not join — try again'
}

export default function JoinPage() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams()
  const existingSession = getSession()

  const [step, setStep] = useState<'code' | 'pin' | 'name'>('code')
  const [code, setCode] = useState(urlCode?.toUpperCase() ?? '')
  const [pin, setPin] = useState('')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [selectedName, setSelectedName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingSession) {
      navigate('/', { replace: true })
    }
  }, [existingSession, navigate])

  useEffect(() => {
    if (urlCode) setCode(urlCode.toUpperCase())
  }, [urlCode])

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await validateInvite(code)
      if (!result) {
        setError('Invalid invite code')
        return
      }
      setTrip(result)
      if (result.pin_hash) {
        setStep('pin')
      } else {
        const available = await getAvailableMembers(result.id)
        setMembers(available)
        setStep('name')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await validateInvite(code, pin)
      if (!result) {
        setError('Wrong PIN — try again')
        return
      }
      setTrip(result)
      const available = await getAvailableMembers(result.id)
      setMembers(available)
      setStep('name')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!trip || !selectedName) return
    setLoading(true)
    setError('')
    try {
      const existingMember = members.find((m) => m.display_name === selectedName)
      const member = await joinTrip(trip, selectedName, existingMember?.id)
      setSession({ tripId: trip.id, memberId: member.id, inviteCode: trip.invite_code })
      navigate('/', { replace: true })
    } catch (err) {
      setError(joinErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain"
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-sm flex-1 px-6 py-4"
      >
        <div className={`text-center ${step === 'name' ? 'mb-4' : 'mb-8'}`}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`mx-auto font-display ${step === 'name' ? 'mb-2 text-3xl' : 'mb-4 text-5xl'}`}
          >
            ✦
          </motion.div>
          <h1 className={`font-display font-bold text-[var(--palette-text)] ${step === 'name' ? 'text-2xl' : 'text-4xl'}`}>
            Chiara's Bachelorette
          </h1>
          {step !== 'name' && (
            <p className="mt-2 text-sm text-[var(--palette-text-muted)]">
              West Palm Beach · July 10–12, 2026
            </p>
          )}
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
            Demo mode — party code <strong>{DEMO_INVITE_CODE}</strong> / PIN <strong>{DEMO_PIN}</strong>
          </div>
        )}

        {step === 'code' && (
          <form onSubmit={(e) => void handleCodeSubmit(e)} className="space-y-4">
            <div className="glass-card p-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                Invite Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CHIARA710"
                className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-center font-display text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
                autoFocus
              />
            </div>
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading || code.length < 4} className="btn-primary w-full">
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={(e) => void handlePinSubmit(e)} className="space-y-4">
            <div className="glass-card p-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--palette-text-muted)]">
                Trip PIN
              </label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                type="password"
                inputMode="numeric"
                maxLength={8}
                className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-center font-display text-2xl tracking-widest outline-none focus:ring-2 focus:ring-[var(--palette-accent)]"
                autoFocus
              />
            </div>
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Enter'}
            </button>
            <button type="button" onClick={() => setStep('code')} className="btn-secondary w-full">
              Back
            </button>
          </form>
        )}

        {step === 'name' && (
          <div className="space-y-4 pb-4">
            <div className="glass-card p-5">
              <p className="mb-4 text-center text-sm font-medium text-[var(--palette-text-muted)]">
                Who's joining the party?
              </p>
              {members.length === 0 ? (
                <p className="text-center text-sm text-[var(--palette-text-muted)]">
                  No names on the guest list yet — ask Chiara to tap Settings → Restore names, or run{' '}
                  <code className="text-xs">008_restore_members.sql</code> in Supabase.
                </p>
              ) : (
              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedName(m.display_name)}
                    className={`rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
                      selectedName === m.display_name
                        ? 'border-[var(--palette-accent)] bg-white/80'
                        : 'border-white/40 bg-white/30'
                    }`}
                  >
                    <span
                      className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: m.avatar_color }}
                    >
                      {m.display_name[0]}
                    </span>
                    {m.display_name}
                    {m.role === 'organizer' && (
                      <span className="ml-1 text-[10px] font-normal text-[var(--palette-accent)]">✦ bride</span>
                    )}
                  </motion.button>
                ))}
              </div>
              )}
            </div>
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            <button
              onClick={() => void handleJoin()}
              disabled={loading || !selectedName}
              className="btn-primary w-full"
            >
              {loading ? 'Joining...' : "Let's go ✨"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}