-- Allow organizers to clear all trip expenses
CREATE POLICY expenses_delete ON expenses
  FOR DELETE USING (is_trip_organizer(trip_id));
