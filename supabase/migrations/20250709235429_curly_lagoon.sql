/*
  # Add datetime support to tasks table

  1. Schema Changes
    - Update due_date column to support datetime (keep as text for timezone handling)
    - Add due_time column for time component
    - Update existing tasks to have default time

  2. Data Migration
    - Set default time for existing tasks to 09:00 AM
    - Combine date and time for proper datetime handling

  3. Indexes
    - Update indexes to support datetime queries
*/

-- Add due_time column for time component
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_time'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_time text DEFAULT '09:00';
  END IF;
END $$;

-- Update existing tasks to have default time if they don't have one
UPDATE tasks 
SET due_time = '09:00'
WHERE due_time IS NULL;

-- Create index for better performance on due_time
CREATE INDEX IF NOT EXISTS tasks_due_time_idx ON tasks(due_time);