-- Allow item creators to delete shared items they added (organizer can still delete any item).

DROP POLICY IF EXISTS packing_delete ON packing_items;

CREATE POLICY packing_delete ON packing_items FOR DELETE
  USING (
    is_trip_member(trip_id)
    AND (
      is_trip_organizer(trip_id)
      OR created_by_member_id = get_my_member_id(trip_id)
    )
  );
