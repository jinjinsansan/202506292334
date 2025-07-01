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
  // ... rest of the code ...

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;
    setSaving(true);
    
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
        return entry;
      });

      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      console.log('ローカルストレージを更新しました');
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      // 自動同期機能を使用してSupabaseに同期
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
      alert(`保存に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const renderEntryModal = () => {
    if (!selectedEntry) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          {/* ... rest of the modal content ... */}
          <div className="flex justify-between">
            <button
              onClick={() => handleDeleteEntry(selectedEntry.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-jp-medium flex items-center space-x-2"
              disabled={saving}
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
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors" 
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>保存中</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>保存</span>
                    </>
                  )}
                </button>
              </div>
            )}
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
              <BookOpen className="w-4 h-4 mr-2" aria-hidden="true" />
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
              <Shield className="w-4 h-4 mr-2"  />
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
                <BookOpen className="w-5 h-5 text-blue-600 mr-2" aria-hidden="true" />
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
                <Search className="w-5 h-5 text-blue-600 mr-2" aria-hidden="true" />
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
                <Save className="w-5 h-5 text-blue-600 mr-2" aria-hidden="true" />
                バックアップ管理
              </h2>
              <div className="space-y-6">
                {/* バックアップ作成セクション */}
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <Download className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-jp-bold text-gray-900 mb-2">バックアップファイルを作成</h3>
                      <p className="text-gray-700 font-jp-normal mb-4">
                        現在のデータをバックアップファイルとして保存します。このファイルは後でデータを復元する際に使用できます。
                      </p>
                      <button
                        onClick={handleCreateBackup}
                        className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-jp-medium transition-colors w-full sm:w-auto"
                      >
                        <Download className="w-5 h-5" />
                        <span>バックアップを作成</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* バックアップ復元セクション */}
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-start space-x-4 mb-4">
                    <Upload className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-jp-bold text-gray-900 mb-2">バックアップから復元</h3>
                      <p className="text-gray-700 font-jp-normal mb-4">
                        以前作成したバックアップファイルからデータを復元します。現在のデータは上書きされます。
                      </p>
                      
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-jp-medium
                              file:bg-purple-100 file:text-purple-700
                              hover:file:bg-purple-200
                              cursor-pointer"
                          />
                        </div>
                        
                        <button
                          onClick={handleRestoreBackup}
                          disabled={!backupData || restoring}
                          className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-jp-medium transition-colors w-full sm:w-auto"
                        >
                          {restoring ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          <span>バックアップから復元</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 注意事項 */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 font-jp-normal">
                      <p className="font-jp-medium mb-1">重要な注意事項</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>バックアップファイルには個人情報が含まれています。安全に保管してください</li>
                        <li>復元操作は元に戻せません。必要に応じて現在のデータもバックアップしてください</li>
                        <li>端末を変更する場合は、必ずバックアップを作成してください</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* 状態表示 */}
                {backupStatus && (
                  <div className={`rounded-lg p-4 border ${
                    backupStatus.includes('失敗') 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {backupStatus.includes('失敗') ? (
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="font-jp-medium">{backupStatus}</span>
                    </div>
                  </div>
                )}
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