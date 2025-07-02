import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ✨ 追記 or 置換 start
// user_id と profiles テーブルを join し、line_username を一緒に取得する
export const useDiaryEntries = () => {
  const fetchDiaryEntries = async () => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select(`
        *,                                   -- 既存の全カラム
        users!diary_entries_user_id_fkey (line_username)  -- join でユーザー名を取得
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  };

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true);
        const data = await fetchDiaryEntries();
        setEntries(data);
      } catch (err) {
        console.error('日記エントリーの取得エラー:', err);
        setError(err instanceof Error ? err : new Error('不明なエラー'));
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  return { entries, loading, error, refetch: fetchDiaryEntries };
};
// ✨ 追記 or 置換 end