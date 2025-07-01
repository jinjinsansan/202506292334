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
  // ... rest of the code ...

  const handleSaveEdit = async () => {
    if (!selectedEntry) return;

    console.log('日記を保存します:', editFormData);
    setSaving(true);
    
    try {
      // ローカルストレージのデータを更新
      const updatedEntries = entries.map(entry => {
        if (entry.id === selectedEntry.id) {
          return {
            ...entry, // 元のエントリーのプロパティをすべて保持
            user_id: entry.user_id || selectedEntry.user_id, // ユーザーIDを保持
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

  const renderEntryModal = () => {
    if (!selectedEntry) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            {editMode ? (
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-jp-medium flex items-center space-x-2"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中...' : '保存'}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            検索
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            カレンダー
          </TabsTrigger>
          <TabsTrigger value="counselors">
            <Users className="w-4 h-4 mr-2" />
            カウンセラー
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            チャット
          </TabsTrigger>
          <TabsTrigger value="device-auth">
            <Shield className="w-4 h-4 mr-2" />
            端末認証
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            セキュリティ
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            バックアップ
          </TabsTrigger>
          <TabsTrigger value="data-cleanup">
            <Trash2 className="w-4 h-4 mr-2" />
            データクリーンアップ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <AdvancedSearchFilter entries={entries} onFilteredResults={handleFilteredResults} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarSearch entries={entries} onFilteredResults={handleFilteredResults} />
        </TabsContent>

        <TabsContent value="counselors">
          <CounselorManagement />
        </TabsContent>

        <TabsContent value="chat">
          <CounselorChat />
        </TabsContent>

        <TabsContent value="device-auth">
          <DeviceAuthManagement />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="backup">
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-4">バックアップ管理</h2>
              <div className="space-y-4">
                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-jp-medium flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>バックアップを作成</span>
                </button>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-jp-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    onClick={handleRestoreBackup}
                    disabled={!backupData || restoring}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-jp-medium flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{restoring ? '復元中...' : '復元'}</span>
                  </button>
                </div>
                {backupStatus && (
                  <div className={`p-4 rounded-lg ${backupStatus.includes('失敗') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {backupStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data-cleanup">
          <DataCleanup />
        </TabsContent>
      </Tabs>

      {selectedEntry && renderEntryModal()}
    </div>
  );
};

export default AdminPanel;