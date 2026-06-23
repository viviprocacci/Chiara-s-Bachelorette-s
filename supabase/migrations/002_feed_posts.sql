-- Photo feed for trip memories

CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  posted_by UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_posts_trip ON feed_posts(trip_id);
CREATE INDEX idx_feed_posts_created ON feed_posts(trip_id, created_at DESC);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY feed_posts_select ON feed_posts FOR SELECT
  USING (is_trip_member(trip_id));

CREATE POLICY feed_posts_insert ON feed_posts FOR INSERT
  WITH CHECK (is_trip_member(trip_id) AND posted_by = get_my_member_id(trip_id));

ALTER PUBLICATION supabase_realtime ADD TABLE feed_posts;

-- Storage bucket for trip photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-photos', 'trip-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY trip_photos_select ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-photos');

CREATE POLICY trip_photos_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-photos'
    AND EXISTS (
      SELECT 1 FROM trip_members
      WHERE auth_uid = auth.uid()
        AND trip_id::text = (storage.foldername(name))[1]
    )
  );
