import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Search, MessageCircle, Settings, Users, AlertTriangle, Edit3, Trash2, Save, X, CheckCircle, Eye, EyeOff, User, Clock, Filter, Shield, Database, RefreshCw, Download } from 'lucide-react';
import AdvancedSearchFilter from './AdvancedSearchFilter';
import { supabase } from '../lib/supabase';

interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: string;
  created_at: string;
  updated_at: string;
  is_flagged: boolean;
  flag_reason?: string;
  user_email?: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  is_active: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalEntries: number;
  flaggedEntries: number;
  activeUsers: number;
}

const AdminPanel: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalEntries: 0,
    flaggedEntries: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showContent, setShowContent] = useState<{ [key: string]: boolean }>({});
  const [filterCriteria, setFilterCriteria] = useState({
    mood: '',
    dateRange: { start: '', end: '' },
    flagged: false,
    userId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEntries(),
        loadUsers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entriesWithEmail = data?.map(entry => ({
        ...entry,
        user_email: entry.profiles?.email || 'Unknown'
      })) || [];

      setEntries(entriesWithEmail);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [usersResult, entriesResult, flaggedResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('journal_entries').select('id', { count: 'exact' }),
        supabase.from('journal_entries').select('id', { count: 'exact' }).eq('is_flagged', true)
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalEntries: entriesResult.count || 0,
        flaggedEntries: flaggedResult.count || 0,
        activeUsers: users.filter(user => user.is_active).length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFlagEntry = async (entryId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ 
          is_flagged: true, 
          flag_reason: reason 
        })
        .eq('id', entryId);

      if (error) throw error;
      
      await loadEntries();
      await loadStats();
    } catch (error) {
      console.error('Error flagging entry:', error);
    }
  };

  const handleUnflagEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ 
          is_flagged: false, 
          flag_reason: null 
        })
        .eq('id', entryId);

      if (error) throw error;
      
      await loadEntries();
      await loadStats();
    } catch (error) {
      console.error('Error unflagging entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      
      await loadEntries();
      await loadStats();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleEditEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ content: editContent })
        .eq('id', entryId);

      if (error) throw error;
      
      setEditingEntry(null);
      setEditContent('');
      await loadEntries();
    } catch (error) {
      console.error('Error editing entry:', error);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry.id);
    setEditContent(entry.content);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditContent('');
  };

  const toggleContentVisibility = (entryId: string) => {
    setShowContent(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMood = !filterCriteria.mood || entry.mood === filterCriteria.mood;
    const matchesFlagged = !filterCriteria.flagged || entry.is_flagged;
    const matchesUser = !filterCriteria.userId || entry.user_id === filterCriteria.userId;
    
    let matchesDate = true;
    if (filterCriteria.dateRange.start && filterCriteria.dateRange.end) {
      const entryDate = new Date(entry.created_at);
      const startDate = new Date(filterCriteria.dateRange.start);
      const endDate = new Date(filterCriteria.dateRange.end);
      matchesDate = entryDate >= startDate && entryDate <= endDate;
    }

    return matchesSearch && matchesMood && matchesFlagged && matchesUser && matchesDate;
  });

  const exportData = async () => {
    try {
      const dataToExport = {
        entries: filteredEntries,
        users: users,
        stats: stats,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Entries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.flaggedEntries}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search entries or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <AdvancedSearchFilter
              onFilterChange={setFilterCriteria}
              users={users}
            />
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className={`${entry.is_flagged ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm text-gray-600">{entry.user_email}</span>
                      <Badge variant={entry.mood === 'happy' ? 'default' : entry.mood === 'sad' ? 'destructive' : 'secondary'}>
                        {entry.mood}
                      </Badge>
                      {entry.is_flagged && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editingEntry === entry.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-3 border rounded-md resize-none"
                          rows={4}
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleEditEntry(entry.id)}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleContentVisibility(entry.id)}
                          >
                            {showContent[entry.id] ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Hide Content
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Show Content
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {showContent[entry.id] && (
                          <div className="bg-gray-50 p-3 rounded-md mb-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                          </div>
                        )}

                        {entry.is_flagged && entry.flag_reason && (
                          <div className="bg-red-100 border border-red-200 p-3 rounded-md mb-4">
                            <p className="text-red-800">
                              <strong>Flag Reason:</strong> {entry.flag_reason}
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          {entry.is_flagged ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUnflagEntry(entry.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Unflag
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Enter flag reason:');
                                if (reason) handleFlagEntry(entry.id, reason);
                              }}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Flag
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      {user.last_sign_in_at && (
                        <p className="text-sm text-gray-500">
                          Last active: {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-flag sensitive content</h3>
                    <p className="text-sm text-gray-500">Automatically flag entries containing sensitive keywords</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Data retention policy</h3>
                    <p className="text-sm text-gray-500">Set how long to keep user data and entries</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Security settings</h3>
                    <p className="text-sm text-gray-500">Configure authentication and security policies</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;