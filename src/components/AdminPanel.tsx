Here's the fixed version with all missing closing brackets added:

```typescript
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar, Search, Filter, RefreshCw, User, Shield, Database, Download, Trash2, Eye, Edit3, AlertTriangle, CheckCircle, Clock, MessageCircle, Users, BookOpen, BarChart2, Settings, Save, FileText, Layers, Upload } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    counselorMemo: '',
    isVisibleToUser: false,
    assignedCounselor: '',
    urgencyLevel: ''
  });
  const [backupData, setBackupData] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const tabName = hash.substring(1);
      if (['diary', 'search', 'calendar', 'stats', 'counselors', 'chat', 'backup', 'device-auth', 'security', 'settings', 'data-cleanup'].includes(tabName)) {
        setActiveTab(tabName);
      }
    }
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      if (supabase) {
        try {
          console.log('Supabaseから日記データを取得します');
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
            throw error;
          } else if (diaryData && diaryData.length > 0) {
            console.log('Supabaseから日記データを取得しました:', diaryData.length, '件');
            
            const formattedEntries = diaryData.map(item => {
              const key = \`${item.date}_${item.emotion}_${item.event?.substring(0, 50)}`;

              return {
                id: item.id,
                date: item.date,
                emotion: item.emotion || '不明',
                event: item.event || '内容なし',
                realization: item.realization || '内容なし',
                selfEsteemScore: item.self_esteem_score || 0,
                worthlessnessScore: item.worthlessness_score || 0,
                created_at: item.created_at,
                user: item.users,
                counselorMemo: item.counselor_memo || '',
                isVisibleToUser: item.is_visible_to_user || false,
                counselorName: item.counselor_name || '',
                assignedCounselor: item.assigned_counselor || '',
                urgencyLevel: item.urgency_level || '',
                syncStatus: 'supabase',
                _key: key
              };
            });
            
            const uniqueMap = new Map();
            const uniqueEntries = [];
            
            for (const entry of formattedEntries) {
              if (!uniqueMap.has(entry._key)) {
                uniqueMap.set(entry._key, entry);
                uniqueEntries.push(entry);
              }
            }
            
            console.log(\`重複を除外: ${formattedEntries.length} → ${uniqueEntries.length}`);
            
            setEntries(uniqueEntries);
            setFilteredEntries(uniqueEntries);
            console.log('日記データを設定しました:', formattedEntries.length, '件');
            return;
          }
        } catch (supabaseError) {
          console.error('Supabase接続エラー:', supabaseError);
        }
      }
      
      const savedEntries = localStorage.getItem('journalEntries');
      if (savedEntries) {
        console.log('ローカルストレージから日記データを取得します');
        try {
          const parsedEntries = JSON.parse(savedEntries);
          
          const localEntries = parsedEntries.map((entry: any) => ({
            ...entry,
            syncStatus: 'local'
          }));
          
          setEntries(localEntries);
          setFilteredEntries(localEntries);
          console.log('ローカルデータを設定しました:', localEntries.length, '件');
        } catch (error) {
          console.error('ローカルデータの解析エラー:', error);
        }
      } else {
        console.log('ローカルストレージに日記データがありません');
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
    
    setEditFormData({
      counselorMemo: entry.counselorMemo || entry.counselor_memo || '',
      isVisibleToUser: entry.isVisibleToUser || entry.is_visible_to_user || false,
      assignedCounselor: entry.assignedCounselor || entry.assigned_counselor || '',
      urgencyLevel: entry.urgencyLevel || entry.urgency_level || ''
    });
  };

  const handleEditEntry = () => {
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;

    console.log('日記を保存します:', editFormData);
    setSaving(true);
    
      const updatedEntries = entries.map(entry => {
          if (entry.id === selectedEntry.id) {
            return {
              ...entry, // 元のエントリーのプロパティをすべて保持
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
          return entry;
      });

      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      console.log('ローカルストレージを更新しました');
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      if (window.autoSync && typeof window.autoSync.triggerManualSync === 'function') {
        console.log('自動同期を実行します');
        await window.autoSync.triggerManualSync();
        console.log('自動同期を実行しました');
      }

      setSelectedEntry(null);
      setEditMode(false);
      alert('変更を保存しました！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('保存エラー:', errorMessage);
      alert(\`保存に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('この日記を削除しますか？この操作は元に戻せません。')) {
      return;
    }

    console.log('日記を削除します:', entryId);
    setSaving(true);
    
    try {
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      if (window.autoSync && typeof window.autoSync.syncDeleteDiary === 'function') {
        const syncResult = await window.autoSync.syncDeleteDiary(entryId);
        console.log('削除同期結果:', syncResult ? '成功' : '失敗');
      }

      setSelectedEntry(null);
      alert('日記を削除しました！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('削除エラー:', errorMessage);
      alert(\`削除に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFilteredResults = (filtered: any[]) => {
    setFilteredEntries(filtered);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupData(e.target.files[0]);
      setBackupStatus(null);
    }
  };

  const handleCreateBackup = () => {
    try {
      const backupObject = {
        journalEntries: localStorage.getItem('journalEntries') ? JSON.parse(localStorage.getItem('journalEntries')!) : [],
        initialScores: localStorage.getItem('initialScores') ? JSON.parse(localStorage.getItem('initialScores')!) : null,
        consentHistories: localStorage.getItem('consent_histories') ? JSON.parse(localStorage.getItem('consent_histories')!) : [],
        lineUsername: localStorage.getItem('line-username'),
        privacyConsentGiven: localStorage.getItem('privacyConsentGiven'),
        privacyConsentDate: localStorage.getItem('privacyConsentDate'),
        backupDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(backupObject, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const counselorName = localStorage.getItem('current_counselor') || 'admin';
      const date = new Date().toISOString().split('T')[0];
      const fileName = \`kanjou-nikki-backup-${counselorName}-${date}.json`;
      
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(dataBlob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setBackupStatus('バックアップが正常に作成されました！');
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      setBackupStatus('バックアップの作成に失敗しました。');
    }
  };

  const handleRestoreBackup = async () => {
    if (!backupData) {
      setBackupStatus('バックアップファイルを選択してください。');
      return;
    }
    
    if (!window.confirm('バックアップからデータを復元すると、現在のデータが上書きされます。続行しますか？')) {
      return;
    }
    
    setRestoring(true);
    setBackupStatus(null);
    
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = (event) => {
        try {
          if (!event.target || typeof event.target.result !== 'string') {
            throw new Error('ファイルの読み込みに失敗しました。');
          }
          
          const backupObject = JSON.parse(event.target.result);
          
          if (!backupObject.version) {
            throw new Error('無効なバックアップファイルです。');
          }
          
          if (backupObject.journalEntries) {
            localStorage.setItem('journalEntries', JSON.stringify(backupObject.journalEntries));
          }
          
          if (backupObject.initialScores) {
            localStorage.setItem('initialScores', JSON.stringify(backupObject.initialScores));
          }
          
          if (backupObject.consentHistories) {
            localStorage.setItem('consent_histories', JSON.stringify(backupObject.consentHistories));
          }
          
          if (backupObject.lineUsername) {
            localStorage.setItem('line-username', backupObject.lineUsername);
          }
          
          if (backupObject.privacyConsentGiven) {
            localStorage.setItem('privacyConsentGiven', backupObject.privacyConsentGiven);
          }
          
          if (backupObject.privacyConsentDate) {
            localStorage.setItem('privacyConsentDate', backupObject.privacyConsentDate);
          }
          
          setBackupStatus('データが正常に復元されました！');
          
          loadEntries();
          
          if (window.autoSync && typeof window.autoSync.triggerManualSync === 'function') {
            window.autoSync.triggerManualSync().catch(error => {
              console.error('復元後の同期エラー:', error);
            });
          }
          
        } catch (error) {
          console.error('データ復元エラー:', error);
          setBackupStatus('データの復元に失敗しました。有効なバックアップファイルか確認してください。');
        } finally {
          setRestoring(false);
        }
      };
      
      fileReader.onerror = () => {
        setBackupStatus('ファイルの読み込みに失敗しました。');
        setRestoring(false);
      };
      
      fileReader.readAsText(backupData);
      
    } catch (error) {
      console.error('バックアップ復元エラー:', error);
      setBackupStatus('バックアップの復元に失敗しました。');
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || !dateString) {
      return dateString || '日付なし';
    }
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
                <Trash2 className="w-4 h-4" /> 
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 font-jp-medium whitespace-nowrap">
                      {formatDate(selectedEntry.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={\`px-2 py-1 rounded-full text-xs font-jp-medium border ${getEmotionColor(selectedEntry.emotion)}`}>
                      {selectedEntry.emotion}
                    </span>
                  </div>
                  {selectedEntry.syncStatus && (
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={\`px-2 py-1 rounded-full text-xs font-jp-medium ${
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
                        <p className="text-gray-700 font-jp-normal whitespace-pre-wrap break-words">
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
                            <span className={\`px-2 py-1 rounded-full text-xs font-jp-medium border ${
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

              <div className="flex justify-between">
                <button
                  onClick={() => handle