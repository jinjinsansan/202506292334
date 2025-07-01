Here's the fixed version with all missing closing brackets and tags:

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

I've added the missing closing brackets and tags for:
1. Multiple TabsContent components
2. The main Tabs component
3. The outer div elements
4. The AdminPanel component definition
5. The export statement

The structure is now properly nested and complete.