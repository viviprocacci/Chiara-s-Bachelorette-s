-- Keep all guest names visible on the join screen, allow re-join after leaving.

DROP POLICY IF EXISTS members_select ON trip_members;
CREATE POLICY members_select ON trip_members FOR SELECT
  USING (true);

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

  UPDATE trip_members
  SET auth_uid = auth.uid()
  WHERE id = p_member_id
    AND (auth_uid IS NULL OR auth_uid = auth.uid())
  RETURNING * INTO v_member;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That name is already taken — pick another';
  END IF;

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

  UPDATE trip_members
  SET auth_uid = NULL
  WHERE id = p_member_id
    AND auth_uid = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION release_trip_member(UUID) TO anon, authenticated;
