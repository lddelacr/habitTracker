/*
  # Add event support columns to tasks table

  1. New Columns
    - `type` (text) - Values: 'task' or 'event', default 'task'
    - `end_time` (text) - For event duration, format HH:MM (optional)
    - `location` (text) - For event location (optional)
    - `attendees` (text array) - Array of attendee names/emails (optional)
    - `custom_color` (text) - Custom color override in hex format (optional)

  2. Constraints
    - Check constraint on type column to ensure only 'task' or 'event' values
    - Set existing tasks to type='task' by default

  3. Indexes
    - Add indexes for type and location columns for better query performance

  4. Security
    - Existing RLS policies will automatically apply to new columns
*/

-- Add new columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'task',
ADD COLUMN IF NOT EXISTS end_time text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS attendees text[],
ADD COLUMN IF NOT EXISTS custom_color text;

-- Add check constraint for type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tasks_type_check'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_type_check 
    CHECK (type IN ('task', 'event'));
  END IF;
END $$;

-- Set existing tasks to type='task' (in case any are NULL)
UPDATE tasks SET type = 'task' WHERE type IS NULL;

-- Make type column NOT NULL after setting defaults
ALTER TABLE tasks ALTER COLUMN type SET NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tasks_type_idx ON tasks(type);
CREATE INDEX IF NOT EXISTS tasks_location_idx ON tasks(location) WHERE location IS NOT NULL;

-- Add index for custom_color for potential filtering
CREATE INDEX IF NOT EXISTS tasks_custom_color_idx ON tasks(custom_color) WHERE custom_color IS NOT NULL;

-- Add index for attendees array for potential searching
CREATE INDEX IF NOT EXISTS tasks_attendees_idx ON tasks USING GIN(attendees) WHERE attendees IS NOT NULL;