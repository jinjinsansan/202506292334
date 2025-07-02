import { createClient } from '@supabase/supabase-js';

// Supabase設定
// 環境変数から取得するか、直接指定する
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://afojjlfuwglzukzinpzx.supabase.co'; 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb2pqbGZ1d2dsenVremlucHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDc4MzEsImV4cCI6MjA2NjE4MzgzMX0.ovSwuxvBL5gHtW4XdDkipz9QxWL_njAkr7VQgy1uVRY'; 
const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true';

// Supabaseクライアントの作成（ローカルモードでない場合のみ）
// 常に接続を試みる（ローカルモードでも接続情報があれば接続）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null; 

// グローバルにsupabaseを公開（コンポーネントからアクセスできるように）
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

// ユーザーサービス
export const userService = {
  // ユーザーの作成または取得
  async createOrGetUser(lineUsername: string) {
    if (!supabase) return null;
    
    if (!lineUsername || lineUsername.trim() === '') {
      console.error('ユーザー名が空です');
      return null;
    }

    try {
      // 既存ユーザーの検索
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('line_username', lineUsername)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('ユーザー検索エラー:', searchError, 'ユーザー名:', lineUsername);
        return null;
      }
      
      // 既存ユーザーが見つかった場合
      if (existingUser) {
        return existingUser;
      }
      
      // 新規ユーザーの作成
      const { data: newUser, error: createError } = await supabase
        .from('users') 
        .insert([{ line_username: lineUsername.trim() }])
        .select()
        .single();
      
      if (createError) {
        console.error('ユーザー作成エラー:', createError);
        return null;
      }
      
      return newUser;
    } catch (error) {
      console.error('ユーザーサービスエラー:', error);
      return null;
    }
  },
  
  // ユーザーIDの取得
  async getUserId(lineUsername: string) {
    if (!supabase) return null;
    
    if (!lineUsername || lineUsername.trim() === '') {
      console.error('ユーザー名が空です');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('line_username', lineUsername)
        .single();
      
      if (error) {
        console.error('ユーザーID取得エラー:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('ユーザーID取得サービスエラー:', error);
      return null;
    }
  }
};

// 日記サービス
export const diaryService = {
  // 日記の同期
  async syncDiaries(userId: string, diaries: any[]) {
    if (!supabase) return { success: false, error: 'Supabase接続なし' };
    
    // ローカルモードの場合は同期をスキップ
    if (isLocalMode) {
      return { success: true, message: 'ローカルモードのため同期をスキップしました' };
    }

    // UUIDの形式を検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('無効なユーザーID形式:', userId);
      
      // 無効なユーザーIDの場合は、エラーを返す代わりに新しいユーザーを作成
      try {
        const lineUsername = localStorage.getItem('line-username');
        if (!lineUsername) {
          return { success: false, error: 'ユーザー名が設定されていません' };
        }
        
        console.log('無効なユーザーIDを検出。新しいユーザーを作成します...');
        const newUser = await userService.createOrGetUser(lineUsername);
        if (!newUser || !newUser.id) {
          return { success: false, error: '新しいユーザーの作成に失敗しました' };
        }
        
        userId = newUser.id;
        console.log('新しいユーザーを作成しました:', lineUsername, 'ID:', userId);
      } catch (error) {
        console.error('ユーザー作成エラー:', error);
        return { success: false, error: 'ユーザー作成に失敗しました' };
      }
    }

    if (!userId) {
      return { success: false, error: 'ユーザーIDが指定されていません' };
    }

    if (!diaries || !Array.isArray(diaries) || diaries.length === 0) {
      return { success: true, message: '同期するデータがありません' };
    }

    try {
      // 日記データの整形
      const formattedDiaries = diaries
        .filter(diary => diary && diary.id && diary.date && diary.emotion) // 無効なデータをフィルタリング
        .map((diary) => {
          // UUIDの形式を検証し、無効な場合は新しいUUIDを生成（より堅牢な方法）
          let diaryId = diary.id;
          if (!uuidRegex.test(diaryId)) {
            try {
              // crypto.randomUUID()が利用可能な場合はそれを使用
              if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                diaryId = crypto.randomUUID();
              } else {
                // RFC4122準拠のUUIDを生成する代替方法
                diaryId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
              }
              console.log(`無効なID "${diary.id}" を新しいID "${diaryId}" に置き換えました`);
            } catch (error) {
              console.error('UUID生成エラー:', error);
              // エラーが発生した場合は元のIDを使用
              diaryId = diary.id;
            }
          }
          
          // 必須フィールドを含むエントリーを作成
          const formattedEntry: any = {
            id: diaryId,
            user_id: diary.user_id || userId, // user_idが存在する場合はそれを使用、ない場合はuserIdを使用
            date: diary.date || new Date().toISOString().split('T')[0],
            emotion: diary.emotion || '無価値感',
            event: diary.event || '',
            realization: diary.realization || '',
            self_esteem_score: typeof diary.selfEsteemScore === 'number' ? diary.selfEsteemScore : 
                              (typeof diary.selfEsteemScore === 'string' ? parseInt(diary.selfEsteemScore) : 
                               (typeof diary.self_esteem_score === 'number' ? diary.self_esteem_score : 
                                (typeof diary.self_esteem_score === 'string' ? parseInt(diary.self_esteem_score) : 50))),
            worthlessness_score: typeof diary.worthlessnessScore === 'number' ? diary.worthlessnessScore : 
                                (typeof diary.worthlessnessScore === 'string' ? parseInt(diary.worthlessnessScore) : 
                                 (typeof diary.worthlessness_score === 'number' ? diary.worthlessness_score : 
                                  (typeof diary.worthlessness_score === 'string' ? parseInt(diary.worthlessness_score) : 50))),
            created_at: diary.created_at || new Date().toISOString()
          };
          
          // スコアフィールドの処理
          if (diary.emotion === '無価値感' || 
              diary.emotion === '嬉しい' || 
              diary.emotion === '感謝' || 
              diary.emotion === '達成感' || 
              diary.emotion === '幸せ') {
            
            // 自己肯定感スコアの処理
            if (typeof diary.selfEsteemScore === 'number') {
              formattedEntry.self_esteem_score = diary.selfEsteemScore;
            } else if (typeof diary.selfEsteemScore === 'string') {
              formattedEntry.self_esteem_score = parseInt(diary.selfEsteemScore) || 50;
            } else if (typeof diary.self_esteem_score === 'number') {
              formattedEntry.self_esteem_score = diary.self_esteem_score;
            } else if (typeof diary.self_esteem_score === 'string') {
              formattedEntry.self_esteem_score = parseInt(diary.self_esteem_score) || 50;
            } else {
              formattedEntry.self_esteem_score = 50;
            }
            
            // 無価値感スコアの処理
            if (typeof diary.worthlessnessScore === 'number') {
              formattedEntry.worthlessness_score = diary.worthlessnessScore;
            } else if (typeof diary.worthlessnessScore === 'string') {
              formattedEntry.worthlessness_score = parseInt(diary.worthlessnessScore) || 50;
            } else if (typeof diary.worthlessness_score === 'number') {
              formattedEntry.worthlessness_score = diary.worthlessness_score;
            } else if (typeof diary.worthlessness_score === 'string') {
              formattedEntry.worthlessness_score = parseInt(diary.worthlessness_score) || 50;
            } else {
              formattedEntry.worthlessness_score = 50;
            }
          }
          
          // カウンセラーメモの処理
          if (diary.counselor_memo !== undefined) {
            formattedEntry.counselor_memo = diary.counselor_memo;
          } else if (diary.counselorMemo !== undefined) {
            formattedEntry.counselor_memo = diary.counselorMemo || '';
          }
          
          // 明示的にnullの場合は空文字列に変換（PostgreSQLのNULL制約対策）
          if (formattedEntry.counselor_memo === null) {
            formattedEntry.counselor_memo = '';
          }
          
          // 表示設定の処理
          if (diary.is_visible_to_user !== undefined) {
            formattedEntry.is_visible_to_user = diary.is_visible_to_user;
          } else if (diary.isVisibleToUser !== undefined) {
            formattedEntry.is_visible_to_user = diary.isVisibleToUser;
          } else {
            formattedEntry.is_visible_to_user = false;
          }
          
          // カウンセラー名の処理
          if (diary.counselor_name !== undefined) {
            formattedEntry.counselor_name = diary.counselor_name;
          } else if (diary.counselorName !== undefined) {
            formattedEntry.counselor_name = diary.counselorName || '';
          }
          
          // 明示的にnullの場合は空文字列に変換（PostgreSQLのNULL制約対策）
          if (formattedEntry.counselor_name === null) {
            formattedEntry.counselor_name = '';
          }
          
          // 担当カウンセラーの処理
          if (diary.assigned_counselor !== undefined) {
            formattedEntry.assigned_counselor = diary.assigned_counselor;
          } else if (diary.assignedCounselor !== undefined) {
            formattedEntry.assigned_counselor = diary.assignedCounselor || '';
          }
          
          // 明示的にnullの場合は空文字列に変換（PostgreSQLのNULL制約対策）
          if (formattedEntry.assigned_counselor === null) {
            formattedEntry.assigned_counselor = '';
          }
          
          // 緊急度の処理
          if (diary.urgency_level !== undefined) {
            let urgencyValue = diary.urgency_level || '';
            
            // 許可された値のみを設定（high, medium, low、または空文字列）
            if (urgencyValue !== 'high' && urgencyValue !== 'medium' && urgencyValue !== 'low' && urgencyValue !== '') {
              // 無効な値の場合は空文字列に設定
              console.warn(`無効な緊急度の値: ${urgencyValue}、空に設定します`);
              urgencyValue = '';
            }
            
            formattedEntry.urgency_level = urgencyValue;
          } else if (diary.urgencyLevel !== undefined) {
            let urgencyValue = diary.urgencyLevel || '';
            
            // 許可された値のみを設定（high, medium, low、または空文字列）
            if (urgencyValue !== 'high' && urgencyValue !== 'medium' && urgencyValue !== 'low' && urgencyValue !== '') {
              // 無効な値の場合は空文字列に設定
              console.warn(`無効な緊急度の値: ${urgencyValue}、空に設定します`);
              urgencyValue = '';
            }
            
            formattedEntry.urgency_level = urgencyValue;
          }
          
          // NULL値を空文字列に変換
          if (formattedEntry.counselor_memo === null) {
            formattedEntry.counselor_memo = '';
          }
          
          if (formattedEntry.counselor_name === null) {
            formattedEntry.counselor_name = '';
          }
          
          if (formattedEntry.assigned_counselor === null) {
            formattedEntry.assigned_counselor = '';
          }
          
          if (formattedEntry.urgency_level === null) {
            formattedEntry.urgency_level = '';
          }
          
          // is_visible_to_userがNULLの場合はfalseに設定
          if (formattedEntry.is_visible_to_user === null) {
            formattedEntry.is_visible_to_user = false;
          }
          
          return formattedEntry;
        });
      
      console.log('Supabaseに同期するデータ:', formattedDiaries.length, '件', 'ユーザーID:', userId);
      
      // デバッグ用：最初の数件のデータを表示
      if (formattedDiaries.length > 0) {
        console.log('同期データサンプル:', formattedDiaries.slice(0, 2));
      }
      
      if (formattedDiaries.length === 0) {
        return { success: true, message: '有効な同期データがありません' };
      }
      
      // 所有者列(username)を送らないようにサニタイズするが、user_idは保持する
      const sanitized = formattedDiaries.map(({ username, ...rest }) => rest);
      
      // 一括挿入（競合時は更新）
      const { data, error } = await supabase
        .from('diary_entries')
        .upsert(sanitized, {
          onConflict: 'id',
          ignoreDuplicates: false,
          returning: 'minimal'
        });
      
      if (error) {
        console.error('日記同期エラー:', error, 'データ件数:', formattedDiaries.length, 'エラー詳細:', error.details);
        
        // エラーが発生した場合、1件ずつ同期を試みる
        if (formattedDiaries.length > 1) {
          console.log('1件ずつ同期を試みます...');
          let successCount = 0;
          
          for (const diary of formattedDiaries) {
            try {
              const { username, ...sanitizedDiary } = diary;
              
              const { error: singleError } = await supabase
                .from('diary_entries').upsert([sanitizedDiary], {
                  onConflict: 'id',
                ignoreDuplicates: false,
                returning: 'minimal'
              });
              
              if (!singleError) {
                successCount++;
              } else {
                console.error('個別同期エラー:', singleError, 'ID:', diary.id);
              } 
            } catch (err) { 
              console.error('個別同期例外:', err);
            }
          }
          
          console.log(`個別同期結果: ${successCount}/${formattedDiaries.length}件成功`);
          
          if (successCount > 0) {
            return { success: true, message: `${successCount}/${formattedDiaries.length}件の同期に成功しました` };
          }
        }
        
        return { success: false, error: error.message };
      }
      
      console.log('日記同期成功:', formattedDiaries.length, '件');
      return { success: true, data };
    } catch (err) {
      console.error('日記同期サービスエラー:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  },
  
  // 日記の削除
  async deleteDiary(id: string) {
    if (!supabase) return { success: false, error: 'Supabase接続なし' };

    // ローカルモードの場合は削除をスキップ
    if (isLocalMode) {
      return { success: true, message: 'ローカルモードのため削除をスキップしました' };
    }

    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('日記削除エラー:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      console.error('日記削除サービスエラー:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  },
  
  // ユーザーの日記を取得
  async getUserDiaries(userId: string) {
    if (!supabase) return [];
    
    if (!userId) {
      console.error('ユーザーIDが指定されていません');
      return [];
    }
    
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select(`
          *,
          users (
            line_username
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('日記取得エラー:', error);
        return [];
      }
      
      // ユーザー情報を含めて返す
      return data?.map(entry => ({
        ...entry,
        user: entry.users
      })) || [];
    } catch (error) {
      console.error('日記取得サービスエラー:', error);
      return [];
    }
  }
};

// チャットサービス
export const chatService = {
  // チャットメッセージの取得
  async getChatMessages(chatRoomId: string) {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('メッセージ取得エラー:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('メッセージ取得サービスエラー:', error);
      return [];
    }
  },

  // 全ての日記を取得
  async getAllDiaries() {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select(`
          *,
          users (
            line_username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('全日記取得エラー:', error);
        throw error;
      }
      
      // ユーザー情報を含めて返す
      return data?.map(entry => ({
        ...entry,
        user: entry.users
      })) || [];
    } catch (error) {
      console.error('全日記取得サービスエラー:', error);
      throw error;
    }
  },
  
  // メッセージの送信
  async sendMessage(chatRoomId: string, content: string, senderId?: string, counselorId?: string) {
    if (!supabase) return null;

    try {
      const isCounselor = !!counselorId;
      
      const message = {
        chat_room_id: chatRoomId,
        content,
        sender_id: isCounselor ? null : senderId,
        counselor_id: isCounselor ? counselorId : null,
        is_counselor: isCounselor
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();
      
      if (error) {
        console.error('メッセージ送信エラー:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('メッセージ送信サービスエラー:', error);
      return null;
    }
  }
};

// 同意履歴サービス
export const consentService = {
  // 同意履歴の保存
  async saveConsentHistory(consentRecord: any) {
    if (!supabase) return { success: false, error: 'Supabase接続なし' };

    try {
      const { data, error } = await supabase
        .from('consent_histories')
        .insert([consentRecord])
        .select()
        .single();
      
      if (error) {
        console.error('同意履歴保存エラー:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('同意履歴保存サービスエラー:', error);
      return { success: false, error: String(error) };
    }
  },
  
  // 同意履歴の取得
  async getAllConsentHistories() {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('consent_histories')
        .select('*')
        .order('consent_date', { ascending: false });
      
      if (error) {
        console.error('同意履歴取得エラー:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('同意履歴取得サービスエラー:', error);
      return [];
    }
  }
};

// 同期サービス
export const syncService = {
  // 同意履歴をSupabaseに同期
  async syncConsentHistories() {
    if (!supabase) return false;

    try {
      // ローカルストレージから同意履歴を取得
      const savedHistories = localStorage.getItem('consent_histories');
      if (!savedHistories) return true; // 同期するデータがない場合は成功とみなす
      
      const histories = JSON.parse(savedHistories);
      if (!Array.isArray(histories) || histories.length === 0) return true;
      
      // 一括挿入（競合時は無視）
      const { error } = await supabase
        .from('consent_histories')
        .upsert(histories, {
          onConflict: 'id',
          ignoreDuplicates: true
        });
        
      if (error) {
        console.error('同意履歴同期エラー:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('同意履歴同期サービスエラー:', error);
      return false;
    }
  },
  
  // Supabaseから同意履歴をローカルに同期
  async syncConsentHistoriesToLocal() {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('consent_histories')
        .select('*')
        .order('consent_date', { ascending: false });
      
      if (error) {
        console.error('Supabaseからの同意履歴取得エラー:', error);
        return false;
      }
      
      if (data) {
        localStorage.setItem('consent_histories', JSON.stringify(data));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Supabaseからの同意履歴同期エラー:', error);
      return false;
    }
  }
};

// (user_id, date, event) が同じなら UPDATE／なければ INSERT
export const upsertDiaryEntries = async (entries: DiaryEntry[]) => {
  return supabase
    .from('diary_entries')
    .upsert(entries, { onConflict: 'user_id,date,event' });
};