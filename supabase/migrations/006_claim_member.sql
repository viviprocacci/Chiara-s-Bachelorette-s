-- Reliable name claim: bypasses RLS edge cases on trip_members UPDATE
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
    AND auth_uid IS NULL
  RETURNING * INTO v_member;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That name is already taken — pick another';
  END IF;

  RETURN v_member;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_trip_member(UUID) TO anon, authenticated;
