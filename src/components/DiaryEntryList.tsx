import React, { useState } from 'react';
import { useDiaryEntries } from '../hooks/useDiaryEntries';
import { Eye, Edit3, Trash2, Calendar, User } from 'lucide-react';
import { supabase, fetchUnreadCount } from '../lib/supabase';
import useSWR from 'swr';

interface DiaryEntryListProps {
  onViewEntry?: (entry: any) => void;
  onEditEntry?: (entry: any) => void;
  onDeleteEntry?: (id: string) => void;
}

const DiaryEntryList: React.FC<DiaryEntryListProps> = ({
  onViewEntry,
  onEditEntry,
  onDeleteEntry
}) => {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const { entries, loading, error } = useDiaryEntries({ onlyUnread });

  // 未読件数バッジ
  const { data: unread = 0 } = useSWR('unread-count', async () => {
    try {
      // ユーザーIDを取得
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return 0;
      
      return await fetchUnreadCount(userData.user.id);
    } catch (error) {
      console.error('未読カウント取得エラー:', error);
      return 0;
    }
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-jp-normal">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-red-600 font-jp-medium">エラーが発生しました</p>
        <p className="text-red-500 font-jp-normal text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 font-jp-normal">日記がありません</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      '恐怖': 'bg-purple-100 text-purple-800 border-purple-200',
      '悲しみ': 'bg-blue-100 text-blue-800 border-blue-200',
      '怒り': 'bg-red-100 text-red-800 border-red-200',
      '悔しい': 'bg-green-100 text-green-800 border-green-200',
      '無価値感': 'bg-gray-100 text-gray-800 border-gray-300',
      '罪悪感': 'bg-orange-100 text-orange-800 border-orange-200',
      '寂しさ': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '恥ずかしさ': 'bg-pink-100 text-pink-800 border-pink-200',
      '嬉しい': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '感謝': 'bg-teal-100 text-teal-800 border-teal-200',
      '達成感': 'bg-lime-100 text-lime-800 border-lime-200',
      '幸せ': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    return colorMap[emotion] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        日記一覧
        {unread > 0 && (
          <span className="ml-1 inline-flex items-center justify-center
                          rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
            {unread}
          </span>
        )}
      </h2>

      {/* 未読フィルタトグル */}
      <label className="flex items-center gap-1 text-sm mb-3">
        <input type="checkbox" checked={onlyUnread}
               onChange={e => setOnlyUnread(e.target.checked)} />
        未読コメントのみ表示
      </label>

      {entries.map((entry) => (
        <div key={entry.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
             onClick={async () => {
               await supabase
                 .from('diary_entries')
                .update({ 
                  comment_read_at: new Date().toISOString() 
                })
                .eq('id', entry.id)
                .then(() => {
                  // 未読カウントを再取得
                  mutate('unread-count');
                });
             }}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-jp-medium border ${getEmotionColor(entry.emotion)}`}>
                {entry.emotion}
              </span>
              <span className="text-gray-500 text-xs font-jp-normal">
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatDate(entry.date)}
              </span>
            </div>
            <div className="flex space-x-2">
              {onViewEntry && (
                <button 
                  onClick={() => onViewEntry(entry)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                  title="詳細"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {onEditEntry && (
                <button 
                  onClick={() => onEditEntry(entry)}
                  className="text-green-600 hover:text-green-700 p-1"
                  title="編集"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDeleteEntry && (
                <button 
                  onClick={() => onDeleteEntry(entry.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">出来事</h4>
              <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words">
                {entry.event.length > 100 ? `${entry.event.substring(0, 100)}...` : entry.event}
              </p>
            </div>
            <div>
              <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">気づき</h4>
              <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words">
                {entry.realization && entry.realization.length > 100 ? `${entry.realization.substring(0, 100)}...` : entry.realization}
              </p>
            </div>
          </div>

          {/* カウンセラーコメント表示（表示設定がtrueの場合のみ） */}
          {entry.is_visible_to_user && entry.counselor_memo && (
            <div className={`rounded-lg p-3 border mb-3 ${
              !entry.comment_read_at ? 'bg-blue-100 border-blue-300' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-jp-medium text-blue-700 break-words">
                  {entry.counselor_name || 'カウンセラー'}からのコメント
                </span>
              </div>
              <p className="text-blue-800 text-sm font-jp-normal leading-relaxed break-words">
                {entry.counselor_memo}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              {/* NULL ガード：username が無い場合は "Unknown User" */}
              {entry.users?.line_username ?? 'Unknown User'}
            </div>
            {entry.assigned_counselor && (
              <div className="text-xs text-gray-500">
                担当: {entry.assigned_counselor}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiaryEntryList;