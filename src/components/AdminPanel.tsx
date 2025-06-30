Here's the fixed version with added missing closing brackets and parentheses:

```typescript
// At the end of handleViewEntry button in the modal:
                    <button
                      onClick={() => handleDeleteEntry(selectedEntry.id)}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>削除</span>
                    </button>

// At the end of editMode cancel button:
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-jp-medium transition-colors"
                    >
                      キャンセル
                    </button>

// At the end of save button:
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-jp-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>保存</span>
                    </button>
```

The main issues were missing closing tags and attributes for some buttons in the modal section. I've added the proper closing tags and fixed the className attributes that were duplicated.