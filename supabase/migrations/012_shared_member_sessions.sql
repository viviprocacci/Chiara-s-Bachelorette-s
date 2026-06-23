-- Allow multiple devices to join as the same guest (shared name, per-device sessions).

CREATE TABLE IF NOT EXISTS trip_member_sessions (
  auth_uid UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (auth_uid)
);

CREATE INDEX IF NOT EXISTS idx_trip_member_sessions_member ON trip_member_sessions(member_id);

-- Migrate existing single-device claims
INSERT INTO trip_member_sessions (auth_uid, member_id)
SELECT auth_uid, id FROM trip_members WHERE auth_uid IS NOT NULL
ON CONFLICT (auth_uid) DO NOTHING;

CREATE OR REPLACE FUNCTION is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_member_sessions s
    JOIN trip_members m ON m.id = s.member_id
    WHERE m.trip_id = p_trip_id AND s.auth_uid = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_trip_organizer(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_member_sessions s
    JOIN trip_members m ON m.id = s.member_id
    WHERE m.trip_id = p_trip_id AND s.auth_uid = auth.uid() AND m.role = 'organizer'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_member_id(p_trip_id UUID)
RETURNS UUID AS $$
  SELECT s.member_id FROM trip_member_sessions s
  JOIN trip_members m ON m.id = s.member_id
  WHERE m.trip_id = p_trip_id AND s.auth_uid = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION claim_trip_member(p_member_id UUID)
RETURNS trip_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member trip_members;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated — enable Anonymous sign-ins in Supabase Auth';
  END IF;

  SELECT * INTO v_member FROM trip_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  INSERT INTO trip_member_sessions (auth_uid, member_id)
  VALUES (auth.uid(), p_member_id)
  ON CONFLICT (auth_uid) DO UPDATE SET member_id = EXCLUDED.member_id;

  RETURN v_member;
END;
$$;

CREATE OR REPLACE FUNCTION release_trip_member(p_member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM trip_member_sessions
  WHERE auth_uid = auth.uid() AND member_id = p_member_id;
END;
$$;

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

  DELETE FROM trip_member_sessions
  WHERE member_id IN (SELECT id FROM trip_members WHERE trip_id = p_trip_id);

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
    INSERT INTO trip_member_sessions (auth_uid, member_id)
    VALUES (v_uid, p_preserve_member_id)
    ON CONFLICT (auth_uid) DO UPDATE SET member_id = EXCLUDED.member_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_trip_member(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION release_trip_member(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION restore_trip_members(UUID, UUID) TO anon, authenticated;

-- Storage upload policy: use sessions instead of trip_members.auth_uid
DROP POLICY IF EXISTS trip_photos_insert ON storage.objects;
CREATE POLICY trip_photos_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-photos'
    AND EXISTS (
      SELECT 1 FROM trip_member_sessions s
      JOIN trip_members m ON m.id = s.member_id
      WHERE s.auth_uid = auth.uid()
        AND m.trip_id::text = (storage.foldername(name))[1]
    )
  );
