-- Chiara's Bachelorette — initial schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  pin_hash TEXT,
  default_theme TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip members
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  auth_uid UUID,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('organizer', 'guest')),
  avatar_color TEXT NOT NULL DEFAULT '#C4785A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, display_name)
);

CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_auth ON trip_members(auth_uid);

-- Days
CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  label TEXT NOT NULL,
  palette_key TEXT NOT NULL DEFAULT 'default',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_days_trip ON days(trip_id);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'other' CHECK (event_type IN ('brunch', 'boat', 'dinner', 'club', 'spa', 'pilates', 'other')),
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_events_day ON events(day_id);

-- Check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in', 'late', 'skip')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, member_id)
);

CREATE INDEX idx_check_ins_event ON check_ins(event_id);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general' CHECK (announcement_type IN ('schedule_change', 'arrival', 'general')),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_by UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_trip ON announcements(trip_id);

-- Packing items
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'misc' CHECK (category IN ('outfits', 'toiletries', 'shared_gear', 'misc')),
  assigned_member_id UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  is_packed BOOLEAN NOT NULL DEFAULT false,
  packed_by UUID REFERENCES trip_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_packing_trip ON packing_items(trip_id);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  paid_by_member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_trip ON expenses(trip_id);

-- Expense splits
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  share_cents INT NOT NULL CHECK (share_cents >= 0)
);

CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);

-- Helper: check if current user is member of trip
CREATE OR REPLACE FUNCTION is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id AND auth_uid = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_trip_organizer(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id AND auth_uid = auth.uid() AND role = 'organizer'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_member_id(p_trip_id UUID)
RETURNS UUID AS $$
  SELECT id FROM trip_members
  WHERE trip_id = p_trip_id AND auth_uid = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Trips: members can read their trip; anyone can read by invite code for join flow
CREATE POLICY trips_select_member ON trips FOR SELECT
  USING (is_trip_member(id));

CREATE POLICY trips_select_invite ON trips FOR SELECT
  USING (true);

-- Trip members
CREATE POLICY members_select ON trip_members FOR SELECT
  USING (is_trip_member(trip_id) OR auth_uid IS NULL);

CREATE POLICY members_insert ON trip_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY members_update ON trip_members FOR UPDATE
  USING (auth_uid = auth.uid() OR is_trip_organizer(trip_id));

-- Days
CREATE POLICY days_select ON days FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY days_insert ON days FOR INSERT WITH CHECK (is_trip_organizer(trip_id));
CREATE POLICY days_update ON days FOR UPDATE USING (is_trip_organizer(trip_id));

-- Events
CREATE POLICY events_select ON events FOR SELECT
  USING (is_trip_member((SELECT trip_id FROM days WHERE id = day_id)));
CREATE POLICY events_insert ON events FOR INSERT
  WITH CHECK (is_trip_organizer((SELECT trip_id FROM days WHERE id = day_id)));
CREATE POLICY events_update ON events FOR UPDATE
  USING (is_trip_organizer((SELECT trip_id FROM days WHERE id = day_id)));

-- Check-ins
CREATE POLICY check_ins_select ON check_ins FOR SELECT
  USING (is_trip_member((SELECT d.trip_id FROM events e JOIN days d ON d.id = e.day_id WHERE e.id = event_id)));
CREATE POLICY check_ins_upsert ON check_ins FOR ALL
  USING (member_id = get_my_member_id((SELECT d.trip_id FROM events e JOIN days d ON d.id = e.day_id WHERE e.id = event_id)));

-- Announcements
CREATE POLICY announcements_select ON announcements FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY announcements_insert ON announcements FOR INSERT
  WITH CHECK (is_trip_member(trip_id));

-- Packing
CREATE POLICY packing_select ON packing_items FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY packing_all ON packing_items FOR ALL USING (is_trip_member(trip_id));

-- Expenses
CREATE POLICY expenses_select ON expenses FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY expenses_insert ON expenses FOR INSERT WITH CHECK (is_trip_member(trip_id));

-- Expense splits
CREATE POLICY splits_select ON expense_splits FOR SELECT
  USING (is_trip_member((SELECT trip_id FROM expenses WHERE id = expense_id)));
CREATE POLICY splits_insert ON expense_splits FOR INSERT
  WITH CHECK (is_trip_member((SELECT trip_id FROM expenses WHERE id = expense_id)));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE packing_items;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- Seed data for Chiara's Bachelorette
DO $$
DECLARE
  v_trip_id UUID;
  v_day1 UUID; v_day2 UUID; v_day3 UUID; v_day4 UUID;
  v_m1 UUID; v_m2 UUID; v_m3 UUID; v_m4 UUID;
  v_m5 UUID; v_m6 UUID; v_m7 UUID; v_m8 UUID;
BEGIN
  INSERT INTO trips (name, start_date, end_date, invite_code, pin_hash)
  VALUES ('Chiara''s Bachelorette', '2026-07-10', '2026-07-13', 'CHIARA710', '2626')
  RETURNING id INTO v_trip_id;

  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Chiara', 'organizer', '#D4847A') RETURNING id INTO v_m1;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Mia', 'guest', '#3BA4BC') RETURNING id INTO v_m2;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Sophie', 'guest', '#C9956B') RETURNING id INTO v_m3;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Lena', 'guest', '#6B5B95') RETURNING id INTO v_m4;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Ava', 'guest', '#8B9A7B') RETURNING id INTO v_m5;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Zoe', 'guest', '#E07A5F') RETURNING id INTO v_m6;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Emma', 'guest', '#7B9ACC') RETURNING id INTO v_m7;
  INSERT INTO trip_members (trip_id, display_name, role, avatar_color) VALUES
    (v_trip_id, 'Isla', 'guest', '#C4A882') RETURNING id INTO v_m8;

  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-10', 'Friday', 'default', 0) RETURNING id INTO v_day1;
  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-11', 'Saturday', 'brunch_blush', 1) RETURNING id INTO v_day2;
  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-12', 'Sunday', 'golden_dinner', 2) RETURNING id INTO v_day3;
  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-13', 'Monday', 'boat_aqua', 3) RETURNING id INTO v_day4;

  INSERT INTO events (day_id, title, event_type, start_time, end_time, location, notes, sort_order) VALUES
    (v_day1, 'Arrival & Check-in', 'other', '15:00', '16:30', 'Villa Thera, Oia', 'Drop bags, change into linen sets', 0),
    (v_day1, 'Welcome Sunset Drinks', 'dinner', '19:00', '22:00', 'Sunset Terrace Bar', 'White outfits encouraged', 1),
    (v_day2, 'Rooftop Brunch', 'brunch', '10:00', '12:30', 'Karma Restaurant', 'Reservation under Chiara', 0),
    (v_day2, 'Boat Day', 'boat', '14:00', '19:00', 'Ammoudi Bay Pier', 'Bring swimsuits + cover-ups', 1),
    (v_day2, 'Club Night', 'club', '23:00', '03:00', 'Enigma Club', 'Glitter optional, vibes mandatory', 2),
    (v_day3, 'Spa Morning', 'spa', '09:30', '11:30', 'Caldera Spa', 'Massages booked for all', 0),
    (v_day3, 'Pilates on the Terrace', 'pilates', '12:00', '13:00', 'Villa Terrace', 'Mats provided', 1),
    (v_day3, 'Golden Hour Dinner', 'dinner', '20:00', '23:00', 'Ambrosia Restaurant', 'Dress code: golden goddess', 2),
    (v_day4, 'Farewell Brunch', 'brunch', '11:00', '13:00', 'Villa Pool Deck', 'Last group photo at 12:30', 0);

  INSERT INTO announcements (trip_id, message, announcement_type, created_by) VALUES
    (v_trip_id, 'Welcome to Santorini! Check the schedule and RSVP for tonight''s sunset drinks.', 'general', v_m1),
    (v_trip_id, 'Dinner moved to 8:30 PM — grab an extra golden hour pic!', 'schedule_change', v_m1);

  INSERT INTO packing_items (trip_id, label, category, assigned_member_id, is_packed) VALUES
    (v_trip_id, 'White linen set (Friday)', 'outfits', NULL, false),
    (v_trip_id, 'Swimsuit + cover-up', 'outfits', NULL, false),
    (v_trip_id, 'Golden goddess dress (Sunday dinner)', 'outfits', NULL, false),
    (v_trip_id, 'Sunscreen SPF 50', 'toiletries', v_m2, true),
    (v_trip_id, 'Portable speaker', 'shared_gear', v_m4, false),
    (v_trip_id, 'Polaroid camera + film', 'shared_gear', v_m1, true),
    (v_trip_id, 'Phone charger / power bank', 'misc', NULL, false),
    (v_trip_id, 'Hangover kit (electrolytes, ibuprofen)', 'misc', v_m3, false);
END $$;
