import { supabase } from './supabase';

/**
 * テストデータを削除する関数
 * Boltが作成したテストデータを削除し、実際のユーザーデータは保持します
 */
export const cleanupTestData = async (): Promise<{
  localRemoved: number;
  supabaseRemoved: number;
  success: boolean;
}> => {
  try {
    let localRemoved = 0;
    let supabaseRemoved = 0;

    // ローカルストレージからテストデータを削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      
      // テストデータを識別（例：特定のパターンを持つデータ）
      const realEntries = entries.filter((entry: any) => {
        // テストデータの特徴（例：特定の文字列を含むか、特定の日付範囲内か）
        const isTestData = 
          (entry.event && entry.event.includes('テストデータ')) || 
          (entry.realization && entry.realization.includes('テストデータ')) ||
          (entry.event && entry.event.includes('This is a test entry')) ||
          (entry.realization && entry.realization.includes('This is a test realization'));
        
        if (isTestData) {
          localRemoved++;
          return false;
        }
        return true;
      });
      
      // 実際のユーザーデータのみを保存
      localStorage.setItem('journalEntries', JSON.stringify(realEntries));
    }

    // Supabaseからテストデータを削除（接続されている場合のみ）
    if (supabase) {
      try {
        // テストデータを識別して削除
        const { data, error } = await supabase
          .from('diary_entries')
          .delete()
          .or('event.ilike.%テストデータ%,realization.ilike.%テストデータ%,event.ilike.%This is a test entry%,realization.ilike.%This is a test realization%')
          .select();
        
        if (error) {
          console.error('Supabaseテストデータ削除エラー:', error);
        } else if (data) {
          supabaseRemoved = data.length;
        }
      } catch (supabaseError) {
        console.error('Supabase接続エラー:', supabaseError);
      }
    }

    return {
      localRemoved,
      supabaseRemoved,
      success: true
    };
  } catch (error) {
    console.error('テストデータ削除エラー:', error);
    return {
      localRemoved: 0,
      supabaseRemoved: 0,
      success: false
    };
  }
};