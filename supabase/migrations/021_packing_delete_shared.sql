-- Any trip member can remove shared group items; private items stay creator-only.

DROP POLICY IF EXISTS packing_delete ON packing_items;

CREATE POLICY packing_delete ON packing_items FOR DELETE
  USING (
    is_trip_member(trip_id)
    AND (
      visibility = 'shared'
      OR created_by_member_id = get_my_member_id(trip_id)
      OR is_trip_organizer(trip_id)
    )
  );
