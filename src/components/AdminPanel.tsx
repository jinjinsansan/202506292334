import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar, Search, Filter, RefreshCw, User, Shield, Database, Download, Trash2, Eye, Edit3, AlertTriangle, CheckCircle, Clock, MessageCircle, Users, BookOpen, BarChart2, Settings, Save, FileText, Layers, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import CounselorManagement from './CounselorManagement';
import CounselorChat from './CounselorChat';

const AdminPanel = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activeTab, setActiveTab] = useState('entries');
  const [searchTerm, setSearchTerm] = useState('');
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

  // 初期化時にactiveTabを設定
  useEffect(() => {
    // URLのハッシュからタブを設定
    const hash = window.location.hash.replace('#', '');
    if (hash && ['entries', 'counselors', 'chat', 'analytics', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // ユーザー名を取得する関数
  const getUserName = (entry: any): string => {
    // ユーザー情報がある場合はそれを使用
    if (entry.user && entry.user.line_username) {
      return entry.user.line_username;
    }
    // ユーザー情報がない場合は不明
    return '不明なユーザー';
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/entries');
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
        setFilteredEntries(data);
      }
    } catch (error) {
      console.error('エントリー読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry =>
        entry.content?.toLowerCase().includes(term.toLowerCase()) ||
        entry.user?.line_username?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  };

  const handleFilter = (filters: any) => {
    let filtered = [...entries];

    if (filters.dateRange?.start) {
      filtered = filtered.filter(entry => 
        new Date(entry.date) >= new Date(filters.dateRange.start)
      );
    }

    if (filters.dateRange?.end) {
      filtered = filtered.filter(entry => 
        new Date(entry.date) <= new Date(filters.dateRange.end)
      );
    }

    if (filters.urgencyLevel && filters.urgencyLevel !== 'all') {
      filtered = filtered.filter(entry => entry.urgencyLevel === filters.urgencyLevel);
    }

    if (filters.assignedCounselor && filters.assignedCounselor !== 'all') {
      filtered = filtered.filter(entry => entry.assignedCounselor === filters.assignedCounselor);
    }

    if (filters.isVisibleToUser !== undefined) {
      filtered = filtered.filter(entry => entry.isVisibleToUser === filters.isVisibleToUser);
    }

    setFilteredEntries(filtered);
  };

  const handleEdit = (entry: any) => {
    setSelectedEntry(entry);
    setEditFormData({
      counselorMemo: entry.counselorMemo || '',
      isVisibleToUser: entry.isVisibleToUser || false,
      assignedCounselor: entry.assignedCounselor || '',
      urgencyLevel: entry.urgencyLevel || ''
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedEntry) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/entries/${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        await loadEntries();
        setEditMode(false);
        setSelectedEntry(null);
      }
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('このエントリーを削除しますか？')) return;

    try {
      const response = await fetch(`/api/admin/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadEntries();
        if (selectedEntry?.id === entryId) {
          setSelectedEntry(null);
        }
      }
    } catch (error) {
      console.error('削除エラー:', error);
    }
  };

  const handleExportBackup = async () => {
    try {
      const response = await fetch('/api/admin/backup');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('バックアップエクスポートエラー:', error);
    }
  };

  const handleRestoreBackup = async () => {
    if (!backupData) return;

    setRestoring(true);
    setBackupStatus('バックアップを復元中...');

    const fileReader = new FileReader();
    
    fileReader.onload = async (e) => {
      try {
        const backupContent = JSON.parse(e.target?.result as string);
        
        const response = await fetch('/api/admin/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backupContent),
        });

        if (response.ok) {
          setBackupStatus('バックアップの復元が完了しました。');
          await loadEntries();
        } else {
          setBackupStatus('バックアップの復元に失敗しました。');
        }
      } catch (error) {
        console.error('バックアップ復元エラー:', error);
        setBackupStatus('バックアップファイルの形式が正しくありません。');
      } finally {
        setRestoring(false);
      }
    };

    fileReader.onerror = () => {
      setBackupStatus('ファイルの読み込みに失敗しました。');
      setRestoring(false);
    };

    try {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 font-jp-bold">管理パネル</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadEntries}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-jp-medium">更新</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="entries" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="font-jp-medium">エントリー管理</span>
            </TabsTrigger>
            <TabsTrigger value="counselors" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="font-jp-medium">カウンセラー管理</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-jp-medium">チャット</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4" />
              <span className="font-jp-medium">分析</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="font-jp-medium">設定</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900 font-jp-bold">エントリー一覧</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="検索..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-regular"
                      />
                    </div>
                    <AdvancedSearchFilter onFilter={handleFilter} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredEntries.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 font-jp-regular">
                      エントリーが見つかりません
                    </div>
                  ) : (
                    filteredEntries.map((entry: any) => (
                      <div
                        key={entry.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedEntry?.id === entry.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 font-jp-regular">
                                {formatDate(entry.date)}
                              </span>
                              {entry.urgencyLevel && (
                                <span className={`px-2 py-1 text-xs rounded-full font-jp-medium ${
                                  entry.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                                  entry.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {entry.urgencyLevel === 'high' ? '緊急' :
                                   entry.urgencyLevel === 'medium' ? '中' : '低'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 font-jp-medium line-clamp-2 mb-2">
                              {entry.content?.substring(0, 100)}...
                            </p>
                            {entry.user && (
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600 font-jp-regular">
                                  {entry.user.line_username}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(entry);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  {selectedEntry ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 font-jp-bold">エントリー詳細</h3>
                        <div className="flex items-center space-x-2">
                          {editMode ? (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                <Save className="w-4 h-4" />
                                <span className="font-jp-medium">
                                  {saving ? '保存中...' : '保存'}
                                </span>
                              </button>
                              <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-jp-medium"
                              >
                                キャンセル
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEdit(selectedEntry)}
                              className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="font-jp-medium">編集</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 font-jp-medium whitespace-nowrap">
                            {formatDate(selectedEntry.date || '')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 font-jp-medium">
                            {selectedEntry.time || '時間なし'}
                          </span>
                          {selectedEntry.user && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 font-jp-medium">{getUserName(selectedEntry)}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 font-jp-medium">
                            内容
                          </label>
                          <div className="bg-white p-4 rounded-md border border-gray-200">
                            <p className="text-gray-900 whitespace-pre-wrap font-jp-regular">
                              {selectedEntry.content}
                            </p>
                          </div>
                        </div>

                        {editMode ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 font-jp-medium">
                                カウンセラーメモ
                              </label>
                              <textarea
                                value={editFormData.counselorMemo}
                                onChange={(e) => setEditFormData({
                                  ...editFormData,
                                  counselorMemo: e.target.value
                                })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-regular"
                                placeholder="カウンセラー用のメモを入力..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 font-jp-medium">
                                緊急度
                              </label>
                              <select
                                value={editFormData.urgencyLevel}
                                onChange={(e) => setEditFormData({
                                  ...editFormData,
                                  urgencyLevel: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-regular"
                              >
                                <option value="">選択してください</option>
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">緊急</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 font-jp-medium">
                                担当カウンセラー
                              </label>
                              <input
                                type="text"
                                value={editFormData.assignedCounselor}
                                onChange={(e) => setEditFormData({
                                  ...editFormData,
                                  assignedCounselor: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-regular"
                                placeholder="担当カウンセラー名"
                              />
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="isVisibleToUser"
                                checked={editFormData.isVisibleToUser}
                                onChange={(e) => setEditFormData({
                                  ...editFormData,
                                  isVisibleToUser: e.target.checked
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="isVisibleToUser" className="ml-2 block text-sm text-gray-700 font-jp-medium">
                                ユーザーに表示
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedEntry.counselorMemo && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 font-jp-medium">
                                  カウンセラーメモ
                                </label>
                                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                  <p className="text-gray-900 whitespace-pre-wrap font-jp-regular">
                                    {selectedEntry.counselorMemo}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-jp-medium">
                                  緊急度
                                </label>
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full font-jp-medium ${
                                  selectedEntry.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                                  selectedEntry.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  selectedEntry.urgencyLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedEntry.urgencyLevel === 'high' ? '緊急' :
                                   selectedEntry.urgencyLevel === 'medium' ? '中' :
                                   selectedEntry.urgencyLevel === 'low' ? '低' : '未設定'}
                                </span>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-jp-medium">
                                  ユーザー表示
                                </label>
                                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-jp-medium ${
                                  selectedEntry.isVisibleToUser ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedEntry.isVisibleToUser ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      表示
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3 mr-1" />
                                      非表示
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>

                            {selectedEntry.assignedCounselor && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 font-jp-medium">
                                  担当カウンセラー
                                </label>
                                <p className="text-gray-900 font-jp-regular">
                                  {selectedEntry.assignedCounselor}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 font-jp-regular">
                      エントリーを選択してください
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="counselors">
            <CounselorManagement />
          </TabsContent>

          <TabsContent value="chat">
            <CounselorChat />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-jp-bold">分析ダッシュボード</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600 font-jp-medium">総エントリー数</p>
                      <p className="text-2xl font-bold text-blue-900 font-jp-bold">{entries.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600 font-jp-medium">緊急エントリー</p>
                      <p className="text-2xl font-bold text-yellow-900 font-jp-bold">
                        {entries.filter(entry => entry.urgencyLevel === 'high').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 font-jp-medium">対応済み</p>
                      <p className="text-2xl font-bold text-green-900 font-jp-bold">
                        {entries.filter(entry => entry.assignedCounselor).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 font-jp-bold">システム設定</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 font-jp-bold">データ管理</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 font-jp-medium">バックアップエクスポート</h4>
                        <p className="text-sm text-gray-600 font-jp-regular">
                          全データをJSONファイルとしてエクスポートします
                        </p>
                      </div>
                      <button
                        onClick={handleExportBackup}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="font-jp-medium">エクスポート</span>
                      </button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 font-jp-medium">バックアップ復元</h4>
                          <p className="text-sm text-gray-600 font-jp-regular">
                            バックアップファイルからデータを復元します
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => setBackupData(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        
                        {backupData && (
                          <button
                            onClick={handleRestoreBackup}
                            disabled={restoring}
                            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span className="font-jp-medium">
                              {restoring ? '復元中...' : '復元実行'}
                            </span>
                          </button>
                        )}
                        
                        {backupStatus && (
                          <div className={`p-3 rounded-md ${
                            backupStatus.includes('完了') ? 'bg-green-50 text-green-800' : 
                            backupStatus.includes('失敗') ? 'bg-red-50 text-red-800' : 
                            'bg-blue-50 text-blue-800'
                          }`}>
                            <p className="text-sm font-jp-regular">{backupStatus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;