-- Allow any trip member to delete individual expenses (and their splits)

DROP POLICY IF EXISTS expenses_delete ON expenses;
CREATE POLICY expenses_delete ON expenses
  FOR DELETE USING (is_trip_member(trip_id));

DROP POLICY IF EXISTS splits_delete ON expense_splits;
CREATE POLICY splits_delete ON expense_splits FOR DELETE
  USING (is_trip_member((SELECT trip_id FROM expenses WHERE id = expense_id)));
