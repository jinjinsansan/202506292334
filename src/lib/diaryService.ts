// 日記サービス
import { supabase } from './supabase';

// 日記の一括削除
export const bulkDeleteDiaries = async (diaryIds: string[]): Promise<{
  success: boolean;
  error?: string;
  deletedCount: number;
}> => {
  if (!diaryIds || diaryIds.length === 0) {
    return { 
      success: false, 
      error: '削除する日記が選択されていません', 
      deletedCount: 0 
    };
  }

  try {
    // ローカルストレージからの削除
    const savedEntries = localStorage.getItem('journalEntries');
    let localDeletedCount = 0;
    
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      const updatedEntries = entries.filter((entry: any) => !diaryIds.includes(entry.id));
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      localDeletedCount = entries.length - updatedEntries.length;
    }

    // Supabaseからの削除
    let supabaseDeletedCount = 0;
    
    if (supabase) {
      for (const diaryId of diaryIds) {
        try {
          const { error } = await supabase
            .from('diary_entries')
            .delete()
            .eq('id', diaryId);
          
          if (!error) {
            supabaseDeletedCount++;
          } else {
            console.error(`日記ID ${diaryId} の削除エラー:`, error);
          }
        } catch (err) {
          console.error(`日記ID ${diaryId} の削除中にエラー:`, err);
        }
      }
    }

    return { 
      success: true, 
      deletedCount: localDeletedCount 
    };
  } catch (err) {
    console.error('一括削除エラー:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { 
      success: false, 
      error: errorMessage, 
      deletedCount: 0 
    };
  }
};

export default {
  bulkDeleteDiaries
};