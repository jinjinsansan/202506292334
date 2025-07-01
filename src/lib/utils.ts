import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
    self_esteem_score: diaryEntry.selfEsteemScore || diaryEntry.self_esteem_score || 0,
    worthlessness_score: diaryEntry.worthlessnessScore || diaryEntry.worthlessness_score || 0,
    created_at: diaryEntry.created_at || new Date().toISOString()
  };
  
  // assigned_counselorフィールドが存在する場合のみ追加
  if (diaryEntry.assigned_counselor !== undefined || diaryEntry.assignedCounselor !== undefined) {
    formattedEntry.assigned_counselor = diaryEntry.assigned_counselor !== undefined ? 
                                        diaryEntry.assigned_counselor : 
                                        diaryEntry.assignedCounselor;
  }
  
  // urgency_levelフィールドが存在する場合のみ追加
  if (diaryEntry.urgency_level !== undefined || diaryEntry.urgencyLevel !== undefined) {
    // 緊急度の値を取得
    let urgencyValue = diaryEntry.urgency_level !== undefined 
      ? diaryEntry.urgency_level 
      : diaryEntry.urgencyLevel || '';
    
    // 許可された値のみを設定（high, medium, low、または空文字列）
    if (urgencyValue !== 'high' && urgencyValue !== 'medium' && urgencyValue !== 'low' && urgencyValue !== '') {
      // 無効な値の場合は空文字列に設定
      console.warn(`無効な緊急度の値: ${urgencyValue}、空に設定します`);
      urgencyValue = '';
    }
    
    formattedEntry.urgency_level = urgencyValue;
      : diaryEntry.urgencyLevel || '';
    
    // 許可された値のみを設定（high, medium, low、または空文字列）
    if (urgencyValue !== 'high' && urgencyValue !== 'medium' && urgencyValue !== 'low' && urgencyValue !== '') {
      // 無効な値の場合は空文字列に設定
      console.warn(`無効な緊急度の値: ${urgencyValue}、空に設定します`);
      urgencyValue = '';
    }
    
    formattedEntry.urgency_level = urgencyValue;
      : diaryEntry.urgencyLevel || '';
    
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
  
  // is_visible_to_userフィールドが存在する場合のみ追加
  if (diaryEntry.is_visible_to_user !== undefined || diaryEntry.isVisibleToUser !== undefined) {
    formattedEntry.is_visible_to_user = diaryEntry.is_visible_to_user !== undefined ? 
                                        diaryEntry.is_visible_to_user : 
                                        diaryEntry.isVisibleToUser;
  }
  
  // counselor_nameフィールドが存在する場合のみ追加
  if (diaryEntry.counselor_name !== undefined || diaryEntry.counselorName !== undefined) {
    formattedEntry.counselor_name = diaryEntry.counselor_name !== undefined ? 
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