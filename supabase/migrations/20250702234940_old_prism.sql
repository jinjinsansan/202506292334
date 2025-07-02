/*
  # 重複ID問題の修正

  1. 変更内容
    - 重複IDを持つ日記エントリーを修正するための関数を追加
    - 挿入時に重複IDをチェックするためのトリガー関数を追加
    - 日記エントリーの一意制約を追加

  2. 目的
    - 「duplicate key value violates unique constraint "diary_entries_pkey"」エラーの解決
    - 同期エラーの防止
    - データの整合性確保
*/

-- 1. 重複IDを持つ日記エントリーを修正するための関数
CREATE OR REPLACE FUNCTION fix_duplicate_diary_ids() RETURNS integer AS $$
DECLARE
  duplicate_count INTEGER := 0;
  fixed_count INTEGER := 0;
  dup_record RECORD;
BEGIN
  -- 重複IDを検出
  FOR dup_record IN 
    SELECT id, COUNT(*) as count
    FROM diary_entries
    GROUP BY id
    HAVING COUNT(*) > 1
  LOOP
    -- 重複数をカウント
    duplicate_count := duplicate_count + dup_record.count - 1;
    
    -- 最初のエントリー以外のIDを更新
    UPDATE diary_entries
    SET id = gen_random_uuid()
    WHERE id = dup_record.id
    AND ctid NOT IN (
      SELECT ctid FROM diary_entries 
      WHERE id = dup_record.id 
      ORDER BY created_at 
      LIMIT 1
    );
    
    -- 更新数をカウント
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
  END LOOP;
  
  RAISE NOTICE '重複ID修正: % 件の重複を検出し、% 件を修正しました', duplicate_count, fixed_count;
  
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- 2. 挿入時に重複IDをチェックするためのトリガー関数
CREATE OR REPLACE FUNCTION check_diary_id_duplicate() RETURNS TRIGGER AS $$
BEGIN
  -- 同じIDを持つエントリーが既に存在するか確認
  IF EXISTS (SELECT 1 FROM diary_entries WHERE id = NEW.id) THEN
    -- 新しいUUIDを生成
    NEW.id := gen_random_uuid();
    
    RAISE NOTICE '重複日記ID検出: 新しいID % を生成しました', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. トリガーを作成
DROP TRIGGER IF EXISTS check_diary_id_duplicate_trigger ON diary_entries;
CREATE TRIGGER check_diary_id_duplicate_trigger
BEFORE INSERT ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION check_diary_id_duplicate();

-- 4. 日記エントリーの一意制約を追加（存在しない場合のみ）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'diary_entries_user_date_emotion_event_unique'
  ) THEN
    ALTER TABLE diary_entries
      ADD CONSTRAINT diary_entries_user_date_emotion_event_unique
      UNIQUE (user_id, date, emotion, event);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ユニーク制約の追加に失敗しました: %', SQLERRM;
END $$;

-- 5. 既存の重複IDを修正
SELECT fix_duplicate_diary_ids();

-- 6. コメント
COMMENT ON FUNCTION fix_duplicate_diary_ids() IS '重複IDを持つ日記エントリーを修正する関数';
COMMENT ON FUNCTION check_diary_id_duplicate() IS '挿入時に重複IDをチェックして新しいUUIDを生成するトリガー関数';