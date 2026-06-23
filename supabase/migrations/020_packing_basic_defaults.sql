-- Reset group list to generic starter items (organizer can customize from the app).

DO $$
DECLARE
  v_trip_id UUID;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE invite_code = 'CHIARA710' LIMIT 1;
  IF v_trip_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM packing_items WHERE trip_id = v_trip_id AND visibility = 'shared';

  INSERT INTO packing_items (trip_id, label, category, visibility, sort_order) VALUES
    (v_trip_id, 'Weekend outfits', 'outfits', 'shared', 0),
    (v_trip_id, 'Swimsuit & cover-up', 'outfits', 'shared', 1),
    (v_trip_id, 'Comfortable shoes', 'outfits', 'shared', 2),
    (v_trip_id, 'Toiletries & skincare', 'toiletries', 'shared', 3),
    (v_trip_id, 'Sunscreen', 'toiletries', 'shared', 4),
    (v_trip_id, 'Phone charger', 'misc', 'shared', 5),
    (v_trip_id, 'Portable speaker', 'shared_gear', 'shared', 6),
    (v_trip_id, 'Snacks & water', 'misc', 'shared', 7);
END $$;
