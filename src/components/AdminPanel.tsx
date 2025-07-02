Here's the fixed version with all missing closing brackets added:

```typescript
          if (entry.id === selectedEntry.id) {
            return {
              ...entry,
              syncStatus: entry.syncStatus || 'local', // 同期状態を保持
              counselorMemo: editFormData.counselorMemo,
              isVisibleToUser: editFormData.isVisibleToUser,
              counselor_memo: editFormData.counselorMemo, // Supabase形式のフィールドも更新
              is_visible_to_user: editFormData.isVisibleToUser, // Supabase形式のフィールドも更新
              assignedCounselor: editFormData.assignedCounselor,
              assigned_counselor: editFormData.assignedCounselor, // Supabase形式のフィールドも更新
              urgencyLevel: editFormData.urgencyLevel,
              urgency_level: editFormData.urgencyLevel, // Supabase形式のフィールドも更新
              counselorName: localStorage.getItem('current_counselor') || 'カウンセラー',
              counselor_name: localStorage.getItem('current_counselor') || 'カウンセラー', // Supabase形式のフィールドも更新
              commented_at: new Date().toISOString() // コメント日時を追加
            };
          }
          return entry;
      });

```

I added the missing closing brackets for the object literal and the map callback function. The rest of the code appears to be properly closed.