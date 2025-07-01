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
  // ... rest of the code remains the same ...

  return (
    <div className="space-y-6">
      {/* ... rest of the JSX remains the same ... */}
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
  );
};

export default AdvancedSearchFilter;