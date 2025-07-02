/*
  # 日記エントリーの重複キーエラー修正

  1. 変更内容
    - 重複した日記エントリーを検出して削除する関数を追加
    - 既存の重複データを削除
    - 同期エラーを防止するためのトリガー関数を追加

  2. 目的
    - "duplicate key value violates unique constraint "diary_entries_pkey"" エラーの解決
    - データの整合性確保
    - 同期エラーの防止
*/

-- 1. 重複データを検出して削除するための関数
CREATE OR REPLACE FUNCTION remove_duplicate_diary_entries() RETURNS integer AS $$
DECLARE
  duplicate_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  -- 重複を検出するための一時テーブルを作成
  CREATE TEMP TABLE duplicate_entries AS
  WITH duplicates AS (
    SELECT 
      id,
      user_id,
      date,
      emotion,
      LEFT(event, 50) as event_prefix,
      LEFT(realization, 50) as realization_prefix,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, date, emotion, LEFT(event, 50), LEFT(realization, 50)
        ORDER BY created_at DESC
      ) as row_num
    FROM diary_entries
  )
  SELECT id FROM duplicates WHERE row_num > 1;

  -- 重複数をカウント
  SELECT COUNT(*) INTO duplicate_count FROM duplicate_entries;
  
  -- 重複を削除
  DELETE FROM diary_entries
  WHERE id IN (SELECT id FROM duplicate_entries);
  
  -- 削除数をカウント
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 結果をログに出力
  RAISE NOTICE '重複データの削除: % 件の重複を検出し、% 件を削除しました', duplicate_count, deleted_count;
  
  -- 一時テーブルを削除
  DROP TABLE duplicate_entries;
  
  -- 削除した件数を返す
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 2. 既存の重複データを削除
SELECT remove_duplicate_diary_entries();

-- 3. 同期時に重複IDをチェックするためのトリガー関数
CREATE OR REPLACE FUNCTION check_duplicate_id() RETURNS TRIGGER AS $$
BEGIN
  -- 同じIDを持つエントリーが既に存在するか確認
  IF EXISTS (SELECT 1 FROM diary_entries WHERE id = NEW.id AND id != NEW.id) THEN
    -- 既存のエントリーが見つかった場合、新しいUUIDを生成
    NEW.id := gen_random_uuid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガーを作成
DROP TRIGGER IF EXISTS check_duplicate_id_trigger ON diary_entries;
CREATE TRIGGER check_duplicate_id_trigger
BEFORE INSERT ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_id();

-- 5. コメント
COMMENT ON FUNCTION remove_duplicate_diary_entries() IS '重複した日記エントリーを検出して削除する関数';
COMMENT ON FUNCTION check_duplicate_id() IS '重複IDをチェックして新しいUUIDを生成するトリガー関数';