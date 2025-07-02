/*
  # Add comment read tracking functionality

  1. New Fields
    - `comment_read_at` (timestamptz) - Timestamp when the user read the comment
    - `commented_at` (timestamptz) - Timestamp when the counselor added a comment

  2. New Function
    - `unread_comment_count` - Returns the count of unread comments for a user
*/

BEGIN;

-- 1. Add columns for tracking comment read status
ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS comment_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS commented_at timestamptz;

-- 2. Update existing entries to set commented_at for entries with counselor_memo
UPDATE diary_entries
SET commented_at = created_at
WHERE counselor_memo IS NOT NULL 
  AND counselor_memo != ''
  AND commented_at IS NULL;

-- 3. Create function to count unread comments
CREATE OR REPLACE FUNCTION unread_comment_count(uid uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT count(*)::integer
  FROM diary_entries
  WHERE user_id = uid
    AND counselor_memo IS NOT NULL
    AND counselor_memo != ''
    AND commented_at IS NOT NULL
    AND (comment_read_at IS NULL OR commented_at > comment_read_at);
$$;

COMMIT;