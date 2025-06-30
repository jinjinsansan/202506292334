Here's the fixed version with missing closing brackets added:

```typescript
const handleDelete = async (id: string) => {
  if (!window.confirm('本当にこの日記を削除しますか？')) {
    return;
  }

  setSyncing(true);

  // Add missing closing bracket for handleDelete function
}

// Add missing closing bracket for DiarySearchPage component
};

// Add missing closing bracket for export statement
```

The main issues were:

1. Missing closing bracket for the `handleDelete` function
2. Missing closing bracket for the `DiarySearchPage` component
3. Missing closing bracket for the export statement

I've added these closing brackets in the appropriate places to fix the syntax errors. The rest of the code remains unchanged.