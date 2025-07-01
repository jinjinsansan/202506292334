import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, AlertTriangle, Tag, ChevronDown, ChevronUp, RotateCcw, Download, Eye, Trash2, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase'; 

interface SearchFilters {
  keyword: string;
  emotion: string;
  urgency: string;
  counselor: string;
  dateRange: {
    start: string;
    end: string;
  };
  userSearch: string;
  hasNotes: boolean | null;
  scoreRange: {
    selfEsteemMin: number;
    selfEsteemMax: number;
    worthlessnessMin: number;
    worthlessnessMax: number;
  };
}

interface JournalEntry {
  id: string;
  date: string;
  emotion: string;
  event: string;
  realization: string;
  self_esteem_score?: number;
  selfEsteemScore?: number;
  worthlessness_score?: number;
  worthlessnessScore?: number;
  created_at: string;
  user?: {
    line_username: string;
  };
  assigned_counselor?: string;
  assignedCounselor?: string;
  urgency_level?: 'high' | 'medium' | 'low';
  urgencyLevel?: 'high' | 'medium' | 'low';
  counselor_memo?: string;
  counselorMemo?: string;
  is_visible_to_user?: boolean;
  isVisibleToUser?: boolean;
  counselor_name?: string;
  counselorName?: string;
  syncStatus?: string;
}

interface AdvancedSearchFilterProps {
  entries: JournalEntry[];
  onFilteredResults: (filtered: JournalEntry[]) => void;
  onViewEntry: (entry: JournalEntry) => void; 
  onDeleteEntry?: (entryId: string) => void;
}

// ユーザー名を取得する関数
const getUserName = (entry: any): string => {
  // ユーザー情報がある場合はそれを使用
  if (entry.user && entry.user.line_username) {
    return entry.user.line_username;
  }
  // ローカルデータの場合
  return 'ユーザー';
};

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  entries,
  onFilteredResults,
  onViewEntry,
  onDeleteEntry
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    emotion: '',
    urgency: '',
    counselor: '',
    dateRange: {
      start: '',
      end: ''
    },
    userSearch: '',
    hasNotes: null,
    scoreRange: {
      selfEsteemMin: 1,
      selfEsteemMax: 10,
      worthlessnessMin: 1,
      worthlessnessMax: 10
    }
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // 全ての感情リスト
  const emotions = [
    // ネガティブな感情
    '恐怖', '悲しみ', '怒り', '悔しい', '無価値感', '罪悪感', '寂しさ', '恥ずかしさ',
    // ポジティブな感情
    '嬉しい', '感謝', '達成感', '幸せ'
  ];

  const urgencyLevels = [
    { value: 'high', label: '高', color: 'text-red-600' },
    { value: 'medium', label: '中', color: 'text-yellow-600' },
    { value: 'low', label: '低', color: 'text-green-600' }
  ];

  // 管理者モードの場合はSupabaseから検索
  const handleSearch = async () => {
    if (isAdminMode) {
      console.log('管理者モードで検索を実行します', supabase);
      setSearchLoading(true);
      searchAllDiaries();
    } else {
      filterEntries();
    }
  };

  // フィルタリング処理
  useEffect(() => {
    if (isAdminMode) return; // 管理者モードの場合はローカルフィルタリングをスキップ
    
    // エントリーが存在する場合のみフィルタリングを実行
    if (entries && entries.length > 0) {
      filterEntries();
    } else {
      setFilteredEntries([]);
    }
  }, [filters, entries, isAdminMode]);

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      keyword: '',
      emotion: '',
      urgency: '',
      counselor: '',
      dateRange: {
        start: '',
        end: ''
      },
      userSearch: '',
      hasNotes: null,
      scoreRange: {
        selfEsteemMin: 1,
        selfEsteemMax: 10,
        worthlessnessMin: 1,
        worthlessnessMax: 10
      }
    });
    setSupabaseError(null);
    if (!isAdminMode) {
      setFilteredEntries(entries);
      onFilteredResults(entries);
    }
  };

  // Supabaseから全ての日記を検索する関数
  const searchAllDiaries = async () => {
    try {
      setSupabaseError(null); 
      console.log('Supabaseから日記を検索します', supabase);
      
      if (!supabase) {
        console.error('Supabase接続がありません');
        setSupabaseError('データベース接続エラー');
        setSearchLoading(false);
        return;
      }

      let query = supabase
        .from('diary_entries')
        .select(`
          *,
          user:user_id (
            line_username
          )
        `)
        .order('created_at', { ascending: false });

      // フィルター条件を適用
      if (filters.keyword) {
        query = query.or(`event.ilike.%${filters.keyword}%,realization.ilike.%${filters.keyword}%`);
      }

      if (filters.emotion) {
        query = query.eq('emotion', filters.emotion);
      }

      if (filters.urgency) {
        query = query.eq('urgency_level', filters.urgency);
      }

      if (filters.dateRange.start) {
        query = query.gte('date', filters.dateRange.start);
      }

      if (filters.dateRange.end) {
        query = query.lte('date', filters.dateRange.end);
      }

      if (filters.counselor) {
        query = query.eq('assigned_counselor', filters.counselor);
      }

      if (filters.hasNotes !== null) {
        if (filters.hasNotes) {
          query = query.not('counselor_memo', 'is', null);
        } else {
          query = query.is('counselor_memo', null);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase検索エラー:', error);
        setSupabaseError(`検索エラー: ${error.message}`);
        setSearchLoading(false);
        return;
      }
      
      // 検索結果を処理して表示
      if (data && data.length > 0) {
        console.log(`Supabaseから${data.length}件の日記を取得しました`, data);
        const formattedResults = data.map(item => ({
          id: item.id,
          date: item.date,
          emotion: item.emotion,
          event: item.event,
          realization: item.realization,
          self_esteem_score: item.self_esteem_score,
          worthlessness_score: item.worthlessness_score,
          created_at: item.created_at,
          user: item.user,
          assigned_counselor: item.assigned_counselor,
          urgency_level: item.urgency_level,
          counselor_memo: item.counselor_memo,
          is_visible_to_user: item.is_visible_to_user,
          counselor_name: item.counselor_name
        }));
        
        setFilteredEntries(formattedResults);
        onFilteredResults(formattedResults);
      } else if (data) {
        console.log('検索結果が0件でした', data);
        setFilteredEntries([]);
        onFilteredResults([]);
      } else {
        console.log('検索結果が0件でした', data);
        setFilteredEntries([]);
        onFilteredResults([]);
      }
    } catch (error) {
      console.error('検索処理でエラーが発生しました:', error);
      setSupabaseError('検索処理でエラーが発生しました');
    } finally {
      setSearchLoading(false);
    }
  };

  // ローカルフィルタリング処理
  const filterEntries = () => {
    let filtered = [...entries];

    // キーワード検索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.event.toLowerCase().includes(keyword) ||
        entry.realization.toLowerCase().includes(keyword) ||
        entry.emotion.toLowerCase().includes(keyword)
      );
    }

    // 感情フィルター
    if (filters.emotion) {
      filtered = filtered.filter(entry => entry.emotion === filters.emotion);
    }

    // 緊急度フィルター
    if (filters.urgency) {
      filtered = filtered.filter(entry => 
        (entry.urgency_level || entry.urgencyLevel) === filters.urgency
      );
    }

    // カウンセラーフィルター
    if (filters.counselor) {
      filtered = filtered.filter(entry => 
        (entry.assigned_counselor || entry.assignedCounselor) === filters.counselor
      );
    }

    // 日付範囲フィルター
    if (filters.dateRange.start) {
      filtered = filtered.filter(entry => entry.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(entry => entry.date <= filters.dateRange.end);
    }

    // ユーザー検索
    if (filters.userSearch) {
      const userKeyword = filters.userSearch.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.user?.line_username?.toLowerCase().includes(userKeyword)
      );
    }

    // メモの有無フィルター
    if (filters.hasNotes !== null) {
      filtered = filtered.filter(entry => {
        const hasMemo = !!(entry.counselor_memo || entry.counselorMemo);
        return filters.hasNotes ? hasMemo : !hasMemo;
      });
    }

    // スコア範囲フィルター
    filtered = filtered.filter(entry => {
      const selfEsteemScore = entry.self_esteem_score || entry.selfEsteemScore;
      const worthlessnessScore = entry.worthlessness_score || entry.worthlessnessScore;
      
      if (selfEsteemScore !== undefined) {
        if (selfEsteemScore < filters.scoreRange.selfEsteemMin || 
            selfEsteemScore > filters.scoreRange.selfEsteemMax) {
          return false;
        }
      }
      
      if (worthlessnessScore !== undefined) {
        if (worthlessnessScore < filters.scoreRange.worthlessnessMin || 
            worthlessnessScore > filters.scoreRange.worthlessnessMax) {
          return false;
        }
      }
      
      return true;
    });

    setFilteredEntries(filtered);
    onFilteredResults(filtered);
  };

  // CSVエクスポート機能
  const exportToCSV = () => {
    const csvData = filteredEntries.map(entry => ({
      日付: entry.date,
      感情: entry.emotion,
      出来事: entry.event,
      気づき: entry.realization,
      自尊心スコア: entry.self_esteem_score || entry.selfEsteemScore || '',
      無価値感スコア: entry.worthlessness_score || entry.worthlessnessScore || '',
      緊急度: entry.urgency_level || entry.urgencyLevel || '',
      担当カウンセラー: entry.assigned_counselor || entry.assignedCounselor || '',
      カウンセラーメモ: entry.counselor_memo || entry.counselorMemo || '',
      ユーザー: entry.user?.line_username || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `journal_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 管理者モード切り替え */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAdminMode}
              onChange={(e) => setIsAdminMode(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">管理者モード（全データ検索）</span>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {isAdminMode ? '全データベース' : `${entries.length}件`}から検索
          </span>
        </div>
      </div>

      {/* エラー表示 */}
      {supabaseError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div className="mt-2 text-sm text-red-700">{supabaseError}</div>
            </div>
          </div>
        </div>
      )}

      {/* 基本検索 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2" />
            検索・フィルター
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            詳細フィルター
            {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* キーワード検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">キーワード</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
              placeholder="出来事や気づきを検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 感情フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">感情</label>
            <select
              value={filters.emotion}
              onChange={(e) => setFilters({...filters, emotion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべての感情</option>
              {emotions.map(emotion => (
                <option key={emotion} value={emotion}>{emotion}</option>
              ))}
            </select>
          </div>

          {/* 緊急度フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">緊急度</label>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters({...filters, urgency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {urgencyLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 詳細フィルター */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日付範囲 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: {...filters.dateRange, start: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: {...filters.dateRange, end: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ユーザー検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー検索</label>
              <input
                type="text"
                value={filters.userSearch}
                onChange={(e) => setFilters({...filters, userSearch: e.target.value})}
                placeholder="ユーザー名で検索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* カウンセラーメモの有無 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カウンセラーメモ</label>
              <select
                value={filters.hasNotes === null ? '' : filters.hasNotes.toString()}
                onChange={(e) => setFilters({
                  ...filters,
                  hasNotes: e.target.value === '' ? null : e.target.value === 'true'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="true">メモあり</option>
                <option value="false">メモなし</option>
              </select>
            </div>

            {/* スコア範囲 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自尊心スコア範囲: {filters.scoreRange.selfEsteemMin} - {filters.scoreRange.selfEsteemMax}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.selfEsteemMin}
                    onChange={(e) => setFilters({
                      ...filters,
                      scoreRange: {...filters.scoreRange, selfEsteemMin: parseInt(e.target.value)}
                    })}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.selfEsteemMax}
                    onChange={(e) => setFilters({
                      ...filters,
                      scoreRange: {...filters.scoreRange, selfEsteemMax: parseInt(e.target.value)}
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  無価値感スコア範囲: {filters.scoreRange.worthlessnessMin} - {filters.scoreRange.worthlessnessMax}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.worthlessnessMin}
                    onChange={(e) => setFilters({
                      ...filters,
                      scoreRange: {...filters.scoreRange, worthlessnessMin: parseInt(e.target.value)}
                    })}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.worthlessnessMax}
                    onChange={(e) => setFilters({
                      ...filters,
                      scoreRange: {...filters.scoreRange, worthlessnessMax: parseInt(e.target.value)}
                    })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {searchLoading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isAdminMode ? '検索' : 'フィルター適用'}
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              リセット
            </button>
            {filteredEntries.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV出力
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {filteredEntries.length}件の結果
          </div>
        </div>
      </div>

      {/* 検索結果 */}
      {filteredEntries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">検索結果</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-sm text-gray-500">{entry.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.emotion === '嬉しい' || entry.emotion === '感謝' || entry.emotion === '達成感' || entry.emotion === '幸せ'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.emotion}
                      </span>
                      {(entry.urgency_level || entry.urgencyLevel) && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (entry.urgency_level || entry.urgencyLevel) === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : (entry.urgency_level || entry.urgencyLevel) === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          緊急度: {urgencyLevels.find(l => l.value === (entry.urgency_level || entry.urgencyLevel))?.label}
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">出来事</h4>
                    <p className="text-gray-700 mb-2">{entry.event}</p>
                    <h4 className="font-medium text-gray-900 mb-1">気づき</h4>
                    <p className="text-gray-700 mb-2">{entry.realization}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {entry.user?.line_username && (
                        <span className="text-xs text-gray-500 font-jp-normal flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {getUserName(entry)}
                        </span>
                      )}
                      {(entry.self_esteem_score || entry.selfEsteemScore || entry.worthlessness_score || entry.worthlessnessScore) && (
                        <div className="flex items-center space-x-2">
                          {(entry.self_esteem_score || entry.selfEsteemScore) && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              自尊心: {entry.self_esteem_score || entry.selfEsteemScore}
                            </span>
                          )}
                          {(entry.worthlessness_score || entry.worthlessnessScore) && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              無価値感: {entry.worthlessness_score || entry.worthlessnessScore}
                            </span>
                          )}
                        </div>
                      )}
                      {(entry.counselor_memo || entry.counselorMemo) && (
                        <span className="flex items-center">
                          <Tag className="w-3 h-3 mr-1" />
                          メモあり
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onViewEntry(entry)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="詳細を見る"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onDeleteEntry && (
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 結果なしの場合 */}
      {!searchLoading && filteredEntries.length === 0 && (isAdminMode || entries.length > 0) && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">検索結果が見つかりません</h3>
          <p className="text-gray-500">検索条件を変更してもう一度お試しください。</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchFilter;