-- Optional Venmo username per member for Split pay deeplinks

ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS venmo_username TEXT;

CREATE OR REPLACE FUNCTION update_member_venmo(p_member_id UUID, p_venmo_username TEXT)
RETURNS trip_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member trip_members;
  v_username TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_member FROM trip_members WHERE id = p_member_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF get_my_member_id(v_member.trip_id) IS DISTINCT FROM p_member_id THEN
    RAISE EXCEPTION 'Not allowed to update this member';
  END IF;

  v_username := NULLIF(
    LOWER(REGEXP_REPLACE(TRIM(COALESCE(p_venmo_username, '')), '^@+', '')),
    ''
  );

  UPDATE trip_members
  SET venmo_username = v_username
  WHERE id = p_member_id
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$;

GRANT EXECUTE ON FUNCTION update_member_venmo(UUID, TEXT) TO anon, authenticated;
