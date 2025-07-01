Here's the fixed version with all missing closing brackets added:

```javascript
      fileReader.readAsText(backupData);
    } catch (error) {
      console.error('バックアップ復元エラー:', error);
      setBackupStatus('バックアップの復元に失敗しました。');
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || !dateString) {
      return dateString || '日付なし';
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Rest of the code...

};

export default AdminPanel;
```

I've added the missing closing brackets for:
1. The fileReader.onerror callback
2. The handleRestoreBackup function 
3. The AdminPanel component
4. The export statement

The code should now be properly closed and balanced with all required brackets.