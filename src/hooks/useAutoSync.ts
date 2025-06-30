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
          // 必須フィールドのみを含める
          const formattedEntry = {
            id: entry.id,
            user_id: userId,
            date: entry.date,
            emotion: entry.emotion,
            event: entry.event || '',
            realization: entry.realization || '',
            self_esteem_score: typeof entry.selfEsteemScore === 'number' ? entry.selfEsteemScore : 
                             (typeof entry.selfEsteemScore === 'string' ? parseInt(entry.selfEsteemScore) : 0),
            worthlessness_score: typeof entry.worthlessnessScore === 'number' ? entry.worthlessnessScore : 
                               (typeof entry.worthlessnessScore === 'string' ? parseInt(entry.worthlessnessScore) : 0),
            created_at: entry.created_at || new Date().toISOString()
          };
          
          // assigned_counselorフィールドが存在する場合のみ追加
          if (entry.assigned_counselor || entry.assignedCounselor) {
            formattedEntry.assigned_counselor = entry.assigned_counselor || entry.assignedCounselor;
          }
          
          // urgency_levelフィールドが存在する場合のみ追加
          if (entry.urgency_level || entry.urgencyLevel) {
            formattedEntry.urgency_level = entry.urgency_level || entry.urgencyLevel;
          }
          
          // is_visible_to_userフィールドが存在する場合のみ追加
          if (entry.is_visible_to_user !== undefined || entry.isVisibleToUser !== undefined) {
            formattedEntry.is_visible_to_user = entry.is_visible_to_user || entry.isVisibleToUser || false;
          }
          
          // counselor_nameフィールドが存在する場合のみ追加
          if (entry.counselor_name || entry.counselorName) {
            formattedEntry.counselor_name = entry.counselor_name || entry.counselorName;
          }
          
          return formattedEntry;
        });
      
      // 日記データを同期
      const { success, error } = await diaryService.syncDiaries(userId, formattedEntries);
      
      if (!success) {
        throw new Error(error || '日記の同期に失敗しました');
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
    triggerManualSync
  };
};