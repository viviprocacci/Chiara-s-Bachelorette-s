-- Let guests claim an unclaimed name slot (link their anonymous auth to a trip_member row)
CREATE POLICY members_claim ON trip_members FOR UPDATE
  USING (auth_uid IS NULL AND auth.uid() IS NOT NULL)
  WITH CHECK (auth_uid = auth.uid());

-- Sync trip data with the real West Palm Beach party (matches demo-data.ts)
DO $$
DECLARE
  v_trip_id UUID;
  v_day1 UUID;
  v_day2 UUID;
  v_day3 UUID;
  v_m1 UUID;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE invite_code = 'CHIARA710';
  IF v_trip_id IS NULL THEN
    RETURN;
  END IF;

  -- Clear half-failed join attempts so names show up again
  UPDATE trip_members SET auth_uid = NULL WHERE trip_id = v_trip_id;

  UPDATE trips SET
    end_date = '2026-07-12',
    default_theme = 'prosecco_pink'
  WHERE id = v_trip_id;

  UPDATE trip_members SET avatar_color = '#E8A0BF' WHERE trip_id = v_trip_id AND display_name = 'Chiara';
  UPDATE trip_members SET display_name = 'Saoirse', avatar_color = '#3BA4BC' WHERE trip_id = v_trip_id AND display_name = 'Mia';
  UPDATE trip_members SET display_name = 'Lauren', avatar_color = '#D4AF37' WHERE trip_id = v_trip_id AND display_name = 'Sophie';
  UPDATE trip_members SET display_name = 'Vivian', avatar_color = '#6B5B95' WHERE trip_id = v_trip_id AND display_name = 'Lena';
  UPDATE trip_members SET display_name = 'Victoria', avatar_color = '#E8652B' WHERE trip_id = v_trip_id AND display_name = 'Ava';
  UPDATE trip_members SET display_name = 'Hannah', avatar_color = '#7B9ACC' WHERE trip_id = v_trip_id AND display_name = 'Zoe';
  UPDATE trip_members SET display_name = 'Abby', avatar_color = '#C9956B' WHERE trip_id = v_trip_id AND display_name = 'Emma';
  UPDATE trip_members SET display_name = 'Makayla', avatar_color = '#F5C6D0' WHERE trip_id = v_trip_id AND display_name = 'Isla';

  INSERT INTO trip_members (trip_id, display_name, role, avatar_color)
  SELECT v_trip_id, 'Liz', 'guest', '#A8E0EE'
  WHERE NOT EXISTS (
    SELECT 1 FROM trip_members WHERE trip_id = v_trip_id AND display_name = 'Liz'
  );

  SELECT id INTO v_m1 FROM trip_members WHERE trip_id = v_trip_id AND display_name = 'Chiara';

  DELETE FROM days WHERE trip_id = v_trip_id;

  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-10', 'Friday', 'prosecco_pink', 0) RETURNING id INTO v_day1;
  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-11', 'Saturday', 'mamma_mia_blue', 1) RETURNING id INTO v_day2;
  INSERT INTO days (trip_id, date, label, palette_key, sort_order) VALUES
    (v_trip_id, '2026-07-12', 'Sunday', 'aperol_sunset', 2) RETURNING id INTO v_day3;

  INSERT INTO events (day_id, title, event_type, start_time, end_time, location, notes, sort_order) VALUES
    (v_day1, 'Airbnb Check-in', 'other', '11:00', '12:00', '433 46th St, West Palm Beach, FL', 'Drop bags, pool-ready', 0),
    (v_day1, 'Pool Day', 'other', '12:00', '18:00', 'Airbnb pool', 'Swim / cover-ups — chill vibes', 1),
    (v_day1, 'PJ''s & Prosecco Night', 'dinner', '19:00', '22:00', '433 46th St, West Palm Beach, FL', 'Any shade of pink pajamas — champagne & prosecco', 2),
    (v_day2, 'Super Trouper Sculpt', 'pilates', '08:00', '09:00', 'TBD — West Palm Beach', 'Any shade of blue workout set', 0),
    (v_day2, 'Boat Rental', 'boat', '10:00', '15:00', 'TBD — West Palm Beach Marina', 'Blue bikini + linen coverup (Santorini / Mamma Mia)', 1),
    (v_day2, 'Happy Hour & Appetizers', 'dinner', '16:00', '18:00', 'TBD — Downtown WPB', 'Casual chic — blue tones', 2),
    (v_day2, 'Dinner Downtown', 'dinner', '21:00', '22:30', 'TBD — Downtown WPB', 'Any shade of blue dress', 3),
    (v_day2, 'Bar Hopping', 'club', '22:30', '01:00', 'Clematis Street / Downtown WPB', 'Blue dress', 4),
    (v_day3, 'Brunch', 'brunch', '11:00', '12:30', 'TBD — West Palm Beach', 'Sunset satin — pinks, yellows, oranges', 0),
    (v_day3, 'Shopping & Strolling', 'other', '12:30', '16:00', 'Worth Ave / CityPlace area', 'Aperol spritz & sunshine bombshell', 1);

  DELETE FROM announcements WHERE trip_id = v_trip_id;
  INSERT INTO announcements (trip_id, message, announcement_type, created_by) VALUES
    (v_trip_id, 'Welcome to West Palm! Check the schedule and RSVP for tonight''s PJ''s & Prosecco.', 'general', v_m1),
    (v_trip_id, 'Dress code reminder: any shade of pink pajamas tonight — champagne vibes only!', 'general', v_m1);

  DELETE FROM packing_items WHERE trip_id = v_trip_id;
  INSERT INTO packing_items (trip_id, label, category, is_packed) VALUES
    (v_trip_id, 'Pink pajamas — any shade (Friday)', 'outfits', false),
    (v_trip_id, 'Blue workout set (Saturday pilates)', 'outfits', false),
    (v_trip_id, 'Blue bikini + linen coverup (boat day)', 'outfits', false),
    (v_trip_id, 'Blue dress (Saturday night)', 'outfits', false),
    (v_trip_id, 'Sunset satin dress — pink, yellow, or orange (Sunday)', 'outfits', false),
    (v_trip_id, 'Sunscreen SPF 50', 'toiletries', false),
    (v_trip_id, 'Portable speaker', 'shared_gear', false),
    (v_trip_id, 'Polaroid camera + film', 'shared_gear', false),
    (v_trip_id, 'Prosecco / champagne (shared)', 'shared_gear', false),
    (v_trip_id, 'Phone charger / power bank', 'misc', false),
    (v_trip_id, 'Hangover kit (electrolytes, ibuprofen)', 'misc', false);
END $$;
