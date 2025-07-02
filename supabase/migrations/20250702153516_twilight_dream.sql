BEGIN;

-- (1) 既読判定用の列を追加（NULL = 未読）
ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS comment_read_at timestamptz;

-- (2) ログイン中ユーザーの未読件数を返す RPC
CREATE OR REPLACE FUNCTION unread_comments(uid uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT count(*)
  FROM diary_entries
  WHERE user_id = uid
    AND commented_at IS NOT NULL
    AND (comment_read_at IS NULL OR commented_at > comment_read_at);
$$;

COMMIT;