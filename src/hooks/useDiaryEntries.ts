import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';
import type { Database } from '../types/supabase';

// ✨ 追記 or 置換 start
// user_id と profiles テーブルを join し、line_username を一緒に取得する
export const useDiaryEntries = () => {
  const supabase = useSupabaseClient<Database>();
  const fetchDiaryEntries = async () => {
    const { data, error } = await supabase
      .from('diary_entries')
      .select(`
        *,                                   -- 既存の全カラム
        profiles!diary_entries_user_id_fkey (line_username)  -- join でユーザー名を取得
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
        console.error('Error fetching diary entries:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  return { entries, loading, error, refetch: fetchDiaryEntries };
};
// ✨ 追記 or 置換 end