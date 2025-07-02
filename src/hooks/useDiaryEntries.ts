import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useDiaryEntries = (onlyUnread = false) => {
  const fetchEntries = async () => {
    let query = supabase
      .from('diary_entries')
      .select('*, profiles!user_id (line_username)')
      .order('date', { ascending: false });

    if (onlyUnread) {
      query = query
        .is('comment_read_at', null)
        .not('commented_at', 'is', null);
    }
    const { data, error } = await query;
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
        const data = await fetchEntries();
        setEntries(data);
      } catch (err) {
        console.error('日記エントリーの取得エラー:', err);
        setError(err instanceof Error ? err : new Error('不明なエラー'));
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [onlyUnread]);

  return { entries, loading, error, refetch: fetchEntries };
};