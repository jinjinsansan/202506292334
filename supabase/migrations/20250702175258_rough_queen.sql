/*
  # 日記エントリーの重複防止

  1. 変更内容
    - user_id, date, emotion, eventの組み合わせに一意制約を追加
    - 重複データの防止

  2. 目的
    - データの重複を防止
    - 同期時の重複エントリー作成を防止
    - データベースの整合性確保
*/

BEGIN;

-- ユニーク制約を追加
ALTER TABLE diary_entries
    ADD CONSTRAINT diary_entries_user_date_emotion_event_unique
    UNIQUE (user_id, date, emotion, event);

COMMIT;