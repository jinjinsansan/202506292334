BEGIN;

-- 既読判定用の列を追加（NULL = 未読）
ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS comment_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS commented_at timestamptz;

-- 既存のコメント付き日記エントリーの commented_at を設定
UPDATE diary_entries
SET commented_at = created_at
WHERE counselor_memo IS NOT NULL 
  AND counselor_memo != ''
  AND commented_at IS NULL;

-- 未読件数を返す簡易 RPC
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