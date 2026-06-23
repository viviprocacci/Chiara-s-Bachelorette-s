-- Feed likes, comments, and post deletion

CREATE TABLE feed_post_likes (
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, member_id)
);

CREATE INDEX idx_feed_post_likes_post ON feed_post_likes(post_id);

CREATE TABLE feed_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_post_comments_post ON feed_post_comments(post_id, created_at);

ALTER TABLE feed_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY feed_post_likes_select ON feed_post_likes FOR SELECT
  USING (
    is_trip_member((SELECT trip_id FROM feed_posts WHERE id = post_id))
  );

CREATE POLICY feed_post_likes_insert ON feed_post_likes FOR INSERT
  WITH CHECK (
    member_id = get_my_member_id((SELECT trip_id FROM feed_posts WHERE id = post_id))
  );

CREATE POLICY feed_post_likes_delete ON feed_post_likes FOR DELETE
  USING (
    member_id = get_my_member_id((SELECT trip_id FROM feed_posts WHERE id = post_id))
  );

CREATE POLICY feed_post_comments_select ON feed_post_comments FOR SELECT
  USING (
    is_trip_member((SELECT trip_id FROM feed_posts WHERE id = post_id))
  );

CREATE POLICY feed_post_comments_insert ON feed_post_comments FOR INSERT
  WITH CHECK (
    member_id = get_my_member_id((SELECT trip_id FROM feed_posts WHERE id = post_id))
  );

CREATE POLICY feed_post_comments_delete ON feed_post_comments FOR DELETE
  USING (
    member_id = get_my_member_id((SELECT trip_id FROM feed_posts WHERE id = post_id))
    OR is_trip_organizer((SELECT trip_id FROM feed_posts WHERE id = post_id))
  );

CREATE POLICY feed_posts_delete ON feed_posts FOR DELETE
  USING (
    posted_by = get_my_member_id(trip_id)
    OR is_trip_organizer(trip_id)
  );

ALTER PUBLICATION supabase_realtime ADD TABLE feed_post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_post_comments;
