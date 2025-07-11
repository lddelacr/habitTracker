/*
  # Add habit sort order functionality

  1. Schema Changes
    - Add `sort_order` column to habits table
    - Set default sort_order based on creation order for existing habits
    - Add index for efficient sorting

  2. Migration Strategy
    - Add column with default values
    - Update existing habits with sort_order based on created_at
    - Ensure new habits get proper sort_order values
*/

-- Add sort_order column to habits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE habits ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- Set sort_order for existing habits based on creation order
UPDATE habits 
SET sort_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as row_number
  FROM habits
  WHERE sort_order = 0 OR sort_order IS NULL
) AS subquery
WHERE habits.id = subquery.id;

-- Add index for efficient sorting
CREATE INDEX IF NOT EXISTS habits_sort_order_idx ON habits(user_id, sort_order);

-- Update RLS policies to include sort_order (no changes needed, existing policies cover all columns)