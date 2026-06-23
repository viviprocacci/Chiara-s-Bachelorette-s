-- Packing items: shared (group list) vs private (only creator sees)

ALTER TABLE packing_items
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'shared'
    CHECK (visibility IN ('shared', 'private')),
  ADD COLUMN IF NOT EXISTS created_by_member_id UUID REFERENCES trip_members(id) ON DELETE SET NULL;

UPDATE packing_items SET visibility = 'shared' WHERE visibility IS NULL;

DROP POLICY IF EXISTS packing_select ON packing_items;
DROP POLICY IF EXISTS packing_all ON packing_items;

CREATE POLICY packing_select ON packing_items FOR SELECT
  USING (
    is_trip_member(trip_id)
    AND (
      visibility = 'shared'
      OR created_by_member_id = get_my_member_id(trip_id)
    )
  );

CREATE POLICY packing_insert ON packing_items FOR INSERT
  WITH CHECK (
    is_trip_member(trip_id)
    AND created_by_member_id = get_my_member_id(trip_id)
  );

CREATE POLICY packing_update_shared ON packing_items FOR UPDATE
  USING (is_trip_member(trip_id) AND visibility = 'shared');

CREATE POLICY packing_update_private ON packing_items FOR UPDATE
  USING (
    is_trip_member(trip_id)
    AND visibility = 'private'
    AND created_by_member_id = get_my_member_id(trip_id)
  );

CREATE POLICY packing_delete ON packing_items FOR DELETE
  USING (
    is_trip_member(trip_id)
    AND (
      (visibility = 'private' AND created_by_member_id = get_my_member_id(trip_id))
      OR is_trip_organizer(trip_id)
    )
  );
