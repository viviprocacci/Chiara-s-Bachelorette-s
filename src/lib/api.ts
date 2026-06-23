import { getSupabase, ensureAnonymousAuth, isSupabaseConfigured } from '@/lib/supabase'
import { PUSH_SUB_KEY, getSession } from '@/lib/storage'
import {
  demoTrip,
  demoMembers,
  demoDays,
  getDemoState,
  saveDemoState,
  DEMO_INVITE_CODE,
  DEMO_PIN,
  DEMO_STATE_KEY,
} from '@/lib/demo-data'
import { AVATAR_COLORS } from '@/theme/palettes'
import type {
  Announcement,
  AnnouncementType,
  CheckIn,
  CheckInStatus,
  Day,
  Event,
  EventType,
  Expense,
  FeedPost,
  FeedPostComment,
  PackingCategory,
  PackingItem,
  SplitType,
  Trip,
  TripMember,
} from '@/types'

export { isSupabaseConfigured }

function enrichFeedPosts(
  posts: FeedPost[],
  likes: { post_id: string; member_id: string }[],
  comments: FeedPostComment[],
  currentMemberId?: string,
): FeedPost[] {
  return posts.map((post) => {
    const postLikes = likes.filter((l) => l.post_id === post.id)
    const postComments = comments
      .filter((c) => c.post_id === post.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({
        ...c,
        author: c.author ?? demoMembers.find((m) => m.id === c.member_id),
      }))
    return {
      ...post,
      like_count: postLikes.length,
      liked_by_me: currentMemberId ? postLikes.some((l) => l.member_id === currentMemberId) : false,
      comments: postComments,
    }
  })
}

async function loadFeedPostsForTrip(tripId: string, currentMemberId?: string): Promise<FeedPost[]> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const posts = state.feedPosts.map((p) => ({
      ...p,
      poster: demoMembers.find((m) => m.id === p.posted_by),
    }))
    return enrichFeedPosts(posts, state.feedPostLikes ?? [], state.feedPostComments ?? [], currentMemberId)
  }

  const supabase = getSupabase()
  const { data: postsRes } = await supabase
    .from('feed_posts')
    .select('*, poster:trip_members(*)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  const posts = (postsRes ?? []) as FeedPost[]
  const postIds = posts.map((p) => p.id)
  if (postIds.length === 0) return []

  const [likesRes, commentsRes] = await Promise.all([
    supabase.from('feed_post_likes').select('post_id, member_id').in('post_id', postIds),
    supabase
      .from('feed_post_comments')
      .select('*, author:trip_members(*)')
      .in('post_id', postIds)
      .order('created_at', { ascending: true }),
  ])

  return enrichFeedPosts(
    posts,
    (likesRes.data ?? []) as { post_id: string; member_id: string }[],
    (commentsRes.data ?? []) as FeedPostComment[],
    currentMemberId,
  )
}

function sortMembersForJoin(members: TripMember[]): TripMember[] {
  return [...members].sort((a, b) => {
    if (a.role === 'organizer' && b.role !== 'organizer') return -1
    if (b.role === 'organizer' && a.role !== 'organizer') return 1
    return a.display_name.localeCompare(b.display_name)
  })
}

export async function validateInvite(code: string, pin?: string): Promise<Trip | null> {
  const normalizedCode = code.trim().toUpperCase()

  if (!isSupabaseConfigured) {
    if (normalizedCode === DEMO_INVITE_CODE && (!pin || pin === DEMO_PIN)) {
      return demoTrip
    }
    return null
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('invite_code', normalizedCode)
    .single()

  if (error || !data) return null

  if (pin != null && pin !== '' && data.pin_hash && data.pin_hash !== pin.trim()) {
    return null
  }

  return data as Trip
}

export async function getAvailableMembers(tripId: string): Promise<TripMember[]> {
  if (!isSupabaseConfigured) {
    return sortMembersForJoin(demoMembers)
  }

  const supabase = getSupabase()
  const { data } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId)

  return sortMembersForJoin((data ?? []) as TripMember[])
}

export async function restoreTripMembers(tripId: string, preserveMemberId?: string): Promise<void> {
  if (!isSupabaseConfigured) return

  await ensureAnonymousAuth()
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { error: rpcError } = await supabase.rpc('restore_trip_members', {
    p_trip_id: tripId,
    p_preserve_member_id: preserveMemberId ?? null,
  })
  if (!rpcError) return
  if (!/function|42883|schema cache/i.test(rpcError.message)) throw rpcError

  for (const m of demoMembers) {
    const { error } = await supabase.from('trip_members').upsert(
      {
        trip_id: tripId,
        display_name: m.display_name,
        role: m.role,
        avatar_color: m.avatar_color,
        auth_uid: null,
      },
      { onConflict: 'trip_id,display_name' },
    )
    if (error) throw error
  }

  if (preserveMemberId && user) {
    const { error } = await supabase
      .from('trip_members')
      .update({ auth_uid: user.id })
      .eq('id', preserveMemberId)
    if (error) throw error
  }
}

export async function joinTrip(
  trip: Trip,
  displayName: string,
  existingMemberId?: string,
): Promise<TripMember> {
  if (!isSupabaseConfigured) {
    const member = demoMembers.find((m) => m.display_name === displayName)
    if (!member) throw new Error('Member not found')
    const joined = { ...member, auth_uid: 'demo-user' }
    return joined
  }

  await ensureAnonymousAuth()
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated — enable Anonymous sign-ins in Supabase Auth')

  if (existingMemberId) {
    const { data, error } = await supabase.rpc('claim_trip_member', {
      p_member_id: existingMemberId,
    })
    if (error) throw error
    if (!data) throw new Error('Could not claim that name — try another')
    return data as TripMember
  }

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  const { data, error } = await supabase
    .from('trip_members')
    .insert({
      trip_id: trip.id,
      auth_uid: user.id,
      display_name: displayName,
      role: 'guest',
      avatar_color: color,
    })
    .select()
    .single()

  if (error) throw error
  return data as TripMember
}

export async function releaseTripMember(memberId: string): Promise<void> {
  if (!isSupabaseConfigured) return

  await ensureAnonymousAuth()
  const supabase = getSupabase()
  const { error } = await supabase.rpc('release_trip_member', { p_member_id: memberId })
  if (error) throw error
}

export async function fetchTripData(tripId: string) {
  const memberId = getSession()?.memberId

  if (!isSupabaseConfigured) {
    const state = getDemoState()
    return {
      trip: demoTrip,
      members: demoMembers,
      days: demoDays,
      events: state.events,
      checkIns: state.checkIns,
      announcements: state.announcements,
      packingItems: state.packingItems,
      expenses: state.expenses ?? [],
      feedPosts: await loadFeedPostsForTrip(tripId, memberId),
    }
  }

  const supabase = getSupabase()
  const [tripRes, membersRes, daysRes, announcementsRes, packingRes, expensesRes, feedPosts] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('trip_members').select('*').eq('trip_id', tripId),
    supabase.from('days').select('*').eq('trip_id', tripId).order('sort_order'),
    supabase.from('announcements').select('*, creator:trip_members(*)').eq('trip_id', tripId).order('created_at', { ascending: false }),
    supabase.from('packing_items').select('*, assignee:trip_members(*)').eq('trip_id', tripId).order('created_at'),
    supabase.from('expenses').select('*, payer:trip_members(*), splits:expense_splits(*, member:trip_members(*))').eq('trip_id', tripId).order('created_at', { ascending: false }),
    loadFeedPostsForTrip(tripId, memberId),
  ])

  const days = (daysRes.data ?? []) as Day[]
  const dayIds = days.map((d) => d.id)

  let events: Event[] = []
  if (dayIds.length > 0) {
    const { data } = await supabase.from('events').select('*').in('day_id', dayIds).order('sort_order')
    events = (data ?? []) as Event[]
  }

  const eventIds = events.map((e) => e.id)
  let checkIns: CheckIn[] = []
  if (eventIds.length > 0) {
    const { data } = await supabase.from('check_ins').select('*, member:trip_members(*)').in('event_id', eventIds)
    checkIns = (data ?? []) as CheckIn[]
  }

  return {
    trip: tripRes.data as Trip,
    members: (membersRes.data ?? []) as TripMember[],
    days,
    events,
    checkIns,
    announcements: (announcementsRes.data ?? []) as Announcement[],
    packingItems: (packingRes.data ?? []) as PackingItem[],
    expenses: (expensesRes.data ?? []) as Expense[],
    feedPosts,
  }
}

export async function upsertCheckIn(
  eventId: string,
  memberId: string,
  status: CheckInStatus,
  memberName: string,
  eventTitle: string,
  tripId: string,
): Promise<CheckIn> {
  const now = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const existing = state.checkIns.findIndex((c) => c.event_id === eventId && c.member_id === memberId)
    const checkIn: CheckIn = {
      id: existing >= 0 ? state.checkIns[existing].id : `ci-${Date.now()}`,
      event_id: eventId,
      member_id: memberId,
      status,
      checked_at: now,
      member: demoMembers.find((m) => m.id === memberId),
    }
    if (existing >= 0) state.checkIns[existing] = checkIn
    else state.checkIns.push(checkIn)

    if (status === 'in') {
      state.announcements.unshift({
        id: `a-${Date.now()}`,
        trip_id: tripId,
        message: `${memberName} arrived at ${eventTitle}`,
        announcement_type: 'arrival',
        event_id: eventId,
        created_by: memberId,
        created_at: now,
      })
    }
    saveDemoState(state)
    return checkIn
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('check_ins')
    .upsert({ event_id: eventId, member_id: memberId, status, checked_at: now }, { onConflict: 'event_id,member_id' })
    .select('*, member:trip_members(*)')
    .single()

  if (error) throw error

  if (status === 'in') {
    await supabase.from('announcements').insert({
      trip_id: tripId,
      message: `${memberName} arrived at ${eventTitle}`,
      announcement_type: 'arrival',
      event_id: eventId,
      created_by: memberId,
    })
  }

  return data as CheckIn
}

export async function createAnnouncement(
  tripId: string,
  message: string,
  type: AnnouncementType,
  createdBy: string,
  eventId?: string,
): Promise<Announcement> {
  const now = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const announcement: Announcement = {
      id: `a-${Date.now()}`,
      trip_id: tripId,
      message,
      announcement_type: type,
      event_id: eventId ?? null,
      created_by: createdBy,
      created_at: now,
    }
    state.announcements.unshift(announcement)
    saveDemoState(state)
    return announcement
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('announcements')
    .insert({ trip_id: tripId, message, announcement_type: type, created_by: createdBy, event_id: eventId ?? null })
    .select('*, creator:trip_members(*)')
    .single()

  if (error) throw error
  return data as Announcement
}

export async function createFeedPost(
  tripId: string,
  imageUrl: string,
  caption: string | null,
  postedBy: string,
): Promise<FeedPost> {
  const now = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const post: FeedPost = {
      id: `fp-${Date.now()}`,
      trip_id: tripId,
      image_url: imageUrl,
      caption,
      posted_by: postedBy,
      created_at: now,
      poster: demoMembers.find((m) => m.id === postedBy),
    }
    state.feedPosts.unshift(post)
    saveDemoState(state)
    return post
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('feed_posts')
    .insert({ trip_id: tripId, image_url: imageUrl, caption, posted_by: postedBy })
    .select('*, poster:trip_members(*)')
    .single()

  if (error) throw error
  return data as FeedPost
}

export async function uploadFeedPhoto(tripId: string, blob: Blob, postId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Use data URL in demo mode')
  }

  const supabase = getSupabase()
  const path = `${tripId}/${postId}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('trip-photos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('trip-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function postFeedPhoto(
  tripId: string,
  postedBy: string,
  imageBlob: Blob,
  dataUrl: string,
  caption: string | null,
): Promise<FeedPost> {
  if (!isSupabaseConfigured) {
    return createFeedPost(tripId, dataUrl, caption?.trim() || null, postedBy)
  }

  const postId = crypto.randomUUID()
  const imageUrl = await uploadFeedPhoto(tripId, imageBlob, postId)
  return createFeedPost(tripId, imageUrl, caption?.trim() || null, postedBy)
}

export async function toggleFeedPostLike(postId: string, memberId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const idx = state.feedPostLikes.findIndex((l) => l.post_id === postId && l.member_id === memberId)
    if (idx >= 0) state.feedPostLikes.splice(idx, 1)
    else state.feedPostLikes.push({ post_id: postId, member_id: memberId })
    saveDemoState(state)
    return
  }

  await ensureAnonymousAuth()
  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from('feed_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('member_id', memberId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('feed_post_likes').delete().eq('post_id', postId).eq('member_id', memberId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('feed_post_likes').insert({ post_id: postId, member_id: memberId })
    if (error) throw error
  }
}

export async function addFeedPostComment(postId: string, memberId: string, body: string): Promise<void> {
  const trimmed = body.trim()
  if (!trimmed) return

  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.feedPostComments.push({
      id: `fc-${Date.now()}`,
      post_id: postId,
      member_id: memberId,
      body: trimmed,
      created_at: new Date().toISOString(),
      author: demoMembers.find((m) => m.id === memberId),
    })
    saveDemoState(state)
    return
  }

  await ensureAnonymousAuth()
  const supabase = getSupabase()
  const { error } = await supabase.from('feed_post_comments').insert({
    post_id: postId,
    member_id: memberId,
    body: trimmed,
  })
  if (error) throw error
}

export async function deleteFeedPost(postId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.feedPosts = state.feedPosts.filter((p) => p.id !== postId)
    state.feedPostLikes = state.feedPostLikes.filter((l) => l.post_id !== postId)
    state.feedPostComments = state.feedPostComments.filter((c) => c.post_id !== postId)
    saveDemoState(state)
    return
  }

  await ensureAnonymousAuth()
  const supabase = getSupabase()
  const { error } = await supabase.from('feed_posts').delete().eq('id', postId)
  if (error) throw error
}

export async function updateEventTime(
  eventId: string,
  startTime: string,
  eventTitle: string,
  tripId: string,
  memberId: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const event = state.events.find((e) => e.id === eventId)
    if (event) {
      event.start_time = startTime
      const [h, m] = startTime.split(':')
      const hour = parseInt(h) % 12 || 12
      const period = parseInt(h) >= 12 ? 'PM' : 'AM'
      state.announcements.unshift({
        id: `a-${Date.now()}`,
        trip_id: tripId,
        message: `${eventTitle} moved to ${hour}:${m} ${period}`,
        announcement_type: 'schedule_change',
        event_id: eventId,
        created_by: memberId,
        created_at: new Date().toISOString(),
      })
      saveDemoState(state)
    }
    return
  }

  const supabase = getSupabase()
  await supabase.from('events').update({ start_time: startTime }).eq('id', eventId)

  const [h, m] = startTime.split(':')
  const hour = parseInt(h) % 12 || 12
  const period = parseInt(h) >= 12 ? 'PM' : 'AM'
  await supabase.from('announcements').insert({
    trip_id: tripId,
    message: `${eventTitle} moved to ${hour}:${m} ${period}`,
    announcement_type: 'schedule_change',
    event_id: eventId,
    created_by: memberId,
  })
}

export async function togglePackingItem(
  itemId: string,
  isPacked: boolean,
  packedBy: string | null,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const item = state.packingItems.find((p) => p.id === itemId)
    if (item) {
      item.is_packed = isPacked
      item.packed_by = packedBy
      saveDemoState(state)
    }
    return
  }

  const supabase = getSupabase()
  await supabase.from('packing_items').update({ is_packed: isPacked, packed_by: packedBy }).eq('id', itemId)
}

export async function assignPackingItem(itemId: string, memberId: string | null): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const item = state.packingItems.find((p) => p.id === itemId)
    if (item) {
      item.assigned_member_id = memberId
      saveDemoState(state)
    }
    return
  }

  const supabase = getSupabase()
  await supabase.from('packing_items').update({ assigned_member_id: memberId }).eq('id', itemId)
}

export async function addPackingItem(
  tripId: string,
  label: string,
  category: PackingCategory,
): Promise<PackingItem> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const item: PackingItem = {
      id: `p-${Date.now()}`,
      trip_id: tripId,
      label,
      category,
      assigned_member_id: null,
      is_packed: false,
      packed_by: null,
      created_at: new Date().toISOString(),
    }
    state.packingItems.push(item)
    saveDemoState(state)
    return item
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('packing_items')
    .insert({ trip_id: tripId, label, category })
    .select()
    .single()
  if (error) throw error
  return data as PackingItem
}

export async function addExpense(
  tripId: string,
  label: string,
  amountCents: number,
  paidByMemberId: string,
  splitMemberIds: string[],
  splitType: SplitType = 'equal',
): Promise<Expense> {
  const shareCents = Math.round(amountCents / splitMemberIds.length)

  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const expense: Expense = {
      id: `x-${Date.now()}`,
      trip_id: tripId,
      label,
      amount_cents: amountCents,
      paid_by_member_id: paidByMemberId,
      split_type: splitType,
      created_at: new Date().toISOString(),
      splits: splitMemberIds.map((memberId) => ({
        id: `xs-${Date.now()}-${memberId}`,
        expense_id: `x-${Date.now()}`,
        member_id: memberId,
        share_cents: shareCents,
      })),
    }
    state.expenses.unshift(expense)
    saveDemoState(state)
    return expense
  }

  const supabase = getSupabase()
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({ trip_id: tripId, label, amount_cents: amountCents, paid_by_member_id: paidByMemberId, split_type: splitType })
    .select()
    .single()
  if (error) throw error

  const splits = splitMemberIds.map((memberId) => ({
    expense_id: expense.id,
    member_id: memberId,
    share_cents: shareCents,
  }))
  await supabase.from('expense_splits').insert(splits)

  return { ...expense, splits } as Expense
}

export async function deleteExpense(expenseId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.expenses = state.expenses.filter((e) => e.id !== expenseId)
    saveDemoState(state)
    return
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) throw error
}

export async function restoreExpenses(tripId: string, expenses: Expense[]): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.expenses = expenses
    saveDemoState(state)
    return
  }

  const supabase = getSupabase()
  for (const exp of expenses) {
    const { error: expenseError } = await supabase.from('expenses').insert({
      id: exp.id,
      trip_id: tripId,
      label: exp.label,
      amount_cents: exp.amount_cents,
      paid_by_member_id: exp.paid_by_member_id,
      split_type: exp.split_type,
      created_at: exp.created_at,
    })
    if (expenseError) throw expenseError

    if (exp.splits?.length) {
      const { error: splitsError } = await supabase.from('expense_splits').insert(
        exp.splits.map((s) => ({
          id: s.id,
          expense_id: exp.id,
          member_id: s.member_id,
          share_cents: s.share_cents,
        })),
      )
      if (splitsError) throw splitsError
    }
  }
}

export async function clearAllExpenses(tripId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    state.expenses = []
    saveDemoState(state)
    return
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('expenses').delete().eq('trip_id', tripId)
  if (error) throw error
}

export async function createEvent(
  dayId: string,
  event: Omit<Event, 'id' | 'day_id'>,
): Promise<Event> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const newEvent: Event = { ...event, id: `e-${Date.now()}`, day_id: dayId }
    state.events.push(newEvent)
    saveDemoState(state)
    return newEvent
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('events')
    .insert({ ...event, day_id: dayId })
    .select()
    .single()
  if (error) throw error
  return data as Event
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  if (!isSupabaseConfigured) {
    const state = getDemoState()
    const idx = state.events.findIndex((e) => e.id === eventId)
    if (idx >= 0) {
      state.events[idx] = { ...state.events[idx], ...updates }
      saveDemoState(state)
    }
    return
  }

  const supabase = getSupabase()
  await supabase.from('events').update(updates).eq('id', eventId)
}

export function subscribeToTripChanges(tripId: string, onChange: () => void) {
  if (!isSupabaseConfigured) {
    const handler = (e: StorageEvent) => {
      if (e.key === DEMO_STATE_KEY) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }

  const supabase = getSupabase()
  const channel = supabase
    .channel(`trip-${tripId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements', filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts', filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_post_likes' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_post_comments' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'packing_items', filter: `trip_id=eq.${tripId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function requestPushNotifications(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
      ) as BufferSource,
    })
    localStorage.setItem(PUSH_SUB_KEY, JSON.stringify(sub))
    return true
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String) return new Uint8Array()
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type { EventType }
