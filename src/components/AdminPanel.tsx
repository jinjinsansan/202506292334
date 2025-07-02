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
      }