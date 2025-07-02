import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar, Search, Filter, RefreshCw, User, Shield, Database, Download, Trash2, Eye, Edit3, AlertTriangle, CheckCircle, Clock, MessageCircle, Users, BookOpen, BarChart2, Settings, Save, FileText, Layers, Upload } from 'lucide-react';

      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      );
      
      setEntries(updatedEntries);
      setFilteredEntries(updatedEntries);
      console.log('ローカルストレージを更新しました');

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
              counselor_name: localStorage.getItem('current_counselor') || 'カウンセラー', // Supabase形式のフィールドも更新
              commented_at: new Date().toISOString() // コメント日時を追加
            };
          }
          return entry;
      });

      setEntries(updatedEntries);

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