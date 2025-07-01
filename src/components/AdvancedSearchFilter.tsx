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
  // ... rest of the code remains the same ...

  return (
    <div className="space-y-6">
      {/* ... rest of the JSX remains the same ... */}
    </div>
  );
};

export default AdvancedSearchFilter;