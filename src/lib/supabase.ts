import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = 'https://afojjlfuwglzukzinpzx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmb2pqbGZ1d2dsenVremlucHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDc4MzEsImV4cCI6MjA2NjE4MzgzMX0.ovSwuxvBL5gHtW4XdDkipz9QxWL_njAkr7VQgy1uVRY';
const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true';

// Supabaseクライアントの作成（ローカルモードでない場合のみ）
export const supabase = !isLocalMode && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ユーザーサービス
export const userService = {
  // ユーザーの作成または取得
  async createOrGetUser(lineUsername: string) {
    if (!supabase) return null;
    
    try {
      // 既存ユーザーの検索
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('line_username', lineUsername)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('ユーザー検索エラー:', searchError);
        return null;
      }
      
      // 既存ユーザーが見つかった場合
      if (existingUser) {
        return existingUser;
      }
      
      // 新規ユーザーの作成
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ line_username: lineUsername }])
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

    try {
      // 日記データの整形
      const formattedDiaries = diaries.map(diary => {
        // IDを文字列からUUIDに変換する必要がある場合の対応
        const diaryId = diary.id;
        
        return {
          id: diaryId,
          user_id: userId,
          date: diary.date,
          emotion: diary.emotion,
          event: diary.event,
          realization: diary.realization,
          self_esteem_score: diary.selfEsteemScore || 0,
          worthlessness_score: diary.worthlessnessScore || 0,
          counselor_memo: diary.counselor_memo || null,
          is_visible_to_user: diary.is_visible_to_user || false,
          counselor_name: diary.counselor_name || null,
          assigned_counselor: diary.assigned_counselor || null,
          urgency_level: diary.urgency_level || null
        };
      });
      
      console.log('同期する日記データ:', formattedDiaries);
      
      // 一括挿入（競合時は更新）
      const { data, error } = await supabase
        .from('diary_entries')
        .upsert(formattedDiaries, {
          onConflict: 'id',
          ignoreDuplicates: false,
          returning: 'minimal'
        });
      
      if (error) {
        console.error('日記同期エラー:', error);
        return { success: false, error: error.message };
      }
      
      console.log('日記同期成功:', formattedDiaries.length, '件');
      return { success: true, data };
    } catch (error) {
      console.error('日記同期サービスエラー:', error);
      return { success: false, error: String(error) };
    }
  },
  
  // ユーザーの日記を取得
  async getUserDiaries(userId: string) {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('日記取得エラー:', error);
        return [];
      }
      
      return data || [];
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