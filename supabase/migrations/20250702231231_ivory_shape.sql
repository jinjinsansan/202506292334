/*
  # 日記エントリーの重複問題を修正

  1. 変更内容
    - 重複データを検出して削除する関数を追加
    - 同期時に重複IDをチェックするトリガー関数を追加
    - 既存の重複データを削除

  2. 目的
    - データの重複増殖問題を解決
    - 同期エラーの防止
    - データの整合性確保
*/

-- 1. 重複データを検出して削除するための関数
CREATE OR REPLACE FUNCTION remove_diary_duplicates() RETURNS integer AS $$
DECLARE
  duplicate_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  -- 重複を検出するための一時テーブルを作成
  CREATE TEMP TABLE diary_duplicates AS
  WITH duplicates AS (
    SELECT 
      id,
      user_id,
      date,
      emotion,
      LEFT(event, 50) as event_prefix,
      ROW_NUMBER() OVER (
        PARTITION BY id
        ORDER BY created_at DESC
      ) as row_num
    FROM diary_entries
  )
  SELECT id FROM duplicates WHERE row_num > 1;

  -- 重複数をカウント
  SELECT COUNT(*) INTO duplicate_count FROM diary_duplicates;
  
  -- 重複を削除
  DELETE FROM diary_entries
  WHERE id IN (SELECT id FROM diary_duplicates);
  
  -- 削除数をカウント
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 結果をログに出力
  RAISE NOTICE '重複データの削除: % 件の重複を検出し、% 件を削除しました', duplicate_count, deleted_count;
  
  -- 一時テーブルを削除
  DROP TABLE diary_duplicates;
  
  -- 削除した件数を返す
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 2. 既存の重複データを削除
SELECT remove_diary_duplicates();

-- 3. 同期時に重複IDをチェックするためのトリガー関数
CREATE OR REPLACE FUNCTION check_diary_id_duplicate() RETURNS TRIGGER AS $$
DECLARE
  existing_id_count INTEGER;
  new_id UUID;
BEGIN
  -- 同じIDを持つエントリーが既に存在するか確認
  SELECT COUNT(*) INTO existing_id_count
  FROM diary_entries
  WHERE id = NEW.id;
  
  -- 既存のエントリーが見つかった場合
  IF existing_id_count > 0 THEN
    -- 新しいUUIDを生成
    SELECT gen_random_uuid() INTO new_id;
    
    -- 新しいIDを設定
    NEW.id := new_id;
    
    RAISE NOTICE 'Duplicate diary ID detected: %. Generated new ID: %', NEW.id, new_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. トリガーを作成
DROP TRIGGER IF EXISTS check_diary_id_duplicate_trigger ON diary_entries;
CREATE TRIGGER check_diary_id_duplicate_trigger
BEFORE INSERT ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION check_diary_id_duplicate();

-- 5. コメント
COMMENT ON FUNCTION remove_diary_duplicates() IS '重複した日記エントリーを検出して削除する関数';
COMMENT ON FUNCTION check_diary_id_duplicate() IS '重複IDをチェックして新しいUUIDを生成するトリガー関数';