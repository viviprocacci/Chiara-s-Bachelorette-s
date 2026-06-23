-- Add Apps Test guest for QA; APPSTEST + PIN 1234 is handled in app (maps to CHIARA710 trip)
DO $$
DECLARE
  v_trip_id UUID;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE invite_code = 'CHIARA710';
  IF v_trip_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO trip_members (trip_id, display_name, role, avatar_color)
  VALUES (v_trip_id, 'Apps Test', 'guest', '#9CAF88')
  ON CONFLICT (trip_id, display_name) DO UPDATE SET
    role = EXCLUDED.role,
    avatar_color = EXCLUDED.avatar_color;
END $$;
