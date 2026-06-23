-- Remove Apps Test guest from production.
DELETE FROM trip_members
WHERE display_name = 'Apps Test'
  AND trip_id IN (SELECT id FROM trips WHERE invite_code = 'CHIARA710');

-- Keep restore_trip_members in sync (9 real guests only).
CREATE OR REPLACE FUNCTION restore_trip_members(
  p_trip_id UUID,
  p_preserve_member_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_uid UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT is_trip_organizer(p_trip_id) THEN
    RAISE EXCEPTION 'Only the organizer can restore members';
  END IF;

  v_uid := auth.uid();
  UPDATE trip_members SET auth_uid = NULL WHERE trip_id = p_trip_id;

  FOR r IN SELECT * FROM (VALUES
    ('Chiara', 'organizer', '#E8A0BF'),
    ('Saoirse', 'guest', '#3BA4BC'),
    ('Lauren', 'guest', '#D4AF37'),
    ('Vivian', 'guest', '#6B5B95'),
    ('Victoria', 'guest', '#E8652B'),
    ('Hannah', 'guest', '#7B9ACC'),
    ('Abby', 'guest', '#C9956B'),
    ('Makayla', 'guest', '#F5C6D0'),
    ('Liz', 'guest', '#A8E0EE')
  ) AS t(display_name, role, avatar_color)
  LOOP
    INSERT INTO trip_members (trip_id, display_name, role, avatar_color)
    VALUES (p_trip_id, r.display_name, r.role, r.avatar_color)
    ON CONFLICT (trip_id, display_name) DO UPDATE SET
      role = EXCLUDED.role,
      avatar_color = EXCLUDED.avatar_color,
      auth_uid = NULL;
  END LOOP;

  IF p_preserve_member_id IS NOT NULL THEN
    UPDATE trip_members
    SET auth_uid = v_uid
    WHERE id = p_preserve_member_id AND trip_id = p_trip_id;
  END IF;
END;
$$;
