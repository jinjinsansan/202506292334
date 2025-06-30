import { useState, useEffect, useCallback } from 'react';
import { supabase, userService, diaryService } from '../lib/supabase';
import { getCurrentUser } from '../lib/deviceAuth';
import { formatDiaryForSupabase } from '../lib/utils';

interface AutoSyncState {
  isAutoSyncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
  currentUser: any | null;
  triggerManualSync: () => Promise<boolean>;
  syncDeleteDiary: (diaryId: string) => Promise<boolean>;
  syncBulkDeleteDiaries: (diaryIds: string[]) => Promise<boolean>;
}

export const useAutoSync = (): AutoSyncState => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('last_sync_time'));
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  // 自動同期設定の読み込み
  useEffect(() => {
    const autoSyncSetting = localStorage.getItem('auto_sync_enabled');
    setIsAutoSyncEnabled(autoSyncSetting !== 'false'); // デフォルトはtrue
    
    // 最後の同期時間を読み込み
    const savedLastSyncTime = localStorage.getItem('last_sync_time');
    if (savedLastSyncTime) {
      setLastSyncTime(savedLastSyncTime);
    }
  }, []);
  
  // ユーザー情報の初期化
  useEffect(() => {
    initializeUser();
    
    // アプリ起動時に自動的に同期を実行（少し遅延させる）
    setTimeout(() => {
      if (isAutoSyncEnabled && !isSyncing) {
        syncData().catch(error => {
          console.error('初期同期エラー:', error);
        });
      }
    }, 3000);
  }, []);
  
  // 自動同期の設定
  useEffect(() => {
    if (!isAutoSyncEnabled || !supabase) return;
    
    // 5分ごとに自動同期を実行
    const interval = setInterval(() => {
      if (!isSyncing) {
        syncData();
      }
    }, 5 * 60 * 1000); // 5分 = 300,000ミリ秒
    
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, isSyncing]);
  
  // ユーザー情報の初期化
  const initializeUser = useCallback(async () => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、同期は無効');
      // ローカルモードでも、ユーザー名が設定されていれば現在のユーザーとして扱う
      const lineUsername = localStorage.getItem('line-username');
      if (lineUsername) {
        setCurrentUser({ id: 'local-user', line_username: lineUsername });
      }
      return;
    }
    
    try {
      // 現在のユーザーを取得
      const user = getCurrentUser();
      // ユーザー情報がない場合はローカルストレージから取得
      const lineUsername = user?.lineUsername || localStorage.getItem('line-username');
      
      if (!lineUsername || lineUsername.trim() === '') {
        console.error('ユーザーがログインしていないか、ユーザー名がありません');
        setError('ユーザー名が設定されていません');
        return null;
      }
      
      // Supabaseでユーザーを作成または取得
      const supabaseUser = await userService.createOrGetUser(lineUsername);
      if (supabaseUser) {
        setCurrentUser(supabaseUser);
        console.log('ユーザー初期化完了:', supabaseUser.line_username, 'ID:', supabaseUser.id);
        return supabaseUser;
      }
      return null;
    } catch (error) {
      console.error('ユーザー初期化エラー:', error);
      setError('ユーザー初期化に失敗しました');
      return null;
    }
  }, []);
  
  // データ同期処理
  const syncData = useCallback(async (): Promise<boolean> => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、同期をスキップします');
      return false;
    }
    
    if (isSyncing) {
      console.log('既に同期中です');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // 現在のユーザーを取得
      const user = getCurrentUser();
      // ユーザー情報がない場合はローカルストレージから取得
      const lineUsername = user?.lineUsername || localStorage.getItem('line-username') || 'Unknown User';
      
      if (!lineUsername || lineUsername === 'Unknown User') {
        console.warn('ユーザー名が設定されていないか、デフォルト値です');
      }
      
      console.log('同期を開始します。ユーザー:', lineUsername);
      
      // ユーザーIDを取得
      let userId = currentUser?.id;
      
      // ユーザーIDがない場合は初期化
      if (!userId) {
        const supabaseUser = await userService.createOrGetUser(lineUsername);
        if (!supabaseUser) {
          console.error('ユーザーの作成に失敗しました');
          setError('ユーザーの作成に失敗しました');
          return false;
        }
        
        userId = supabaseUser.id;
        console.log('新しいユーザーを作成/取得しました:', lineUsername, 'ID:', userId);
        setCurrentUser(supabaseUser);
      }
      
      // UUIDの形式を検証
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('無効なユーザーID形式:', userId);
        
        // 無効なユーザーIDの場合は、新しいユーザーを作成して再試行
        try {
          console.log('無効なユーザーIDを検出。新しいユーザーを作成します...');
          const newUser = await userService.createOrGetUser(lineUsername);
          if (!newUser || !newUser.id) {
            setError('新しいユーザーの作成に失敗しました');
            return false;
          }
          
          userId = newUser.id;
          setCurrentUser(newUser);
          console.log('新しいユーザーを作成しました:', lineUsername, 'ID:', userId);
        } catch (error) {
          console.error('ユーザー作成エラー:', error);
          setError('ユーザー作成に失敗しました');
          return false;
        }
      }
      
      // ローカルストレージから日記データを取得
      const savedEntries = localStorage.getItem('journalEntries');
      if (!savedEntries) {
        console.log('同期する日記データがありません');
        setLastSyncTime(new Date().toISOString());
        localStorage.setItem('last_sync_time', new Date().toISOString());
        return true;
      }
      
      let entries;
      try {
        entries = JSON.parse(savedEntries);
        if (!Array.isArray(entries)) {
          console.error('日記データが配列ではありません:', entries);
          setError('日記データの形式が正しくありません');
          return false;
        }
      } catch (parseError) {
        console.error('日記データの解析エラー:', parseError);
        setError('日記データの解析に失敗しました');
        return false;
      }
      
      // 空の配列の場合は同期をスキップ
      if (!entries || entries.length === 0) {
        console.log('同期する日記データがありません');
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('last_sync_time', now);
        return true;
      }
      
      console.log('同期する日記データ:', entries.length, '件', 'ユーザーID:', userId);

      // 各エントリーをSupabase形式に変換
      const formattedEntries = entries
        .filter((entry: any) => entry && entry.id && entry.date && entry.emotion) // 無効なデータをフィルタリング
        .map((entry: any) => {          
          // UUIDの形式を検証し、無効な場合は新しいUUIDを生成
          let entryId = entry.id;
          if (!uuidRegex.test(entryId)) {
            try {
              // crypto.randomUUID()が利用可能な場合はそれを使用
              if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                entryId = crypto.randomUUID();
              } else {
                // 代替の方法でUUIDを生成
                entryId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
              }
              console.log(`無効なID "${entry.id}" を新しいID "${entryId}" に置き換えました`);
            } catch (error) {
              console.error('UUID生成エラー:', error);
              // エラーが発生した場合は元のIDを使用
              entryId = entry.id;
            }
          }
          
          // 必須フィールドのみを含める
          const formattedEntry = {
            id: entryId,
            user_id: userId,
            date: entry.date,
            emotion: entry.emotion,
            event: entry.event || '',
            realization: entry.realization || '',
            self_esteem_score: typeof entry.selfEsteemScore === 'number'
              ? entry.selfEsteemScore
              : (typeof entry.selfEsteemScore === 'string' ? parseInt(entry.selfEsteemScore)
                 : (typeof entry.self_esteem_score === 'number' ? entry.self_esteem_score
                    : (typeof entry.self_esteem_score === 'string' ? parseInt(entry.self_esteem_score) : 50))),
            worthlessness_score: typeof entry.worthlessnessScore === 'number'
              ? entry.worthlessnessScore
              : (typeof entry.worthlessnessScore === 'string' ? parseInt(entry.worthlessnessScore)
                 : (typeof entry.worthlessness_score === 'number' ? entry.worthlessness_score
                    : (typeof entry.worthlessness_score === 'string' ? parseInt(entry.worthlessness_score) : 50))),
            created_at: entry.created_at || new Date().toISOString(),
          }
          const optionalFields: Record<string, any> = {};
          
          // assigned_counselor
          if (entry.assigned_counselor !== undefined) {
            optionalFields.assigned_counselor = entry.assigned_counselor;
          } else if (entry.assignedCounselor !== undefined) {
            optionalFields.assigned_counselor = entry.assignedCounselor;
          }
          
          // urgency_level
          if (entry.urgency_level !== undefined) {
            optionalFields.urgency_level = entry.urgency_level;
          } else if (entry.urgencyLevel !== undefined) {
            optionalFields.urgency_level = entry.urgencyLevel;
          }
          
          // is_visible_to_user
          if (entry.is_visible_to_user !== undefined) {
            optionalFields.is_visible_to_user = entry.is_visible_to_user;
          } else if (entry.isVisibleToUser !== undefined) {
            optionalFields.is_visible_to_user = entry.isVisibleToUser;
          }
          
          // counselor_name
          if (entry.counselor_name !== undefined) {
            optionalFields.counselor_name = entry.counselor_name;
          } else if (entry.counselorName !== undefined) {
            optionalFields.counselor_name = entry.counselorName;
          }
          
          // counselor_memo
          if (entry.counselor_memo !== undefined) {
            optionalFields.counselor_memo = entry.counselor_memo;
          } else if (entry.counselorMemo !== undefined) {
            optionalFields.counselor_memo = entry.counselorMemo;
          }
          
          // 値が存在するフィールドのみを追加
          for (const [key, value] of Object.entries(optionalFields)) {
            formattedEntry[key] = value;
          }
          return formattedEntry;
        });
      
      // 日記データを同期
      const { success, error } = await diaryService.syncDiaries(userId, formattedEntries);
      
      // 同期結果をログに出力
      console.log('同期結果:', success ? '成功' : '失敗', error || '');
      
      if (!success) {
        console.error('同期エラー:', error);
        throw new Error(error);
      }
      
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);
      
      console.log('データ同期完了:', entries.length, '件', 'ユーザーID:', userId, '時刻:', now);
      return true;
    } catch (err) {
      console.error('データ同期エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラー');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, currentUser]);
  
  // 日記削除時の同期処理
  const syncDeleteDiary = useCallback(async (diaryId: string): Promise<boolean> => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、削除同期をスキップします', diaryId);
      return true; // ローカルモードでは成功とみなす
    }
    
    if (isSyncing) {
      console.log('既に同期中です、削除同期をスキップします');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // Supabaseから日記を削除
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', diaryId);
      
      if (error) {
        console.error('Supabase日記削除エラー:', error, 'ID:', diaryId);
        // エラーがあっても処理を続行（ローカルでは削除されている）
        return false;
      }
      
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);

      console.log('日記削除同期完了:', diaryId, '時刻:', now);
      return true;
    } catch (err) {
      console.error('日記削除同期エラー:', err);
      // エラーがあっても処理を続行（ローカルでは削除されている）
      return true;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);
  
  // 複数日記削除時の同期処理
  const syncBulkDeleteDiaries = useCallback(async (diaryIds: string[]): Promise<boolean> => {
    if (!supabase) {
      console.log('ローカルモードで動作中: Supabase接続なし、一括削除同期をスキップします', diaryIds.length);
      return true; // ローカルモードでは成功とみなす
    }
    
    if (isSyncing) {
      console.log('既に同期中です、一括削除同期をスキップします');
      return false;
    }
    
    if (!diaryIds || diaryIds.length === 0) {
      console.log('削除する日記IDがありません');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // 一括削除（100件ずつに分割して実行）
      const chunkSize = 100;
      let success = true;
      let deletedCount = 0;
      
      for (let i = 0; i < diaryIds.length; i += chunkSize) {
        const chunk = diaryIds.slice(i, i + chunkSize);
        try {
          const { error } = await supabase
            .from('diary_entries')
            .delete()
            .in('id', chunk);
          
          if (error) {
            console.error(`日記の一括削除エラー (${i}~${i+chunk.length})`, error, 'IDs:', chunk);
            // エラーがあっても処理を続行
          } else {
            deletedCount += chunk.length;
          }
        } catch (err) {
          console.error(`日記の一括削除中にエラー (${i}~${i+chunk.length})`, err, 'IDs:', chunk);
          // エラーがあっても処理を続行
        }
      }
      
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);
      
      console.log('一括削除同期完了:', deletedCount, '/', diaryIds.length, '件', '時刻:', now);
      return success;
    } catch (err) {
      console.error('一括削除同期エラー:', err);
      // エラーがあっても処理を続行（ローカルでは削除されている）
      return true;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);
  
  // 手動同期のトリガー
  const triggerManualSync = useCallback(async (): Promise<boolean> => {
    return await syncData();
  }, [syncData]);
  
  return {
    isAutoSyncEnabled,
    isSyncing,
    lastSyncTime,
    error,
    currentUser,
    triggerManualSync,
    syncDeleteDiary,
    syncBulkDeleteDiaries
  };
};