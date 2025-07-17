/*
  # Add selected_days column to habits table

  1. Schema Changes
    - Add `selected_days` column to store JSON array of selected days
    - Migrate existing `target_frequency` data to `selected_days`
    - Keep `target_frequency` column for backward compatibility

  2. Data Migration
    - Convert 'daily' frequency to all 7 days
    - Convert 'weekly' frequency to Monday, Wednesday, Friday
    - Handle any null or invalid values

  3. Indexes
    - Add index on selected_days for better query performance
*/

-- Add selected_days column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'selected_days'
  ) THEN
    ALTER TABLE habits ADD COLUMN selected_days text;
  END IF;
END $$;

-- Migrate existing data from target_frequency to selected_days
UPDATE habits 
SET selected_days = CASE 
  WHEN target_frequency = 'daily' OR target_frequency IS NULL THEN 
    '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'
  WHEN target_frequency = 'weekly' THEN 
    '["monday","wednesday","friday"]'
  ELSE 
    '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'
END
WHERE selected_days IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS habits_selected_days_idx ON habits(selected_days);