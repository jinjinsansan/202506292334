Here's the fixed version with added missing closing brackets and parentheses:

```typescript
import React, { useState, useEffect } from 'react';
// ... (rest of imports)

const AdminPanel: React.FC = () => {
  // ... (state declarations and other code)

  const renderEntryModal = () => {
    if (!selectedEntry) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* ... (modal content) */}
          <div className="flex justify-between">
            <button
              onClick={() => handleDeleteEntry(selectedEntry.id)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>削除</span>
            </button>
            {editMode && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-jp-medium transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>保存</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ... (rest of JSX) */}
      {renderEntryModal()}
    </div>
  );
};

export default AdminPanel;
```

The main fixes included:
1. Adding missing closing brackets for the renderEntryModal function
2. Fixing button element structure and removing duplicate className attributes
3. Adding missing closing tags for buttons and divs
4. Properly closing the component definition