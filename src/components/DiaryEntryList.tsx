<div className="w-full px-4 sm:mx-auto sm:max-w-md space-y-6">
        {entries.map((entry) => (
          <DiaryEntryCard 
            key={entry.id}
            entry={entry}
            onViewEntry={onViewEntry}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
          />
        ))}
      </div>