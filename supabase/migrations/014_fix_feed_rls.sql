-- Fix feed photo RLS: accept session-based OR legacy auth_uid membership.

CREATE TABLE IF NOT EXISTS trip_member_sessions (
  auth_uid UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (auth_uid)
);

CREATE INDEX IF NOT EXISTS idx_trip_member_sessions_member ON trip_member_sessions(member_id);

CREATE OR REPLACE FUNCTION is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_member_sessions s
    JOIN trip_members m ON m.id = s.member_id
    WHERE m.trip_id = p_trip_id AND s.auth_uid = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id AND auth_uid = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_member_id(p_trip_id UUID)
RETURNS UUID AS $$
  SELECT COALESCE(
    (
      SELECT s.member_id
      FROM trip_member_sessions s
      JOIN trip_members m ON m.id = s.member_id
      WHERE m.trip_id = p_trip_id AND s.auth_uid = auth.uid()
      LIMIT 1
    ),
    (
      SELECT id FROM trip_members
      WHERE trip_id = p_trip_id AND auth_uid = auth.uid()
      LIMIT 1
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS trip_photos_insert ON storage.objects;
CREATE POLICY trip_photos_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-photos'
    AND (
      EXISTS (
        SELECT 1 FROM trip_member_sessions s
        JOIN trip_members m ON m.id = s.member_id
        WHERE s.auth_uid = auth.uid()
          AND m.trip_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM trip_members m
        WHERE m.auth_uid = auth.uid()
          AND m.trip_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Backfill sessions for members that still only have auth_uid set.
INSERT INTO trip_member_sessions (auth_uid, member_id)
SELECT auth_uid, id FROM trip_members WHERE auth_uid IS NOT NULL
ON CONFLICT (auth_uid) DO UPDATE SET member_id = EXCLUDED.member_id;
