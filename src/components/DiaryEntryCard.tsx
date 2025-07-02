import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  emotion: string;
  event: string;
  realization: string;
  selfEsteemScore?: number;
  worthlessnessScore?: number;
  counselor_memo?: string;
  is_visible_to_user?: boolean;
  counselor_name?: string;
  isVisibleToUser?: boolean;
  counselorMemo?: string;
  counselorName?: string;
  assigned_counselor?: string;
  assignedCounselor?: string;
  urgency_level?: string;
  urgencyLevel?: string;
  syncStatus?: string;
  user?: {
    line_username: string;
  };
}

interface DiaryEntryCardProps {
  entry: JournalEntry;
  onViewEntry?: (entry: JournalEntry) => void;
  onEditEntry?: (entry: JournalEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({
  entry,
  onViewEntry,
  onEditEntry,
  onDeleteEntry
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString || '日付なし';
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${month}月${day}日 (${dayOfWeek})`;
  };

  const getEmotionColor = (emotion: string) => {
    const colorMap: { [key: string]: string } = {
      // ネガティブな感情
      '恐怖': 'bg-purple-100 text-purple-800 border-purple-200',
      '悲しみ': 'bg-blue-100 text-blue-800 border-blue-200',
      '怒り': 'bg-red-100 text-red-800 border-red-200',
      '悔しい': 'bg-green-100 text-green-800 border-green-200',
      '無価値感': 'bg-gray-100 text-gray-800 border-gray-300',
      '罪悪感': 'bg-orange-100 text-orange-800 border-orange-200',
      '寂しさ': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '恥ずかしさ': 'bg-pink-100 text-pink-800 border-pink-200',
      // ポジティブな感情
      '嬉しい': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '感謝': 'bg-teal-100 text-teal-800 border-teal-200',
      '達成感': 'bg-lime-100 text-lime-800 border-lime-200',
      '幸せ': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    return colorMap[emotion] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyLevelColor = (level: string) => {
    const colorMap: { [key: string]: string } = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUrgencyLevelText = (level: string) => {
    const textMap: { [key: string]: string } = {
      'high': '高',
      'medium': '中',
      'low': '低'
    };
    return textMap[level] || '未設定';
  };

  const getCardBgColor = () => {
    switch (entry.emotion) {
      case '恐怖': return 'bg-purple-50';
      case '悲しみ': return 'bg-blue-50';
      case '怒り': return 'bg-red-50';
      case '悔しい': return 'bg-green-50';
      case '無価値感': return 'bg-gray-50';
      case '罪悪感': return 'bg-orange-50';
      case '寂しさ': return 'bg-indigo-50';
      case '恥ずかしさ': return 'bg-pink-50';
      case '嬉しい': return 'bg-yellow-50';
      case '感謝': return 'bg-teal-50';
      case '達成感': return 'bg-lime-50';
      case '幸せ': return 'bg-amber-50';
      default: return 'bg-white';
    }
  };

  return (
    <div className={`diary-card ${getCardBgColor()}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
          <span className={`px-2 py-1 rounded-full text-xs font-jp-medium border ${getEmotionColor(entry.emotion)}`}>
            {entry.emotion}
          </span>
          <span className="text-gray-500 text-xs sm:text-sm font-jp-normal">
            {formatDate(entry.date)}
          </span>
          {entry.syncStatus && (
            <span className={`px-2 py-1 rounded-full text-xs font-jp-medium ${
              entry.syncStatus === 'supabase' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {entry.syncStatus === 'supabase' ? 'Supabase' : 'ローカル'}
            </span>
          )}
          {(entry.urgency_level || entry.urgencyLevel) && (
            <span className={`px-2 py-1 rounded-full text-xs font-jp-medium ${
              getUrgencyLevelColor(entry.urgency_level || entry.urgencyLevel || '')
            }`}>
              {getUrgencyLevelText(entry.urgency_level || entry.urgencyLevel || '')}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {entry.user?.line_username && (
            <span className="text-xs text-gray-500 font-jp-normal">
              {entry.user.line_username}
            </span>
          )}
          <div className="flex items-center space-x-1">
            {onViewEntry && (
              <button
                onClick={() => onViewEntry(entry)}
                className="text-blue-600 hover:text-blue-700 p-1 cursor-pointer"
                title="詳細を見る"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEditEntry && (
              <button
                onClick={() => onEditEntry(entry)}
                className="text-green-600 hover:text-green-700 p-1 cursor-pointer"
                title="編集"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDeleteEntry && (
              <button
                onClick={() => onDeleteEntry(entry.id)}
                className="text-red-600 hover:text-red-700 p-1 cursor-pointer"
                title="削除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">出来事</h4>
          <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words line-clamp-3">
            {entry.event}
          </p>
        </div>
        <div>
          <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">気づき</h4>
          <p className="text-gray-600 text-xs sm:text-sm font-jp-normal leading-relaxed break-words line-clamp-3">
            {entry.realization}
          </p>
        </div>
      </div>

      {/* カウンセラーコメント */}
      {((entry.is_visible_to_user || entry.isVisibleToUser) && (entry.counselor_memo || entry.counselorMemo)) && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-3 overflow-hidden">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-jp-medium text-blue-700 break-words line-clamp-1">
              {entry.counselor_name || entry.counselorName || 'カウンセラー'}からのコメント
            </span>
          </div>
          <p className="text-blue-800 text-sm font-jp-normal leading-relaxed break-words line-clamp-3">
            {entry.counselor_memo || entry.counselorMemo}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {(entry.assignedCounselor || entry.assigned_counselor) ?
            `担当: ${entry.assignedCounselor || entry.assigned_counselor}` :
            '未割り当て'}
        </div>
        {(entry.emotion === '無価値感' || 
          entry.emotion === '嬉しい' || 
          entry.emotion === '感謝' || 
          entry.emotion === '達成感' || 
          entry.emotion === '幸せ') && (
          <div className="flex flex-wrap gap-2 sm:gap-6 text-xs bg-white rounded-lg p-2 border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-jp-medium">自己肯定感:</span>
              <span className="font-jp-semibold text-blue-600">
                {entry.selfEsteemScore || entry.self_esteem_score || 50}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 font-jp-medium">無価値感:</span>
              <span className="font-jp-semibold text-red-600">
                {entry.worthlessnessScore || entry.worthlessness_score || 50}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryEntryCard;