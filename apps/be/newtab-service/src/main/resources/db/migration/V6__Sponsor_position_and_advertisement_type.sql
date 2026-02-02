-- Add position_type: full background / window under Autocomplete (default: window)
ALTER TABLE sponsors
    ADD COLUMN IF NOT EXISTS position_type VARCHAR(50) DEFAULT 'WINDOW';

UPDATE sponsors
SET position_type = 'WINDOW'
WHERE position_type IS NULL;

ALTER TABLE sponsors
    ALTER COLUMN position_type SET DEFAULT 'WINDOW',
    ALTER COLUMN position_type SET NOT NULL;

-- Add advertisement_type: image, loop video, loop gif (replaces type)
ALTER TABLE sponsors
    ADD COLUMN IF NOT EXISTS advertisement_type VARCHAR(50);

UPDATE sponsors
SET advertisement_type = CASE
    WHEN type = 'image' THEN 'IMAGE'
    WHEN type = 'video' THEN 'LOOP_VIDEO'
    ELSE 'IMAGE'
END
WHERE advertisement_type IS NULL;

ALTER TABLE sponsors
    ALTER COLUMN advertisement_type SET NOT NULL;

ALTER TABLE sponsors
    DROP CONSTRAINT IF EXISTS sponsors_type_check;

ALTER TABLE sponsors
    ADD CONSTRAINT sponsors_advertisement_type_check
    CHECK (advertisement_type IN ('IMAGE', 'LOOP_VIDEO', 'LOOP_GIF'));

-- Dropping type also drops its check constraint
ALTER TABLE sponsors
    DROP COLUMN IF EXISTS type;
