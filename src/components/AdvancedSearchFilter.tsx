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
  worthlessness_score?: number;
  created_at: string;
  user?: {
    line_username: string;
  };
  assigned_counselor?: string;
  urgency_level?: 'high' | 'medium' | 'low';
  counselor_memo?: string;
}

interface AdvancedSearchFilterProps {
  entries: JournalEntry[];
  onFilteredResults: (filtered: JournalEntry[]) => void;
  onViewEntry: (entry: JournalEntry) => void; 
  onDeleteEntry?: (entryId: string) => void;
}

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
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>(entries);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // 日記ページと同じ感情リスト
  const negativeEmotions = [
    { name: '恐怖', bgColor: 'bg-purple-50', textColor: 'text-purple-800' },
    { name: '悲しみ', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
    { name: '怒り', bgColor: 'bg-red-50', textColor: 'text-red-800' },
    { name: '悔しい', bgColor: 'bg-green-50', textColor: 'text-green-800' },
    { name: '無価値感', bgColor: 'bg-gray-50', textColor: 'text-gray-800' },
    { name: '罪悪感', bgColor: 'bg-orange-50', textColor: 'text-orange-800' },
    { name: '寂しさ', bgColor: 'bg-indigo-50', textColor: 'text-indigo-800' },
    { name: '恥ずかしさ', bgColor: 'bg-pink-50', textColor: 'text-pink-800' }
  ];
  
  const positiveEmotions = [
    { name: '嬉しい', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
    { name: '感謝', bgColor: 'bg-teal-50', textColor: 'text-teal-800' },
    { name: '達成感', bgColor: 'bg-lime-50', textColor: 'text-lime-800' },
    { name: '幸せ', bgColor: 'bg-amber-50', textColor: 'text-amber-800' }
  ];
  
  // 全ての感情を結合
  const emotions = [...negativeEmotions.map(e => e.name), ...positiveEmotions.map(e => e.name)];

  const urgencyLevels = [
    { value: 'high', label: '高', color: 'text-red-600' },
    { value: 'medium', label: '中', color: 'text-yellow-600' },
    { value: 'low', label: '低', color: 'text-green-600' },
  ];

  // Get unique values for filter options
  const uniqueEmotions = [...new Set(entries.map(entry => entry.emotion).filter(Boolean))];
  const uniqueCounselors = [...new Set(entries.map(entry => entry.assigned_counselor).filter(Boolean))];
  const uniqueUrgencyLevels = [...new Set(entries.map(entry => entry.urgency_level).filter(Boolean))];
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  const handleScoreRangeChange = (type: keyof SearchFilters['scoreRange'], value: number) => {
    setFilters(prev => ({
      ...prev,
      scoreRange: {
        ...prev.scoreRange,
        [type]: value
      }
    }));
  };

  // Supabaseから全ての日記を検索する関数
  const searchAllDiaries = async () => {
    try {
      let query = supabase
        .from('diary_entries')
        .select(`
          *,
          profiles:user_id (
            line_username
          )
        `);

      // フィルター条件を適用
      if (filters.keyword.trim()) {
        query = query.or(`event.ilike.%${filters.keyword}%,realization.ilike.%${filters.keyword}%,counselor_memo.ilike.%${filters.keyword}%`);
      }

      if (filters.emotion) {
        query = query.eq('emotion', filters.emotion);
      }

      if (filters.urgency) {
        query = query.eq('urgency_level', filters.urgency);
      }

      if (filters.counselor) {
        query = query.eq('assigned_counselor', filters.counselor);
      }

      if (filters.dateRange.start) {
        query = query.gte('date', filters.dateRange.start);
      }

      if (filters.dateRange.end) {
        query = query.lte('date', filters.dateRange.end);
      }

      if (filters.hasNotes !== null) {
        if (filters.hasNotes) {
          query = query.not('counselor_memo', 'is', null);
        } else {
          query = query.is('counselor_memo', null);
        }
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      // スコア範囲でフィルタリング（クライアントサイド）
      let filtered = data || [];
      filtered = filtered.filter(entry => {
        const selfEsteemScore = entry.self_esteem_score || 0;
        const worthlessnessScore = entry.worthlessness_score || 0;
        
        return selfEsteemScore >= filters.scoreRange.selfEsteemMin &&
               selfEsteemScore <= filters.scoreRange.selfEsteemMax &&
               worthlessnessScore >= filters.scoreRange.worthlessnessMin &&
               worthlessnessScore <= filters.scoreRange.worthlessnessMax;
      });

      // ユーザー検索（クライアントサイド）
      if (filters.userSearch.trim()) {
        const userKeyword = filters.userSearch.toLowerCase();
        filtered = filtered.filter(entry => 
          entry.profiles?.line_username?.toLowerCase().includes(userKeyword)
        );
      }

      // データ形式を統一
      const formattedEntries = filtered.map(entry => ({
        ...entry,
        user: entry.profiles ? { line_username: entry.profiles.line_username } : undefined
      }));

      setFilteredEntries(formattedEntries);
      onFilteredResults(formattedEntries);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  // ローカルフィルタリング処理
  const filterEntries = () => {
    let filtered = [...entries];

    // キーワード検索
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.event.toLowerCase().includes(keyword) ||
        entry.realization.toLowerCase().includes(keyword) ||
        (entry.counselor_memo && entry.counselor_memo.toLowerCase().includes(keyword))
      );
    }

    // 感情フィルター
    if (filters.emotion) {
      filtered = filtered.filter(entry => entry.emotion === filters.emotion);
    }

    // 緊急度フィルター
    if (filters.urgency) {
      filtered = filtered.filter(entry => entry.urgency_level === filters.urgency);
    }

    // カウンセラーフィルター
    if (filters.counselor) {
      filtered = filtered.filter(entry => entry.assigned_counselor === filters.counselor);
    }

    // ユーザー検索
    if (filters.userSearch.trim()) {
      const userKeyword = filters.userSearch.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.user?.line_username?.toLowerCase().includes(userKeyword)
      );
    }

    // 日付範囲フィルター
    if (filters.dateRange.start) {
      filtered = filtered.filter(entry => entry.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(entry => entry.date <= filters.dateRange.end);
    }

    // メモの有無フィルター
    if (filters.hasNotes !== null) {
      filtered = filtered.filter(entry => 
        filters.hasNotes ? !!entry.counselor_memo : !entry.counselor_memo
      );
    }

    // スコア範囲フィルター
    filtered = filtered.filter(entry => {
      const selfEsteemScore = entry.self_esteem_score || 0;
      const worthlessnessScore = entry.worthlessness_score || 0;
      
      return selfEsteemScore >= filters.scoreRange.selfEsteemMin &&
             selfEsteemScore <= filters.scoreRange.selfEsteemMax &&
             worthlessnessScore >= filters.scoreRange.worthlessnessMin &&
             worthlessnessScore <= filters.scoreRange.worthlessnessMax;
    });

    setFilteredEntries(filtered);
    onFilteredResults(filtered);
  };

  // 管理者モードの場合はSupabaseから検索
  const handleSearch = async () => {
    if (isAdminMode) {
      setSearchLoading(true);
      await searchAllDiaries();
    } else {
      filterEntries();
    }
  };

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      keyword: '',
      emotion: '',
      urgency: '',
      counselor: '',
      dateRange: { start: '', end: '' },
      userSearch: '',
      hasNotes: null,
      scoreRange: { selfEsteemMin: 1, selfEsteemMax: 10, worthlessnessMin: 1, worthlessnessMax: 10 }
    });
  };

  // フィルターが変更されたときに自動的にフィルタリングを実行
  useEffect(() => {
    if (!isAdminMode) {
      filterEntries();
    }
  };

  // 管理者モードの場合はSupabaseから検索
  const handleSearch = async () => {
    if (isAdminMode) {
      setSearchLoading(true);
      await searchAllDiaries();
    } else {
      filterEntries();
    }
  };

  // フィルターが変更されたときに自動的にフィルタリングを実行
  useEffect(() => {
    if (!isAdminMode) {
      filterEntries();
    }
  }, [filters, entries, isAdminMode]);

  // 検索結果のエクスポート
  const exportResults = () => {
    const csvContent = [
      ['日付', '感情', '出来事', '気づき', '自尊心スコア', '無価値感スコア', 'ユーザー', 'カウンセラー', '緊急度', 'メモ'].join(','),
      ...filteredEntries.map(entry => [
        entry.date,
        entry.emotion,
        `"${entry.event.replace(/"/g, '""')}"`,
        `"${entry.realization.replace(/"/g, '""')}"`,
        entry.self_esteem_score || '',
        entry.worthlessness_score || '',
        entry.user?.line_username || '',
        entry.assigned_counselor || '',
        entry.urgency_level || '',
        entry.counselor_memo ? `"${entry.counselor_memo.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ユニークなカウンセラーリストを取得
  const uniqueCounselors = [...new Set(entries.map(entry => entry.assigned_counselor).filter(Boolean))];

  // 感情に対応する背景色を取得
  const getEmotionBgColor = (emotion: string) => {
    const negEmotion = negativeEmotions.find(e => e.name === emotion);
    if (negEmotion) return negEmotion.bgColor;
    
    const posEmotion = positiveEmotions.find(e => e.name === emotion);
    if (posEmotion) return posEmotion.bgColor;
    
    return 'bg-white';
  };
  
  // 感情に対応するテキスト色を取得
  const getEmotionTextColor = (emotion: string) => {
    const negEmotion = negativeEmotions.find(e => e.name === emotion);
    if (negEmotion) return negEmotion.textColor;
    
    const posEmotion = positiveEmotions.find(e => e.name === emotion);
    if (posEmotion) return posEmotion.textColor;
    
    return 'text-gray-800';
  };

  const handleReset = () => {
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
    setFilteredEntries(entries);
    onFilteredResults(entries);
    setFilteredEntries(entries);
    onFilteredResults(entries);
  };

  const exportToCSV = () => {
    const headers = ['日付', '感情', '出来事', '気づき', '自尊心スコア', '無価値感スコア', 'ユーザー', 'カウンセラー', '緊急度', 'メモ'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.date,
        entry.emotion,
        `"${entry.event.replace(/"/g, '""')}"`,
        `"${entry.realization.replace(/"/g, '""')}"`,
        entry.self_esteem_score || '',
        entry.worthlessness_score || '',
        entry.user?.line_username || '',
        entry.assigned_counselor || '',
        entry.urgency_level || '',
        entry.counselor_memo ? `"${entry.counselor_memo.replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `journal_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setFilteredEntries(entries);
  }, [entries]);

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '-';
    }
  };

  // 感情に対応する背景色を取得
  const getEmotionBgColor = (emotion: string) => {
    const negEmotion = negativeEmotions.find(e => e.name === emotion);
    if (negEmotion) return negEmotion.bgColor;
    
    const posEmotion = positiveEmotions.find(e => e.name === emotion);
    if (posEmotion) return posEmotion.bgColor;
    
    return 'bg-white';
  };
  
  // 感情に対応するテキスト色を取得
  const getEmotionTextColor = (emotion: string) => {
    const negEmotion = negativeEmotions.find(e => e.name === emotion);
    if (negEmotion) return negEmotion.textColor;
    
    const posEmotion = positiveEmotions.find(e => e.name === emotion);
    if (posEmotion) return posEmotion.textColor;
    
    return 'text-gray-800';
  };
  }, [entries]);

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-jp-semibold text-gray-800 flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>高度検索・フィルター</span>
          </h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAdminMode}
                onChange={(e) => setIsAdminMode(e.target.checked)}
                className="rounded"
              />
              <span className="font-jp-medium">管理者モード</span>
            </label>
            <button
              onClick={handleSearch}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-jp-medium"
            >
              <Search className="w-4 h-4" />
              <span>検索</span>
            </button>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-jp-medium">詳細フィルター</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-jp-medium text-gray-700 mb-1">キーワード検索</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="出来事、気づき、メモから検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
            />
          </div>
          <div>
            <label className="block text-sm font-jp-medium text-gray-700 mb-1">感情</label>
            <select
              value={filters.emotion}
              onChange={(e) => handleFilterChange('emotion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
            >
              <option value="">すべて</option>
              {uniqueEmotions.map(emotion => (
                <option key={emotion} value={emotion}>{emotion}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-jp-medium text-gray-700 mb-1">ユーザー検索</label>
            <input
              type="text"
              value={filters.userSearch}
              onChange={(e) => handleFilterChange('userSearch', e.target.value)}
              placeholder="ユーザー名で検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-jp-medium text-gray-700 mb-1">緊急度</label>
                <select
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
                >
                  <option value="">すべて</option>
                  {uniqueUrgencyLevels.map(urgency => (
                    <option key={urgency} value={urgency}>{getUrgencyLabel(urgency)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-jp-medium text-gray-700 mb-1">担当カウンセラー</label>
                <select
                  value={filters.counselor}
                  onChange={(e) => handleFilterChange('counselor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
                >
                  <option value="">すべて</option>
                  {uniqueCounselors.map(counselor => (
                    <option key={counselor} value={counselor}>{counselor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-jp-medium text-gray-700 mb-1">開始日</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
                />
              </div>
              <div>
                <label className="block text-sm font-jp-medium text-gray-700 mb-1">終了日</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-jp-normal"
                />
              </div>
            </div>

            {/* Score Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-jp-medium text-gray-700 mb-2">自尊心スコア範囲</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.selfEsteemMin}
                    onChange={(e) => handleScoreRangeChange('selfEsteemMin', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-jp-normal text-gray-600 w-8">{filters.scoreRange.selfEsteemMin}</span>
                  <span className="text-sm font-jp-normal text-gray-400">-</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.selfEsteemMax}
                    onChange={(e) => handleScoreRangeChange('selfEsteemMax', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-jp-normal text-gray-600 w-8">{filters.scoreRange.selfEsteemMax}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-jp-medium text-gray-700 mb-2">無価値感スコア範囲</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.worthlessnessMin}
                    onChange={(e) => handleScoreRangeChange('worthlessnessMin', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-jp-normal text-gray-600 w-8">{filters.scoreRange.worthlessnessMin}</span>
                  <span className="text-sm font-jp-normal text-gray-400">-</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={filters.scoreRange.worthlessnessMax}
                    onChange={(e) => handleScoreRangeChange('worthlessnessMax', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-jp-normal text-gray-600 w-8">{filters.scoreRange.worthlessnessMax}</span>
                </div>
              </div>
            </div>

            {/* Has Notes Filter */}
            <div>
              <label className="block text-sm font-jp-medium text-gray-700 mb-2">カウンセラーメモ</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasNotes"
                    checked={filters.hasNotes === null}
                    onChange={() => handleFilterChange('hasNotes', null)}
                    className="mr-2"
                  />
                  <span className="text-sm font-jp-normal">すべて</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasNotes"
                    checked={filters.hasNotes === true}
                    onChange={() => handleFilterChange('hasNotes', true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-jp-normal">メモあり</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasNotes"
                    checked={filters.hasNotes === false}
                    onChange={() => handleFilterChange('hasNotes', false)}
                    className="mr-2"
                  />
                  <span className="text-sm font-jp-normal">メモなし</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm font-jp-normal text-gray-600">
            {searchLoading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                <span>検索中...</span>
              </div>
            ) : (
              <>
                <span>表示: {filteredEntries.length}件</span>
                <span>/ 全体: {entries.length}件</span>
                <button
                  onClick={handleSearch}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-jp-medium transition-colors flex items-center space-x-1"
      {/* Results */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${getEmotionBgColor(entry.emotion)} ${
            entry.emotion === '恐怖' ? 'bg-purple-50' :
            entry.emotion === '悲しみ' ? 'bg-blue-50' :
            entry.emotion === '怒り' ? 'bg-red-50' :
            entry.emotion === '悔しい' ? 'bg-green-50' :
            entry.emotion === '無価値感' ? 'bg-gray-50' :
            entry.emotion === '罪悪感' ? 'bg-orange-50' :
            entry.emotion === '寂しさ' ? 'bg-indigo-50' :
            entry.emotion === '恥ずかしさ' ? 'bg-pink-50' :
            entry.emotion === '嬉しい' ? 'bg-yellow-50' :
            entry.emotion === '感謝' ? 'bg-teal-50' :
            entry.emotion === '達成感' ? 'bg-lime-50' :
            entry.emotion === '幸せ' ? 'bg-amber-50' :
            'bg-white'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-jp-medium text-gray-700">{entry.date}</span>
                </div>
                {entry.user?.line_username && (
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-jp-normal text-gray-600">{entry.user.line_username}</span>
                  </div>
                )}
                {entry.urgency_level && (
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                    <span className={`text-xs px-2 py-1 rounded-full font-jp-medium ${getUrgencyColor(entry.urgency_level)}`}>
                      {getUrgencyLabel(entry.urgency_level)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onViewEntry(entry)}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="詳細表示"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {onDeleteEntry && (
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-jp-medium text-gray-700">感情:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-jp-medium">
                  <span className={getEmotionTextColor(entry.emotion)}>{entry.emotion}</span>
                </span>
              </div>
              
              <div>
                <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">出来事</h4>
                <p className="text-gray-600 text-sm font-jp-normal">
                  {entry.event.length > 100 ? `${entry.event.substring(0, 100)}...` : entry.event}
                </p>
              </div>

              <div>
                <h4 className="font-jp-semibold text-gray-700 mb-1 text-sm">気づき</h4>
                <p className="text-gray-600 text-sm font-jp-normal">
                  {entry.realization.length > 100 ? `${entry.realization.substring(0, 100)}...` : entry.realization}
                </p>
              </div>

              {(entry.self_esteem_score || entry.worthlessness_score) && (
                <div className="flex items-center space-x-4 text-sm">
                  {entry.self_esteem_score && (
                    <span className="font-jp-normal text-gray-600">
                      自尊心: <span className="font-jp-semibold">{entry.self_esteem_score}/10</span>
                    </span>
                  )}
                  {entry.worthlessness_score && (
                    <span className="font-jp-normal text-gray-600">
                      無価値感: <span className="font-jp-semibold">{entry.worthlessness_score}/10</span>
                    </span>
                  )}
                </div>
              )}

              {entry.assigned_counselor && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-jp-medium text-gray-700">担当:</span>
                  <span className="text-sm font-jp-normal text-gray-600">{entry.assigned_counselor}</span>
                </div>
              )}

              {/* カウンセラーメモ */}
              {(entry.counselor_memo || entry.counselorMemo) && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 mb-3">
                  <h4 className="font-jp-semibold text-gray-700 mb-1 text-xs">カウンセラーメモ</h4>
                  <p className="text-gray-600 text-xs font-jp-normal">
                    {(entry.counselor_memo || entry.counselorMemo || '').length > 100 
                      ? `${(entry.counselor_memo || entry.counselorMemo || '').substring(0, 100)}...` 
                      : (entry.counselor_memo || entry.counselorMemo || '')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && !searchLoading && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-jp-normal">検索条件に一致するエントリーが見つかりませんでした。</p>
          </div>
        )}
      </div>
    </div>
  );
};

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm font-jp-normal text-gray-600">
            {searchLoading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                <span>検索中...</span>
              </div>
            ) : (
              <>
                <span>表示: {filteredEntries.length}件</span>
                <span>/ 全体: {entries.length}件</span>
                <button
                  onClick={handleSearch}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-jp-medium transition-colors flex items-center space-x-1"
                >
                  <Search className="w-3 h-3" />
                  <span>検索</span>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-jp-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>リセット</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-50 transition-colors text-sm font-jp-medium"
            >
              <Download className="w-3 h-3" />
              <span>CSV出力</span>
            </button>