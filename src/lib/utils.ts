import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 日記データをSupabase形式に変換する関数
 * @param diaryEntry ローカルの日記データ
 * @param userId ユーザーID
 * @returns Supabase形式の日記データ
 */
export function formatDiaryForSupabase(diaryEntry: any, userId: string) {
  return {
    id: diaryEntry.id,
    user_id: diaryEntry.user_id || userId,
    date: diaryEntry.date,
    emotion: diaryEntry.emotion,
    event: diaryEntry.event,
    realization: diaryEntry.realization,
    self_esteem_score: diaryEntry.selfEsteemScore || 0,
    worthlessness_score: diaryEntry.worthlessnessScore || 0,
    counselor_memo: diaryEntry.counselor_memo || diaryEntry.counselorMemo || null,
    is_visible_to_user: diaryEntry.is_visible_to_user || diaryEntry.isVisibleToUser || false,
    counselor_name: diaryEntry.counselor_name || diaryEntry.counselorName || null,
    created_at: diaryEntry.created_at || new Date().toISOString()
  };
}

/**
 * Supabaseデータをローカル形式に変換する関数
 * @param supabaseEntry Supabaseの日記データ
 * @returns ローカル形式の日記データ
 */
export function formatDiaryForLocal(supabaseEntry: any) {
  return {
    id: supabaseEntry.id,
    user_id: supabaseEntry.user_id,
    date: supabaseEntry.date,
    emotion: supabaseEntry.emotion,
    event: supabaseEntry.event,
    realization: supabaseEntry.realization,
    selfEsteemScore: supabaseEntry.self_esteem_score || 0,
    worthlessnessScore: supabaseEntry.worthlessness_score || 0,
    counselor_memo: supabaseEntry.counselor_memo || null, 
    is_visible_to_user: supabaseEntry.is_visible_to_user || false, 
    counselor_name: supabaseEntry.counselor_name || null, 
    assigned_counselor: supabaseEntry.assigned_counselor || null, 
    urgency_level: supabaseEntry.urgency_level || null,
    created_at: supabaseEntry.created_at || new Date().toISOString(),
    user: supabaseEntry.users || { line_username: 'Unknown User' }
  };
}