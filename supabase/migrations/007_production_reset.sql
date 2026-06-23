-- Production reset: clear test posts, check-ins, expenses, and member claims
DO $$
DECLARE
  v_trip_id UUID;
  v_m1 UUID;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE invite_code = 'CHIARA710';
  IF v_trip_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_m1 FROM trip_members WHERE trip_id = v_trip_id AND display_name = 'Chiara';

  -- Clear feed & activity history
  DELETE FROM feed_posts WHERE trip_id = v_trip_id;
  DELETE FROM check_ins
  WHERE event_id IN (SELECT e.id FROM events e JOIN days d ON d.id = e.day_id WHERE d.trip_id = v_trip_id);
  DELETE FROM expense_splits
  WHERE expense_id IN (SELECT id FROM expenses WHERE trip_id = v_trip_id);
  DELETE FROM expenses WHERE trip_id = v_trip_id;

  -- Reset packing progress
  UPDATE packing_items
  SET is_packed = false, packed_by = NULL, assigned_member_id = NULL
  WHERE trip_id = v_trip_id;

  -- Fresh announcements (remove test posts, keep welcome intel)
  DELETE FROM announcements WHERE trip_id = v_trip_id;
  IF v_m1 IS NOT NULL THEN
    INSERT INTO announcements (trip_id, message, announcement_type, created_by) VALUES
      (v_trip_id, 'Welcome to West Palm! Check the schedule and RSVP for each event.', 'general', v_m1);
  END IF;

  -- Everyone picks their name again on first visit
  UPDATE trip_members SET auth_uid = NULL WHERE trip_id = v_trip_id;
END $$;
