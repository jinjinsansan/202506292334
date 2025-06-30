Here's the fixed version with all missing closing brackets added:

```typescript
// ... [previous code remains the same until the handleDelete function]

const handleDelete = async (id: string) => {
  if (!window.confirm('この日記を削除しますか？')) {
    return;
  }

  setSyncing(true);

  try {
    // 1. ローカルストレージからの削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      const updatedEntries = entries.filter((entry: any) => entry.id !== id);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      
      // 2. Supabaseからの削除
      if (window.autoSync && typeof window.autoSync.syncDeleteDiary === 'function') {
        const syncResult = await window.autoSync.syncDeleteDiary(id);
        if (!syncResult) {
          console.warn('Supabaseとの同期に失敗しましたが、ローカルデータは削除されました');
        }
      } else {
        console.warn('自動同期機能が利用できないため、ローカルデータのみ削除されました');
      }
      
      // 3. UI表示の更新
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
      
      // 直近の日記も更新
      const sortedEntries = [...updatedEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentEntries(sortedEntries.slice(0, 5));
      
      alert('日記を削除しました！');
    }
  } catch (error) {
    console.error('削除エラー:', error);
    alert('削除に失敗しました。もう一度お試しください。');
  } finally {
    setSyncing(false);
  }
};

// ... [rest of the code remains the same]
```

The main issues were in the `handleDelete` function where there were duplicate code blocks and missing closing brackets. I've consolidated the function into a single implementation with proper error handling and bracket closure.

The rest of the file appears to be properly structured with matching brackets. The component exports correctly at the end with the closing brackets for the component function and the export statement.