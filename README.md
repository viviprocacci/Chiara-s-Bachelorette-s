# Chiara's Bachelorette PWA

A mobile-first Progressive Web App for coordinating Chiara's bachelorette weekend in Santorini (July 10–13, 2026).

## Features

- **Day-by-day schedule** with per-day Santorini color palettes
- **RSVP check-ins** — I'm in / Running late / Skipping with confetti, sparkles, haptics & sounds
- **Chaos Mode** — amplified celebrations for boat day & club night
- **Live updates feed** with schedule-change announcements & arrival pings
- **Shared packing list** with self-assign and pack animations
- **Cost splitting** with auto-calculated balances
- **PWA** — installable, offline schedule cache, push notification hooks

## Quick start (demo mode)

Works out of the box without Supabase:

```bash
npm install
npm run dev
```

Open the app and join with:
- **Invite code:** `CHIARA710`
- **PIN:** `2626`
- Pick your name from the guest list

## Production setup (Supabase)

1. Create a [Supabase](https://supabase.com) project
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL editor
3. Enable anonymous auth in Supabase Dashboard → Authentication → Providers
4. Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

5. Deploy edge functions (optional):

```bash
supabase functions deploy validate-invite
supabase functions deploy send-push
```

## Deploy to Vercel

```bash
npm run build
```

Connect the repo to Vercel and add the environment variables above.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (Postgres, Realtime, Edge Functions)
- vite-plugin-pwa (Workbox)
