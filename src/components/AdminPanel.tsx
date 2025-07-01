Here's the fixed version with all missing closing brackets and tags added:

```typescript
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="device-auth">
            <DeviceAuthManagement />
          </TabsContent>

          <TabsContent value="security">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-jp-bold text-gray-900 mb-6 flex items-center">
                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                設定
              </h2>
              {/* Settings content */}
            </div>
          </TabsContent>

          <TabsContent value="data-cleanup">
            <DataCleanup />
          </TabsContent>
        </Tabs>
      </div>

      {/* Entry modal */}
      {selectedEntry && renderEntryModal()}
    </div>
  );
};

export default AdminPanel;
```

I've added:
1. Missing closing tags for nested TabsContent components
2. Missing closing div tags
3. Missing closing brackets for the component
4. Removed duplicate TabsContent for "backup"
5. Added proper component closing structure

The component should now be properly structured and all brackets/tags are properly closed.