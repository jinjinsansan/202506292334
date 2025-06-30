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
        if (!entry || !entry.event) return true; // 無効なエントリーはスキップ
        
        // テストデータの特徴（例：特定の文字列を含むか、特定の日付範囲内か）
        const isTestData = 
          (entry.event && entry.event.includes('テストデータ')) || 
          (entry.realization && entry.realization.includes('テストデータ')) ||
          (entry.event && entry.event.includes('This is a test entry')) ||
          (entry.realization && entry.realization.includes('This is a test realization')) ||
          (entry.event && entry.event.includes('テスト用')) ||
          (entry.event && entry.event.includes('仁さんテスト')) ||
          (entry.event && entry.event.includes('vivaldiさんテスト')) ||
          (entry.event && entry.event.includes('にさんテスト')) ||
          (entry.event && entry.event.includes('テスト'));
        
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
          .or('event.ilike.%テストデータ%,realization.ilike.%テストデータ%,event.ilike.%This is a test entry%,realization.ilike.%This is a test realization%,event.ilike.%テスト用%,event.ilike.%仁さんテスト%,event.ilike.%vivaldiさんテスト%,event.ilike.%にさんテスト%,event.ilike.%テスト%')
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

/**
 * 全ての日記データを削除する関数
 * 注意: この関数は慎重に使用してください。すべての日記データが削除されます。
 */
export const deleteAllDiaries = async (): Promise<{
  localRemoved: number;
  supabaseRemoved: number;
  success: boolean;
}> => {
  try {
    let localRemoved = 0;
    let supabaseRemoved = 0;

    // ローカルストレージから全ての日記を削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      localRemoved = entries.length;
      localStorage.setItem('journalEntries', JSON.stringify([]));
    }

    // Supabaseから全ての日記を削除（接続されている場合のみ）
    if (supabase) {
      try {
        // 現在のユーザーのIDを取得
        const lineUsername = localStorage.getItem('line-username');
        if (lineUsername) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('line_username', lineUsername)
            .single();
          
          if (userError) {
            console.error('ユーザー取得エラー:', userError);
          } else if (userData) {
            // ユーザーの日記のみを削除
            const { data, error } = await supabase
              .from('diary_entries')
              .delete()
              .eq('user_id', userData.id)
              .select();
            
            if (error) {
              console.error('Supabase日記削除エラー:', error);
            } else if (data) {
              supabaseRemoved = data.length;
            }
          }
        } else {
          // ユーザー名がない場合は全ての日記を削除しない
          console.error('ユーザー名が見つかりません。Supabaseからの削除をスキップします。');
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
    console.error('全日記削除エラー:', error);
    return {
      localRemoved: 0,
      supabaseRemoved: 0,
      success: false
    };
  }
};

/**
 * 特定の日記を削除する関数
 */
export const deleteDiary = async (diaryId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // ローカルストレージからの削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      const updatedEntries = entries.filter((entry: any) => entry.id !== diaryId);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    }

    // Supabaseからの削除
    if (supabase) {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', diaryId);
      
      if (error) {
        console.error('Supabase日記削除エラー:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('日記削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
};

/**
 * 複数の日記を削除する関数
 */
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
      // 一括削除（100件ずつに分割して実行）
      const chunkSize = 100;
      for (let i = 0; i < diaryIds.length; i += chunkSize) {
        const chunk = diaryIds.slice(i, i + chunkSize);
        try {
          const { data, error } = await supabase
            .from('diary_entries')
            .delete()
            .in('id', chunk)
            .select();
          
          if (error) {
            console.error(`日記の一括削除エラー (${i}~${i+chunk.length}):`, error);
          } else if (data) {
            supabaseDeletedCount += data.length;
          }
        } catch (err) {
          console.error(`日記の一括削除中にエラー (${i}~${i+chunk.length}):`, err);
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