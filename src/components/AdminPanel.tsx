import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar, Search, Filter, RefreshCw, User, Shield, Database, Download, Trash2, Eye, Edit3, AlertTriangle, CheckCircle, Clock, MessageCircle, Users, BookOpen, BarChart2, Settings, Save, FileText, Layers, Upload } from 'lucide-react';

      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      );
      
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

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('この日記を削除しますか？この操作は元に戻せません。')) {
      return;
    }

    console.log('日記を削除します:', entryId);
    setSaving(true);
    
    try {
      // ローカルストレージからの削除
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));

      // Supabaseからの削除（自動同期機能を使用）
      if (window.autoSync && typeof window.autoSync.syncDeleteDiary === 'function') {
        const syncResult = await window.autoSync.syncDeleteDiary(entryId);
        console.log('削除同期結果:', syncResult ? '成功' : '失敗');
      }

      setSelectedEntry(null);
      alert('日記を削除しました！');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('削除エラー:', errorMessage);
      alert(`削除に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFilteredResults = (filtered: any[]) => {
    setFilteredEntries(filtered);
  };

  // バックアップファイルの選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupData(e.target.files[0]);
      setBackupStatus(null);
    }
  };

  // バックアップデータの作成
  const handleCreateBackup = () => {
    try {
      // ローカルストレージからデータを収集
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
      
      // JSONに変換してダウンロード
      const dataStr = JSON.stringify(backupObject, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // ファイル名にカウンセラー名と日付を含める
      const counselorName = localStorage.getItem('current_counselor') || 'admin';
      const date = new Date().toISOString().split('T')[0];
      const fileName = `kanjou-nikki-backup-${counselorName}-${date}.json`;
      
      // ダウンロードリンクを作成して自動クリック
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

                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500 font-jp-medium">自己肯定感:</span>
                   <span className="font-jp-semibold text-blue-600">
                     {entry.selfEsteemScore || entry.self_esteem_score || 50}
                   </span>
                 </div>
               </div>
               <div className="flex flex-wrap gap-2 sm:gap-6 text-xs bg-white rounded-lg p-2 border border-gray-200">
                 <div className="flex items-center space-x-2">
                   <span className="text-gray-500 font-jp-medium">無価値感:</span>
                   <span className="font-jp-semibold text-red-600">
                     {entry.worthlessnessScore || entry.worthlessness_score || 50}
                   </span>
                 </div>
               </div>