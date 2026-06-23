import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  Announcement,
  AnnouncementType,
  AppSettings,
  CheckIn,
  CheckInStatus,
  Day,
  Event,
  Expense,
  FeedPost,
  PackingCategory,
  PackingItem,
  PackingVisibility,
  Trip,
  TripMember,
} from '@/types'
import { getSession, getSettings, saveSettings, setSession, clearSession } from '@/lib/storage'
import {
  fetchTripData,
  subscribeToTripChanges,
  upsertCheckIn,
  createAnnouncement,
  postFeedPhoto,
  updateEventTime,
  togglePackingItem,
  assignPackingItem,
  addPackingItem,
  deletePackingItem,
  reorderPackingItems,
  addExpense,
  clearAllExpenses,
  deleteExpense,
  restoreExpenses,
  updateMemberVenmo,
  createEvent,
  updateEvent,
  isSupabaseConfigured,
  restoreTripMembers,
  releaseTripMember,
  ensureMemberSession,
  toggleFeedPostLike,
  addFeedPostComment,
  deleteFeedPost,
} from '@/lib/api'
import { applyPalette, getPalette } from '@/theme/palettes'
import { prepareImageForUpload } from '@/lib/image-upload'

interface TripContextValue {
  loading: boolean
  trip: Trip | null
  member: TripMember | null
  members: TripMember[]
  days: Day[]
  events: Event[]
  checkIns: CheckIn[]
  announcements: Announcement[]
  feedPosts: FeedPost[]
  packingItems: PackingItem[]
  expenses: Expense[]
  settings: AppSettings
  activeDayId: string | null
  setActiveDayId: (id: string) => void
  isOrganizer: boolean
  isDemo: boolean
  refresh: () => Promise<void>
  checkIn: (eventId: string, status: CheckInStatus) => Promise<void>
  postAnnouncement: (message: string, type?: AnnouncementType, eventId?: string) => Promise<void>
  postPhoto: (file: File, caption: string) => Promise<void>
  likePost: (postId: string) => Promise<void>
  commentOnPost: (postId: string, body: string) => Promise<void>
  removePost: (postId: string) => Promise<void>
  moveEventTime: (eventId: string, startTime: string) => Promise<void>
  packItem: (itemId: string, packed: boolean) => Promise<void>
  assignItem: (itemId: string, memberId: string | null) => Promise<void>
  addItem: (label: string, category: PackingCategory, visibility: PackingVisibility) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  reorderItems: (itemIds: string[]) => Promise<void>
  addNewExpense: (label: string, amountCents: number, paidBy: string, splitAmong: string[]) => Promise<Expense | undefined>
  clearExpenses: () => Promise<void>
  restoreExpenses: (expenses: Expense[]) => Promise<void>
  deleteExpense: (expenseId: string) => Promise<void>
  addNewEvent: (dayId: string, event: Omit<Event, 'id' | 'day_id'>) => Promise<void>
  editEvent: (eventId: string, updates: Partial<Event>) => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => void
  updateVenmoUsername: (username: string | null) => Promise<void>
  logout: () => void
  restoreMembers: () => Promise<void>
  getEventCheckIns: (eventId: string) => CheckIn[]
  getMyCheckIn: (eventId: string) => CheckIn | undefined
  getDayEvents: (dayId: string) => Event[]
  getTodayDay: () => Day | undefined
  getNextEvent: () => Event | undefined
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const session = getSession()
  const [loading, setLoading] = useState(true)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [member, setMember] = useState<TripMember | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [days, setDays] = useState<Day[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [packingItems, setPackingItems] = useState<PackingItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settings, setSettingsState] = useState<AppSettings>(getSettings())
  const [activeDayId, setActiveDayId] = useState<string | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(async () => {
    if (!session?.tripId) {
      setLoading(false)
      return
    }
    try {
      let me: TripMember | null = null
      if (session.memberId && isSupabaseConfigured) {
        try {
          me = await ensureMemberSession(session.memberId)
        } catch {
          // Fall back to cached member; writes will re-sync or fail clearly.
        }
      }
      const data = await fetchTripData(session.tripId)
      setTrip(data.trip)
      setMembers(data.members)
      setDays(data.days)
      setEvents(data.events)
      setCheckIns(data.checkIns)
      setAnnouncements(data.announcements)
      setFeedPosts(data.feedPosts)
      setPackingItems(data.packingItems)
      setExpenses(data.expenses)
      if (!me) {
        me = data.members.find((m) => m.id === session.memberId) ?? null
      }
      setMember(me)
      if (!activeDayId && data.days.length > 0) {
        const today = data.days.find((d) => d.date === new Date().toISOString().split('T')[0])
        setActiveDayId(today?.id ?? data.days[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [session?.tripId, session?.memberId, activeDayId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!session?.tripId) return
    return subscribeToTripChanges(session.tripId, () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        void refresh()
      }, 300)
    })
  }, [session?.tripId, refresh])

  useEffect(() => {
    const day = days.find((d) => d.id === activeDayId)
    if (day) applyPalette(getPalette(day.palette_key))
    else applyPalette(getPalette('default'))
  }, [activeDayId, days])

  const isOrganizer = member?.role === 'organizer'

  const checkIn = useCallback(
    async (eventId: string, status: CheckInStatus) => {
      if (!member || !trip) return
      const event = events.find((e) => e.id === eventId)
      if (!event) return
      await upsertCheckIn(eventId, member.id, status, member.display_name, event.title, trip.id)
      await refresh()
    },
    [member, trip, events, refresh],
  )

  const postAnnouncement = useCallback(
    async (message: string, type: AnnouncementType = 'general', eventId?: string) => {
      if (!member || !trip) return
      await createAnnouncement(trip.id, message, type, member.id, eventId)
      await refresh()
    },
    [member, trip, refresh],
  )

  const postPhoto = useCallback(
    async (file: File, caption: string) => {
      if (!member || !trip) throw new Error('Not joined to the trip')
      const { blob, dataUrl } = await prepareImageForUpload(file)
      await postFeedPhoto(trip.id, member.id, blob, dataUrl, caption || null)
      await refresh()
    },
    [member, trip, refresh],
  )

  const likePost = useCallback(
    async (postId: string) => {
      if (!member) return
      await toggleFeedPostLike(postId, member.id)
      await refresh()
    },
    [member, refresh],
  )

  const commentOnPost = useCallback(
    async (postId: string, body: string) => {
      if (!member) return
      await addFeedPostComment(postId, member.id, body)
      await refresh()
    },
    [member, refresh],
  )

  const removePost = useCallback(
    async (postId: string) => {
      await deleteFeedPost(postId)
      await refresh()
    },
    [refresh],
  )

  const moveEventTime = useCallback(
    async (eventId: string, startTime: string) => {
      if (!member || !trip) return
      const event = events.find((e) => e.id === eventId)
      if (!event) return
      await updateEventTime(eventId, startTime, event.title, trip.id, member.id)
      await refresh()
    },
    [member, trip, events, refresh],
  )

  const packItem = useCallback(
    async (itemId: string, packed: boolean) => {
      if (!member) throw new Error('Not joined to the trip')
      const prev = packingItems
      setPackingItems((items) =>
        items.map((item) =>
          item.id === itemId
            ? { ...item, is_packed: packed, packed_by: packed ? member.id : null }
            : item,
        ),
      )
      try {
        await togglePackingItem(itemId, packed, packed ? member.id : null, member.id)
      } catch (err) {
        setPackingItems(prev)
        throw err
      }
    },
    [member, packingItems],
  )

  const assignItem = useCallback(
    async (itemId: string, memberId: string | null) => {
      if (!member) throw new Error('Not joined to the trip')
      const prev = packingItems
      setPackingItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, assigned_member_id: memberId } : item,
        ),
      )
      try {
        await assignPackingItem(itemId, memberId, member.id)
      } catch (err) {
        setPackingItems(prev)
        throw err
      }
    },
    [member, packingItems],
  )

  const addItem = useCallback(
    async (label: string, category: PackingCategory, visibility: PackingVisibility) => {
      if (!trip || !member) throw new Error('Not joined to the trip')
      const tempId = `temp-${Date.now()}`
      const nextOrder =
        packingItems
          .filter((p) => p.trip_id === trip.id && p.visibility === visibility)
          .reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1) + 1
      const optimistic: PackingItem = {
        id: tempId,
        trip_id: trip.id,
        label,
        category,
        visibility,
        sort_order: nextOrder,
        created_by_member_id: member.id,
        assigned_member_id: null,
        is_packed: false,
        packed_by: null,
        created_at: new Date().toISOString(),
      }
      const prev = packingItems
      setPackingItems((items) => [...items, optimistic])
      try {
        const created = await addPackingItem(trip.id, label, category, visibility, member.id)
        setPackingItems((items) => items.map((item) => (item.id === tempId ? created : item)))
      } catch (err) {
        setPackingItems(prev)
        throw err
      }
    },
    [trip, member, packingItems],
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!member) throw new Error('Not joined to the trip')
      const prev = packingItems
      setPackingItems((items) => items.filter((item) => item.id !== itemId))
      try {
        await deletePackingItem(itemId, member.id)
      } catch (err) {
        setPackingItems(prev)
        throw err
      }
    },
    [member, packingItems],
  )

  const reorderItems = useCallback(
    async (itemIds: string[]) => {
      if (!member) throw new Error('Not joined to the trip')
      await reorderPackingItems(itemIds, member.id)
      await refresh()
    },
    [member, refresh],
  )

  const addNewExpense = useCallback(
    async (label: string, amountCents: number, paidBy: string, splitAmong: string[]) => {
      if (!trip) return
      const expense = await addExpense(trip.id, label, amountCents, paidBy, splitAmong)
      await refresh()
      return expense
    },
    [trip, refresh],
  )

  const clearExpenses = useCallback(async () => {
    if (!trip) return
    await clearAllExpenses(trip.id)
    await refresh()
  }, [trip, refresh])

  const restoreExpensesList = useCallback(
    async (expenses: Expense[]) => {
      if (!trip) return
      await restoreExpenses(trip.id, expenses)
      await refresh()
    },
    [trip, refresh],
  )

  const removeExpense = useCallback(
    async (expenseId: string) => {
      await deleteExpense(expenseId)
      await refresh()
    },
    [refresh],
  )

  const addNewEvent = useCallback(
    async (dayId: string, event: Omit<Event, 'id' | 'day_id'>) => {
      await createEvent(dayId, event)
      await refresh()
    },
    [refresh],
  )

  const editEvent = useCallback(
    async (eventId: string, updates: Partial<Event>) => {
      await updateEvent(eventId, updates)
      await refresh()
    },
    [refresh],
  )

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates }
      saveSettings(next)
      return next
    })
  }, [])

  const updateVenmoUsername = useCallback(
    async (username: string | null) => {
      if (!member) return
      await updateMemberVenmo(member.id, username)
      await refresh()
    },
    [member, refresh],
  )

  const logout = useCallback(() => {
    const memberId = member?.id
    void (async () => {
      if (memberId) {
        try {
          await releaseTripMember(memberId)
        } catch {
          // still leave even if release fails
        }
      }
      clearSession()
      window.location.href = '/join'
    })()
  }, [member?.id])

  const restoreMembers = useCallback(async () => {
    if (!trip) return
    await restoreTripMembers(trip.id, member?.id)
    await refresh()
  }, [trip, member?.id, refresh])

  const getEventCheckIns = useCallback(
    (eventId: string) => checkIns.filter((c) => c.event_id === eventId),
    [checkIns],
  )

  const getMyCheckIn = useCallback(
    (eventId: string) => checkIns.find((c) => c.event_id === eventId && c.member_id === member?.id),
    [checkIns, member],
  )

  const getDayEvents = useCallback(
    (dayId: string) => events.filter((e) => e.day_id === dayId).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [events],
  )

  const getTodayDay = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return days.find((d) => d.date === today)
  }, [days])

  const getNextEvent = useCallback(() => {
    const today = getTodayDay()
    if (!today) return undefined
    const now = new Date()
    const todayEvents = getDayEvents(today.id)
    return todayEvents.find((e) => {
      const [h, m] = e.start_time.split(':').map(Number)
      const eventTime = new Date()
      eventTime.setHours(h, m, 0, 0)
      return eventTime > now
    })
  }, [getTodayDay, getDayEvents])

  const value = useMemo(
    () => ({
      loading,
      trip,
      member,
      members,
      days,
      events,
      checkIns,
      announcements,
      feedPosts,
      packingItems,
      expenses,
      settings,
      activeDayId,
      setActiveDayId,
      isOrganizer,
      isDemo: !isSupabaseConfigured,
      refresh,
      checkIn,
      postAnnouncement,
      postPhoto,
      likePost,
      commentOnPost,
      removePost,
      moveEventTime,
      packItem,
      assignItem,
      addItem,
      removeItem,
      reorderItems,
      addNewExpense,
      clearExpenses,
      restoreExpenses: restoreExpensesList,
      deleteExpense: removeExpense,
      addNewEvent,
      editEvent,
      updateSettings,
      updateVenmoUsername,
      logout,
      restoreMembers,
      getEventCheckIns,
      getMyCheckIn,
      getDayEvents,
      getTodayDay,
      getNextEvent,
    }),
    [
      loading, trip, member, members, days, events, checkIns, announcements, feedPosts,
      packingItems, expenses, settings, activeDayId, isOrganizer,
      refresh, checkIn, postAnnouncement, postPhoto, likePost, commentOnPost, removePost, moveEventTime, packItem, assignItem,
      addItem, removeItem, reorderItems, addNewExpense, clearExpenses, restoreExpensesList, removeExpense, addNewEvent, editEvent, updateSettings, updateVenmoUsername, logout, restoreMembers,
      getEventCheckIns, getMyCheckIn, getDayEvents, getTodayDay, getNextEvent,
    ],
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within TripProvider')
  return ctx
}

export function useJoinSession(tripId: string, memberId: string, inviteCode: string) {
  setSession({ tripId, memberId, inviteCode })
}
