-- Custom order for packing list rows

ALTER TABLE packing_items
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY trip_id ORDER BY created_at) - 1 AS rn
  FROM packing_items
)
UPDATE packing_items pi
SET sort_order = ranked.rn
FROM ranked
WHERE pi.id = ranked.id;
