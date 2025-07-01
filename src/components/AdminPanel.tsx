import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar, Search, Filter, RefreshCw, User, Shield, Database, Download, Trash2, Eye, Edit3, AlertTriangle, CheckCircle, Clock, MessageCircle, Users, BookOpen, BarChart2, Settings, Save, FileText, Layers } from 'lucide-react';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import CounselorManagement from './CounselorManagement';
import CounselorChat from './CounselorChat';
import ConsentHistoryManagement from './ConsentHistoryManagement';
import DeviceAuthManagement from './DeviceAuthManagement';
import SecurityDashboard from './SecurityDashboard';
import DataCleanup from './DataCleanup';
import CalendarSearch from './CalendarSearch';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    counselorMemo: '',
    isVisibleToUser: false,
    assignedCounselor: '',
    urgencyLevel: ''
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      // Supabaseから直接日記データを取得
      if (supabase) {
        try {
          const { data: diaryData, error } = await supabase
            .from('diary_entries')
            .select(`
              *,
              users (
                line_username
              )
            `)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Supabaseからの日記データ取得エラー:', error);
          } else if (diaryData && diaryData.length > 0) {
            console.log('Supabaseから日記データを取得しました:', diaryData.length, '件');
            
            // データをフォーマット
            const formattedEntries = diaryData.map(item => {
              // 重複チェック用のキーを作成
              const key = `${item.date}_${item.emotion}_${item.event?.substring(0, 50)}`;

              return {
                id: item.id,
                date: item.date,
                emotion: item.emotion,
                event: item.event || '',
                realization: item.realization || '',
                selfEsteemScore: item.self_esteem_score || 0,
                worthlessnessScore: item.worthlessness_score || 0,
                created_at: item.created_at,
                user: item.users,
                counselorMemo: item.counselor_memo || '',
                isVisibleToUser: item.is_visible_to_user || false,
                counselorName: item.counselor_name || '',
                assignedCounselor: item.assigned_counselor || '',
                urgencyLevel: item.urgency_level || '',
                syncStatus: 'supabase', // Supabaseから取得したデータ
                _key: key // 重複チェック用のキー
              };
            });
            
            // 重複を除外
            const uniqueMap = new Map();
            const uniqueEntries = [];
            
            for (const entry of formattedEntries) {
              if (!uniqueMap.has(entry._key)) {
                uniqueMap.set(entry._key, entry);
                uniqueEntries.push(entry);
              }
            }
            
            console.log(`重複を除外: ${formattedEntries.length} → ${uniqueEntries.length}`);
            
            setEntries(uniqueEntries);
            setFilteredEntries(uniqueEntries);
            return;
          }
        } catch (supabaseError) {
          console.error('Supabase接続エラー:', supabaseError);
        }
      }
      
      // ローカルストレージからデータを取得
      const savedEntries = localStorage.getItem('journalEntries');
      if (savedEntries) {
        try {
          const parsedEntries = JSON.parse(savedEntries);
          
          // ローカルデータにsyncStatusを追加
          const localEntries = parsedEntries.map((entry: any) => ({
            ...entry,
            syncStatus: 'local' // ローカルストレージから取得したデータ
          }));
          
          setEntries(localEntries);
          setFilteredEntries(localEntries);
        } catch (error) {
          console.error('ローカルデータの解析エラー:', error);
        }
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntry = (entry: any) => {
    setSelectedEntry(entry);
    setEditMode(false);
    
    // 編集モードをリセットして詳細表示モードに
    setEditFormData({
      counselorMemo: entry.counselorMemo || entry.counselor_memo || '',
      isVisibleToUser: entry.isVisibleToUser || entry.is_visible_to_user || false,
      assignedCounselor: entry.assignedCounselor || entry.assigned_counselor || '',
      urgencyLevel: entry.urgencyLevel || entry.urgency_level || ''
    });
  };

  const handleEditEntry = () => {
    setEditMode(true);
    // 既に選択されているエントリーを編集モードに切り替え
  };

  const handleSaveEdit = async () => {

    console.log('保存前のデータ:', editFormData);
    console.log('保存前のデータ:', editFormData);
    console.log('保存前のデータ:', editFormData);
    try {
      // ローカルストレージのデータを更新
      const updatedEntries = entries.map(entry => {
        if (entry.id === selectedEntry.id) {
          return {
            ...entry,
            syncStatus: entry.syncStatus || 'local', // 同期状態を保持
            counselorMemo: editFormData.counselorMemo,
            isVisibleToUser: editFormData.isVisibleToUser,
            counselor_memo: editFormData.counselorMemo, // Supabase形式のフィールドも更新
            is_visible_to_user: editFormData.isVisibleToUser, // Supabase形式のフィールドも更新
            assignedCounselor: editFormData.assignedCounselor,
            assigned_counselor: editFormData.assignedCounselor, // Supabase形式のフィールドも更新
            urgencyLevel: editFormData.urgencyLevel,
            urgency_level: editFormData.urgencyLevel, // Supabase形式のフィールドも更新
            counselorName: localStorage.getItem('current_counselor') || 'カウンセラー',
            counselor_name: localStorage.getItem('current_counselor') || 'カウンセラー' // Supabase形式のフィールドも更新
          };
        }
          entry.id === editingEntry.id ? {
            ...entry,
            counselorMemo: editFormData.counselorMemo,
            isVisibleToUser: editFormData.isVisibleToUser,
            counselor_memo: editFormData.counselorMemo, // Supabase形式のフィールドも更新
            is_visible_to_user: editFormData.isVisibleToUser, // Supabase形式のフィールドも更新
            assignedCounselor: editFormData.assignedCounselor,
            assigned_counselor: editFormData.assignedCounselor, // Supabase形式のフィールドも更新
            urgencyLevel: editFormData.urgencyLevel,
            urgency_level: editFormData.urgencyLevel, // Supabase形式のフィールドも更新
            counselorName: localStorage.getItem('current_counselor') || 'カウンセラー',
            counselor_name: localStorage.getItem('current_counselor') || 'カウンセラー' // Supabase形式のフィールドも更新
          } : entry
      });

      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      // 自動同期機能を使用してSupabaseに同期
      if (window.autoSync && typeof window.autoSync.triggerManualSync === 'function') {
        await window.autoSync.triggerManualSync();
        console.log('自動同期を実行しました');
        console.log('自動同期を実行しました');
      }

      setSelectedEntry(null);
      setEditMode(false);
      alert('変更を保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert(`保存に失敗しました: ${error}`);
    } finally {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('この日記を削除しますか？この操作は元に戻せません。')) {
      return;
    }

    setSaving(true);

    setSaving(true);

    try {
      // ローカルストレージからの削除
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
        counselorMemo: editFormData.counselorMemo,
        isVisibleToUser: editFormData.isVisibleToUser,
        counselor_memo: editFormData.counselorMemo, // Supabase形式のフィールドも更新
        is_visible_to_user: editFormData.isVisibleToUser, // Supabase形式のフィールドも更新
        assignedCounselor: editFormData.assignedCounselor,
        assigned_counselor: editFormData.assignedCounselor, // Supabase形式のフィールドも更新
        urgencyLevel: editFormData.urgencyLevel,
        urgency_level: editFormData.urgencyLevel, // Supabase形式のフィールドも更新
        counselorName: localStorage.getItem('current_counselor') || 'カウンセラー',
        counselor_name: localStorage.getItem('current_counselor') || 'カウンセラー' // Supabase形式のフィールドも更新
        isVisibleToUser: editFormData.isVisibleToUser,
        counselor_memo: editFormData.counselorMemo, // Supabase形式のフィールドも更新
        is_visible_to_user: editFormData.isVisibleToUser, // Supabase形式のフィールドも更新
        assignedCounselor: editFormData.assignedCounselor,
        assigned_counselor: editFormData.assignedCounselor, // Supabase形式のフィールドも更新
        urgencyLevel: editFormData.urgencyLevel,
        entry.id === selectedEntry.id ? {
          ...entry,
          ...updatedEntry
        } : entry
        counselorName: localStorage.getItem('current_counselor') || 'カウンセラー',
        counselor_name: localStorage.getItem('current_counselor') || 'カウンセラー' // Supabase形式のフィールドも更新
      setFilteredEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      // 更新後のデータをログに出力
      console.log('保存後のデータ:', updatedEntry);
      
      // Supabaseからの削除（自動同期機能を使用）
      if (window.autoSync && typeof window.autoSync.syncDeleteDiary === 'function') {
        console.log('自動同期を実行します...');
        console.log('削除同期を実行しました');
        const syncResult = await window.autoSync.triggerManualSync();
        console.log('自動同期結果:', syncResult);
      }

      alert('カウンセラーコメントを保存しました！');
      alert('日記を削除しました！');
      alert(`更新に失敗しました: ${error}`);
      console.error('削除エラー:', error);
      alert('削除に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleFilteredResults = (filtered: any[]) => {
    setFilteredEntries(filtered);
  };

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

  // 詳細表示モーダル
  const renderEntryModal = () => {
    if (!selectedEntry) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-jp-bold text-gray-900">日記詳細</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 font-jp-medium">
                      {formatDate(selectedEntry.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-jp-medium border ${getEmotionColor(selectedEntry.emotion)}`}>
                      {selectedEntry.emotion}
                    </span>
                  </div>
                  {selectedEntry.syncStatus && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-jp-medium ${
                        selectedEntry.syncStatus === 'supabase'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {selectedEntry.syncStatus === 'supabase' ? 'Supabase同期済み' : 'ローカルデータ'}
                      </span>
                    </div>
                  )}
                  {selectedEntry.user && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-jp-medium">
                        {selectedEntry.user.line_username}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 日記内容 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="font-jp-bold text-gray-900 mb-3">出来事</h3>
                  <p className="text-gray-700 font-jp-normal whitespace-pre-wrap">
                    {selectedEntry.event}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="font-jp-bold text-gray-900 mb-3">気づき</h3>
                  <p className="text-gray-700 font-jp-normal whitespace-pre-wrap">
                    {selectedEntry.realization}
                  </p>
                </div>
              </div>

              {/* スコア情報（無価値感の場合のみ） */}
              {(selectedEntry.emotion === '無価値感' || 
                selectedEntry.emotion === '嬉しい' || 
                selectedEntry.emotion === '感謝' || 
                selectedEntry.emotion === '達成感' || 
                selectedEntry.emotion === '幸せ') && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-jp-bold text-gray-900 mb-3">スコア情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-jp-medium">自己肯定感スコア</span>
                        <span className="text-xl font-jp-bold text-blue-600">
                          {selectedEntry.selfEsteemScore || selectedEntry.self_esteem_score || 0}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-jp-medium">無価値感スコア</span>
                        <span className="text-xl font-jp-bold text-red-600">
                          {selectedEntry.worthlessnessScore || selectedEntry.worthlessness_score || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* カウンセラーメモ（編集モード） */}
              {editMode ? (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-jp-bold text-gray-900 mb-3">カウンセラーメモ</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                        メモ内容
                      </label>
                      <textarea
                        value={editFormData.counselorMemo}
                        onChange={(e) => setEditFormData({...editFormData, counselorMemo: e.target.value})}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal resize-none"
                        placeholder="カウンセラーメモを入力..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isVisibleToUser"
                        checked={editFormData.isVisibleToUser}
                        onChange={(e) => setEditFormData({...editFormData, isVisibleToUser: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="isVisibleToUser" className="text-sm font-jp-medium text-gray-700">
                        ユーザーに表示する
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                        担当カウンセラー
                      </label>
                      <select
                        value={editFormData.assignedCounselor}
                        onChange={(e) => setEditFormData({...editFormData, assignedCounselor: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal"
                      >
                        <option value="">未割り当て</option>
                        <option value="心理カウンセラー仁">心理カウンセラー仁</option>
                        <option value="心理カウンセラーAOI">心理カウンセラーAOI</option>
                        <option value="心理カウンセラーあさみ">心理カウンセラーあさみ</option>
                        <option value="心理カウンセラーSHU">心理カウンセラーSHU</option>
                        <option value="心理カウンセラーゆーちゃ">心理カウンセラーゆーちゃ</option>
                        <option value="心理カウンセラーSammy">心理カウンセラーSammy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                        緊急度
                      </label>
                      <select
                        value={editFormData.urgencyLevel}
                        onChange={(e) => setEditFormData({...editFormData, urgencyLevel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal"
                      >
                        <option value="">未設定</option>
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* カウンセラーメモ（表示モード） */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-jp-bold text-gray-900">カウンセラーメモ</h3>
                      <button
                        onClick={handleEditEntry}
                        className="text-blue-600 hover:text-blue-700 p-1 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>編集</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h4 className="text-sm font-jp-medium text-gray-700 mb-2">メモ内容</h4>
                        <p className="text-gray-700 font-jp-normal whitespace-pre-wrap">
                          {selectedEntry.counselorMemo || selectedEntry.counselor_memo || '（メモはありません）'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <h4 className="text-sm font-jp-medium text-gray-700 mb-2">ユーザーへの表示</h4>
                          <div className="flex items-center space-x-2">
                            {selectedEntry.isVisibleToUser || selectedEntry.is_visible_to_user ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-green-600 font-jp-medium">表示する</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500 font-jp-medium">表示しない</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <h4 className="text-sm font-jp-medium text-gray-700 mb-2">担当カウンセラー</h4>
                          <p className="text-gray-700 font-jp-normal">
                            {selectedEntry.assignedCounselor || selectedEntry.assigned_counselor || '未割り当て'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <h4 className="text-sm font-jp-medium text-gray-700 mb-2">緊急度</h4>
                          {selectedEntry.urgencyLevel || selectedEntry.urgency_level ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-jp-medium border ${
                              getUrgencyLevelColor(selectedEntry.urgencyLevel || selectedEntry.urgency_level)
                            }`}>
                              {getUrgencyLevelText(selectedEntry.urgencyLevel || selectedEntry.urgency_level)}
                            </span>
                          ) : (
                            <span className="text-gray-500 font-jp-normal">未設定</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* アクションボタン */}
              <div className="flex justify-between">
                <button
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>削除</span>
                </button>
                {editMode && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-jp-medium transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>保存</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
          <h1 className="text-2xl font-jp-bold text-gray-900 flex items-center">
            <Shield className="w-7 h-7 text-blue-600 mr-3" />
            カウンセラー管理画面
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-jp-normal">
              ログイン中: {localStorage.getItem('current_counselor')}
            </span>
            <button
              onClick={loadEntries}
              className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-jp-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>更新</span>
            </button>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="w-full mb-6 overflow-x-auto flex-nowrap bg-gray-100">
            <TabsTrigger value="diary" onClick={() => setActiveTab('diary')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              日記
            </TabsTrigger>
            <TabsTrigger value="search" onClick={() => setActiveTab('search')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Search className="w-4 h-4 mr-2" />
              詳細検索
            </TabsTrigger>
            <TabsTrigger value="calendar" onClick={() => setActiveTab('calendar')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              カレンダー
            </TabsTrigger>
            <TabsTrigger value="stats" onClick={() => setActiveTab('stats')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart2 className="w-4 h-4 mr-2" />
              統計
            </TabsTrigger>
            <TabsTrigger value="counselors" onClick={() => setActiveTab('counselors')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              カウンセラー
            </TabsTrigger>
            <TabsTrigger value="chat" onClick={() => setActiveTab('chat')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              チャット
            </TabsTrigger>
            <TabsTrigger value="backup" onClick={() => setActiveTab('backup')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Save className="w-4 h-4 mr-2" />
              バックアップ
            </TabsTrigger>
            <TabsTrigger value="device-auth" onClick={() => setActiveTab('device-auth')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              デバイス認証
            </TabsTrigger>
            <TabsTrigger value="security" onClick={() => setActiveTab('security')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              セキュリティ
            </TabsTrigger>
            <TabsTrigger value="settings" onClick={() => setActiveTab('settings')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              設定
            </TabsTrigger>
            <TabsTrigger value="data-cleanup" onClick={() => setActiveTab('data-cleanup')} className="flex items-center text-gray-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />
              データ管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diary" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                日記一覧
              </h2>
              <AdvancedSearchFilter 
                entries={entries} 
                onFilteredResults={handleFilteredResults} 
                onViewEntry={handleViewEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-6 flex items-center">
                <Search className="w-5 h-5 text-blue-600 mr-2" />
                詳細検索
              </h2>
              <AdvancedSearchFilter 
                entries={entries} 
                onFilteredResults={handleFilteredResults} 
                onViewEntry={handleViewEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarSearch 
              onViewEntry={handleViewEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-6 flex items-center">
                <BarChart2 className="w-5 h-5 text-blue-600 mr-2" />
                統計情報
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-jp-bold text-gray-900 mb-2">総日記数</h3>
                  <p className="text-3xl font-jp-bold text-blue-600">{entries.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-jp-bold text-gray-900 mb-2">無価値感の日記</h3>
                  <p className="text-3xl font-jp-bold text-green-600">
                    {entries.filter(entry => entry.emotion === '無価値感').length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-jp-bold text-gray-900 mb-2">カウンセラーコメント</h3>
                  <p className="text-3xl font-jp-bold text-purple-600">
                    {entries.filter(entry => entry.counselorMemo || entry.counselor_memo).length}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="counselors">
            <div className="space-y-6">
              <Tabs defaultValue="counselor-management">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="counselor-management" className="flex-1">
                    <Users className="w-4 h-4 mr-2" />
                    カウンセラー管理
                  </TabsTrigger>
                  <TabsTrigger value="consent-history" className="flex-1">
                    <Clock className="w-4 h-4 mr-2" />
                    同意履歴
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="counselor-management">
                  <CounselorManagement />
                </TabsContent>

                <TabsContent value="consent-history">
                  <ConsentHistoryManagement />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <CounselorChat />
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-6 flex items-center">
                <Save className="w-5 h-5 text-blue-600 mr-2" />
                バックアップ管理
              </h2>
              <div className="text-center py-8">
                <Save className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-jp-medium text-gray-500 mb-2">
                  バックアップ機能
                </h3>
                <p className="text-gray-400 font-jp-normal">
                  データのバックアップと復元を管理します
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="device-auth">
            <DeviceAuthManagement />
          </TabsContent>

          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-6 flex items-center">
                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                設定
              </h2>
              <div className="text-center py-8">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-jp-medium text-gray-500 mb-2">
                  システム設定
                </h3>
                <p className="text-gray-400 font-jp-normal">
                  アプリケーションの設定を管理します
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data-cleanup">
            <DataCleanup />
          </TabsContent>
        </Tabs>
      </div>

      {/* 詳細表示モーダル */}
      {renderEntryModal()}
    </div>
  );
};

export default AdminPanel;