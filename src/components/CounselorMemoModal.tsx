import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CounselorMemoModalProps {
  diaryId: string;
  initialMemo?: string;
  initialVisibility?: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const CounselorMemoModal: React.FC<CounselorMemoModalProps> = ({
  diaryId,
  initialMemo = '',
  initialVisibility = false,
  onClose,
  onSave
}) => {
  const [memoText, setMemoText] = useState(initialMemo);
  const [isVisibleToUser, setIsVisibleToUser] = useState(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [counselorName, setCounselorName] = useState<string>('');

  useEffect(() => {
    // カウンセラー名を取得
    const currentCounselor = localStorage.getItem('current_counselor');
    if (currentCounselor) {
      setCounselorName(currentCounselor);
    }
  }, []);

  const handleSave = async () => {
    if (saving) return;
    
    setSaving(true);
    
    try {
      // 所有者列を除去してメモ関連だけ送る
      const payload = {
        counselor_memo: memoText,
        is_visible_to_user: isVisibleToUser,
        counselor_name: counselorName,
        counselor_id: null, // 現在のセッションIDがあれば設定
        counselor_updated_at: new Date().toISOString()
      };
      
      // Supabaseに保存（updateを使用）
      const { error } = await supabase
        .from('diary_entries')
        .update(payload)
        .eq('id', diaryId);
      const { error } = await supabase
        .from('diary_entries')
        .update(payload)
        .eq('id', diaryId);
        
      if (error) {
        throw error;
      } else {
        console.log('メモを保存しました');
        if (onSave) onSave();
        onClose();
      }
    } catch (error) {
      console.error('メモ保存中にエラーが発生しました:', error);
      alert('メモの保存中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-jp-bold text-gray-900">カウンセラーメモ</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                メモ内容
              </label>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal resize-none"
                placeholder="カウンセラーメモを入力..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVisibleToUser"
                checked={isVisibleToUser}
                onChange={(e) => setIsVisibleToUser(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isVisibleToUser" className="text-sm font-jp-medium text-gray-700 flex items-center space-x-2">
                <span>ユーザーに表示する</span>
                {isVisibleToUser ? (
                  <Eye className="w-4 h-4 text-blue-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </label>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-800 font-jp-normal">
                  <p className="font-jp-medium mb-1">メモの表示について</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>「ユーザーに表示する」をオンにすると、ユーザーの日記検索画面でメモが表示されます</li>
                    <li>オフの場合は、カウンセラーのみがこのメモを閲覧できます</li>
                    <li>メモの作成者名（{counselorName || 'カウンセラー'}）も表示されます</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-jp-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounselorMemoModal;