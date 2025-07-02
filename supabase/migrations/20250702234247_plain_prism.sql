/*
  # 日記エントリーの重複ID問題を修正

  1. 変更内容
    - 重複IDを持つ日記エントリーを検出して修正する関数を追加
    - 挿入時に重複IDをチェックするトリガー関数を追加
    - 既存の重複IDを修正

  2. 目的
    - "duplicate key value violates unique constraint "diary_entries_pkey"" エラーの解決
    - データ同期の安定性向上
    - 今後の同様のエラーを防止
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

-- 2. 既存の重複IDを修正
SELECT fix_duplicate_diary_ids();

-- 3. 挿入時に重複IDをチェックするためのトリガー関数
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

-- 4. トリガーを作成
DROP TRIGGER IF EXISTS check_diary_id_duplicate_trigger ON diary_entries;
CREATE TRIGGER check_diary_id_duplicate_trigger
BEFORE INSERT ON diary_entries
FOR EACH ROW
EXECUTE FUNCTION check_diary_id_duplicate();

-- 5. コメント
COMMENT ON FUNCTION fix_duplicate_diary_ids() IS '重複IDを持つ日記エントリーを修正する関数';
COMMENT ON FUNCTION check_diary_id_duplicate() IS '挿入時に重複IDをチェックして新しいUUIDを生成するトリガー関数';