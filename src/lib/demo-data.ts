import type {

  Announcement,

  CheckIn,

  Day,

  Event,

  Expense,

  FeedPost,

  PackingItem,

  Trip,

  TripMember,

} from '@/types'



export const DEMO_INVITE_CODE = 'CHIARA710'

export const DEMO_PIN = '2626'

export const TEST_INVITE_CODE = 'APPSTEST'

export const TEST_PIN = '1234'

export const DEMO_STATE_KEY = 'chiara_bach_demo_state_v3'



export const demoTrip: Trip = {

  id: 'demo-trip-1',

  name: "Chiara's Bachelorette",

  start_date: '2026-07-10',

  end_date: '2026-07-12',

  invite_code: DEMO_INVITE_CODE,

  pin_hash: DEMO_PIN,

  default_theme: 'prosecco_pink',

  created_at: new Date().toISOString(),

}



export const demoMembers: TripMember[] = [

  { id: 'm1', trip_id: demoTrip.id, auth_uid: '', display_name: 'Chiara', role: 'organizer', avatar_color: '#E8A0BF', created_at: new Date().toISOString() },

  { id: 'm2', trip_id: demoTrip.id, auth_uid: '', display_name: 'Saoirse', role: 'guest', avatar_color: '#3BA4BC', created_at: new Date().toISOString() },

  { id: 'm3', trip_id: demoTrip.id, auth_uid: '', display_name: 'Lauren', role: 'guest', avatar_color: '#D4AF37', created_at: new Date().toISOString() },

  { id: 'm4', trip_id: demoTrip.id, auth_uid: '', display_name: 'Vivian', role: 'guest', avatar_color: '#6B5B95', created_at: new Date().toISOString() },

  { id: 'm5', trip_id: demoTrip.id, auth_uid: '', display_name: 'Victoria', role: 'guest', avatar_color: '#E8652B', created_at: new Date().toISOString() },

  { id: 'm6', trip_id: demoTrip.id, auth_uid: '', display_name: 'Hannah', role: 'guest', avatar_color: '#7B9ACC', created_at: new Date().toISOString() },

  { id: 'm7', trip_id: demoTrip.id, auth_uid: '', display_name: 'Abby', role: 'guest', avatar_color: '#C9956B', created_at: new Date().toISOString() },

  { id: 'm8', trip_id: demoTrip.id, auth_uid: '', display_name: 'Makayla', role: 'guest', avatar_color: '#F5C6D0', created_at: new Date().toISOString() },

  { id: 'm9', trip_id: demoTrip.id, auth_uid: '', display_name: 'Liz', role: 'guest', avatar_color: '#A8E0EE', created_at: new Date().toISOString() },

  { id: 'm10', trip_id: demoTrip.id, auth_uid: '', display_name: 'Apps Test', role: 'guest', avatar_color: '#9CAF88', created_at: new Date().toISOString() },

]



export const demoDays: Day[] = [

  { id: 'd1', trip_id: demoTrip.id, date: '2026-07-10', label: 'Friday', palette_key: 'prosecco_pink', sort_order: 0 },

  { id: 'd2', trip_id: demoTrip.id, date: '2026-07-11', label: 'Saturday', palette_key: 'mamma_mia_blue', sort_order: 1 },

  { id: 'd3', trip_id: demoTrip.id, date: '2026-07-12', label: 'Sunday', palette_key: 'aperol_sunset', sort_order: 2 },

]



export const demoEvents: Event[] = [

  { id: 'e1', day_id: 'd1', title: 'Airbnb Check-in', event_type: 'other', start_time: '11:00', end_time: '12:00', location: '433 46th St, West Palm Beach, FL', notes: 'Drop bags, pool-ready', sort_order: 0 },

  { id: 'e2', day_id: 'd1', title: 'Pool Day', event_type: 'other', start_time: '12:00', end_time: '18:00', location: 'Airbnb pool', notes: 'Swim / cover-ups — chill vibes', sort_order: 1 },

  { id: 'e3', day_id: 'd1', title: "PJ's & Prosecco Night", event_type: 'dinner', start_time: '19:00', end_time: '22:00', location: '433 46th St, West Palm Beach, FL', notes: 'Any shade of pink pajamas — champagne & prosecco', sort_order: 2 },

  { id: 'e4', day_id: 'd2', title: 'Super Trouper Sculpt', event_type: 'pilates', start_time: '08:00', end_time: '09:00', location: 'TBD — West Palm Beach', notes: 'Any shade of blue workout set', sort_order: 0 },

  { id: 'e5', day_id: 'd2', title: 'Boat Rental', event_type: 'boat', start_time: '10:00', end_time: '15:00', location: 'TBD — West Palm Beach Marina', notes: 'Blue bikini + linen coverup (Santorini / Mamma Mia)', sort_order: 1 },

  { id: 'e6', day_id: 'd2', title: 'Happy Hour & Appetizers', event_type: 'dinner', start_time: '16:00', end_time: '18:00', location: 'TBD — Downtown WPB', notes: 'Casual chic — blue tones', sort_order: 2 },

  { id: 'e7', day_id: 'd2', title: 'Dinner Downtown', event_type: 'dinner', start_time: '21:00', end_time: '22:30', location: 'TBD — Downtown WPB', notes: 'Any shade of blue dress', sort_order: 3 },

  { id: 'e8', day_id: 'd2', title: 'Bar Hopping', event_type: 'club', start_time: '22:30', end_time: '01:00', location: 'Clematis Street / Downtown WPB', notes: 'Blue dress', sort_order: 4 },

  { id: 'e9', day_id: 'd3', title: 'Brunch', event_type: 'brunch', start_time: '11:00', end_time: '12:30', location: 'TBD — West Palm Beach', notes: 'Sunset satin — pinks, yellows, oranges', sort_order: 0 },

  { id: 'e10', day_id: 'd3', title: 'Shopping & Strolling', event_type: 'other', start_time: '12:30', end_time: '16:00', location: 'Worth Ave / CityPlace area', notes: 'Aperol spritz & sunshine bombshell', sort_order: 1 },

]



export const demoAnnouncements: Announcement[] = []



export const demoPackingItems: PackingItem[] = [

  { id: 'p1', trip_id: demoTrip.id, label: 'Pink pajamas — any shade (Friday)', category: 'outfits', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p2', trip_id: demoTrip.id, label: 'Blue workout set (Saturday pilates)', category: 'outfits', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p3', trip_id: demoTrip.id, label: 'Blue bikini + linen coverup (boat day)', category: 'outfits', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p4', trip_id: demoTrip.id, label: 'Blue dress (Saturday night)', category: 'outfits', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p5', trip_id: demoTrip.id, label: 'Sunset satin dress — pink, yellow, or orange (Sunday)', category: 'outfits', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p6', trip_id: demoTrip.id, label: 'Sunscreen SPF 50', category: 'toiletries', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p7', trip_id: demoTrip.id, label: 'Portable speaker', category: 'shared_gear', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p8', trip_id: demoTrip.id, label: 'Polaroid camera + film', category: 'shared_gear', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p9', trip_id: demoTrip.id, label: 'Prosecco / champagne (shared)', category: 'shared_gear', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p10', trip_id: demoTrip.id, label: 'Phone charger / power bank', category: 'misc', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

  { id: 'p11', trip_id: demoTrip.id, label: 'Hangover kit (electrolytes, ibuprofen)', category: 'misc', assigned_member_id: null, is_packed: false, packed_by: null, created_at: new Date().toISOString() },

]



export const demoExpenses: Expense[] = []



export function getDemoState() {

  const stored = localStorage.getItem(DEMO_STATE_KEY)

  if (stored) {

    try {

      const parsed = JSON.parse(stored) as {

        checkIns: CheckIn[]

        announcements: Announcement[]

        packingItems: PackingItem[]

        expenses: Expense[]

        events: Event[]

        feedPosts?: FeedPost[]

      }

      return {

        ...parsed,

        feedPosts: parsed.feedPosts ?? [],

        expenses: parsed.expenses ?? [],

      }

    } catch {

      // fall through

    }

  }

  return {

    checkIns: [] as CheckIn[],

    announcements: [...demoAnnouncements],

    packingItems: [...demoPackingItems],

    expenses: [] as Expense[],

    events: [...demoEvents],

    feedPosts: [] as FeedPost[],

  }

}



export function saveDemoState(state: ReturnType<typeof getDemoState>) {

  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state))

}

