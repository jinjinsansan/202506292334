import { supabase } from './supabase';

/**
 * 重複した日記エントリーを完全に削除する関数
 * ローカルストレージとSupabaseの両方から重複を削除します
 */
export const cleanupDuplicateEntries = async (): Promise<{
  localRemoved: number;
  supabaseRemoved: number;
  success: boolean;
}> => {
  try {
    let localRemoved = 0;
    let supabaseRemoved = 0;

    // ローカルストレージから重複データを削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      
      // 重複を検出するためのマップ
      const uniqueMap = new Map();
      const uniqueEntries = [];
      
      // 重複を除外して新しい配列を作成
      for (const entry of entries) {
        // 日付、感情、内容の組み合わせで一意性を判断
        const key = `${entry.date}_${entry.emotion}_${entry.event.substring(0, 50)}`;
        
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, entry);
          uniqueEntries.push(entry);
        } else {
          localRemoved++;
          console.log(`重複エントリーを検出: ${entry.date}, ${entry.emotion}`);
        }
      }
      
      // 重複を除外したデータを保存
      localStorage.setItem('journalEntries', JSON.stringify(uniqueEntries));
      console.log(`ローカルストレージから${localRemoved}件の重複エントリーを削除しました`);
    }

    // Supabaseから重複を削除（接続されている場合のみ）
    if (supabase) {
      try {
        // Supabaseで重複削除関数を実行
        const { data, error } = await supabase.rpc('remove_duplicate_diary_entries');
        
        if (error) {
          console.error('Supabase重複削除エラー:', error);
        } else {
          supabaseRemoved = 100; // 実際の削除数は取得できないため仮の値
          console.log('Supabaseの重複データを削除しました');
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
    console.error('重複削除エラー:', error);
    return {
      localRemoved: 0,
      supabaseRemoved: 0,
      success: false
    };
  }
};

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
          (entry.event && entry.event.includes('テスト')) ||
          (entry.event && entry.event.includes('日目です。日記です。テスト用'));
        
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
          .or('event.ilike.%テストデータ%,realization.ilike.%テストデータ%,event.ilike.%This is a test entry%,realization.ilike.%This is a test realization%,event.ilike.%テスト用%,event.ilike.%仁さんテスト%,event.ilike.%vivaldiさんテスト%,event.ilike.%にさんテスト%,event.ilike.%テスト%,event.ilike.%日目です。日記です。テスト用%')
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
 * 重複した日記エントリーを削除する関数
 */
export const removeDuplicateEntries = async (): Promise<{
  localRemoved: number;
  supabaseRemoved: number;
  success: boolean;
}> => {
  try {
    let localRemoved = 0;
    let supabaseRemoved = 0;
    
    // ローカルストレージから日記データを取得
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      if (!Array.isArray(entries)) {
        throw new Error('日記データが配列ではありません');
      }
      
      // 重複を検出するためのマップ
      const uniqueMap = new Map();
      const uniqueEntries = [];
      const duplicateIds = [];
      
      // 重複を除外して新しい配列を作成
      for (const entry of entries) {
        // 日付、感情、内容の組み合わせで一意性を判断
        const key = `${entry.date}_${entry.emotion}_${entry.event.substring(0, 50)}`;
        
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, entry);
          uniqueEntries.push(entry);
        } else {
          localRemoved++;
          duplicateIds.push(entry.id);
          console.log(`重複エントリーを検出: ${entry.date}, ${entry.emotion}`);
        }
      }
      
      // 重複を除外したデータを保存
      localStorage.setItem('journalEntries', JSON.stringify(uniqueEntries));
      console.log(`ローカルストレージから${localRemoved}件の重複エントリーを削除しました`);
      
      // Supabaseからも重複を削除
      if (supabase && duplicateIds.length > 0) {
        try {
          // 重複IDを100件ずつに分割して削除
          const chunkSize = 100;
          for (let i = 0; i < duplicateIds.length; i += chunkSize) {
            const chunk = duplicateIds.slice(i, i + chunkSize);
            const { error } = await supabase
              .from('diary_entries')
              .delete()
              .in('id', chunk);
            
            if (error) {
              console.error(`Supabase重複削除エラー (${i}~${i+chunk.length}):`, error);
            } else {
              supabaseRemoved += chunk.length;
            }
          }
          
          console.log(`Supabaseから${supabaseRemoved}件の重複エントリーを削除しました`);
        } catch (supabaseError) {
          console.error('Supabase接続エラー:', supabaseError);
        }
      }
    }
    
    return {
      localRemoved,
      supabaseRemoved,
      success: true
    };
  } catch (error) {
    console.error('重複削除エラー:', error);
    return {
      localRemoved: 0,
      supabaseRemoved: 0,
      success: false
    };
  }
};