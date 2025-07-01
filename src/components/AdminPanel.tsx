Here's the fixed version with all missing closing brackets added:

```typescript
// ... (previous code remains the same until the loadEntries useEffect)

useEffect(() => {
  const loadEntries = async () => {
    try {
      const storedEntries = localStorage.getItem('journalEntries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
        setFilteredEntries(JSON.parse(storedEntries));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading entries:', error);
      setLoading(false);
    }
  };

  loadEntries();

  // URLのハッシュからタブを設定
  const hash = window.location.hash;
  if (hash) {
    const tabName = hash.substring(1); // #を除去
    if (['diary', 'search', 'calendar', 'stats', 'counselors', 'chat', 'backup', 'device-auth', 'security', 'settings', 'data-cleanup'].includes(tabName)) {
      setActiveTab(tabName);
    }
  }
}, []); // Added missing closing bracket for useEffect

// ... (rest of the code remains the same)
```

The main issue was a missing closing bracket for the `useEffect` hook. The rest of the code appears to be properly closed. I've added the missing `});` to complete the `useEffect` hook definition.