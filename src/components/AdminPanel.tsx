Here's the fixed version with all missing closing brackets added:

```typescript
// ... (previous code remains the same until the loadEntries useEffect)

useEffect(() => {
  const loadEntries = async () => {
    try {
      const storedEntries = localStorage.getItem('journalEntries');
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setEntries(parsedEntries);
        setFilteredEntries(parsedEntries);
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

The main issue was a missing closing bracket for the useEffect hook. I've added it and ensured proper closure of the function. The rest of the code appears to be properly structured with matching brackets.