export type MemberRole = 'organizer' | 'guest'
export type CheckInStatus = 'in' | 'late' | 'skip'
export type EventType = 'brunch' | 'boat' | 'dinner' | 'club' | 'spa' | 'pilates' | 'other'
export type AnnouncementType = 'schedule_change' | 'arrival' | 'general'
export type SplitType = 'equal' | 'custom'
export type PackingCategory = 'outfits' | 'toiletries' | 'shared_gear' | 'misc'

export interface Trip {
  id: string
  name: string
  start_date: string
  end_date: string
  invite_code: string
  pin_hash: string | null
  default_theme: string
  created_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  auth_uid: string
  display_name: string
  role: MemberRole
  avatar_color: string
  created_at: string
}

export interface Day {
  id: string
  trip_id: string
  date: string
  label: string
  palette_key: string
  sort_order: number
}

export interface Event {
  id: string
  day_id: string
  title: string
  event_type: EventType
  start_time: string
  end_time: string | null
  location: string | null
  notes: string | null
  sort_order: number
  day?: Day
}

export interface CheckIn {
  id: string
  event_id: string
  member_id: string
  status: CheckInStatus
  checked_at: string
  member?: TripMember
}

export interface Announcement {
  id: string
  trip_id: string
  message: string
  announcement_type: AnnouncementType
  event_id: string | null
  created_by: string | null
  created_at: string
  creator?: TripMember
}

export interface FeedPost {
  id: string
  trip_id: string
  image_url: string
  caption: string | null
  posted_by: string
  created_at: string
  poster?: TripMember
}

export interface PackingItem {
  id: string
  trip_id: string
  label: string
  category: PackingCategory
  assigned_member_id: string | null
  is_packed: boolean
  packed_by: string | null
  created_at: string
  assignee?: TripMember
}

export interface Expense {
  id: string
  trip_id: string
  label: string
  amount_cents: number
  paid_by_member_id: string
  split_type: SplitType
  created_at: string
  payer?: TripMember
  splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  member_id: string
  share_cents: number
  member?: TripMember
}

export interface AppSettings {
  hapticsEnabled: boolean
  soundEnabled: boolean
  chaosMode: boolean
  notificationsEnabled: boolean
}

export interface SessionState {
  tripId: string
  memberId: string
  inviteCode: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  hapticsEnabled: true,
  soundEnabled: true,
  chaosMode: false,
  notificationsEnabled: false,
}

export const CHECK_IN_LABELS: Record<CheckInStatus, string> = {
  in: "I'm in",
  late: 'Running late',
  skip: 'Skipping',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  brunch: 'Brunch',
  boat: 'Boat Day',
  dinner: 'Dinner',
  club: 'Club',
  spa: 'Spa',
  pilates: 'Pilates',
  other: 'Event',
}

export const PACKING_CATEGORY_LABELS: Record<PackingCategory, string> = {
  outfits: 'Outfits',
  toiletries: 'Toiletries',
  shared_gear: 'Shared Gear',
  misc: 'Misc',
}
