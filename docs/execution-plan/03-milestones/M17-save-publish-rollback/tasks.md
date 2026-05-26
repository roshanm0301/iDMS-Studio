# Tasks — M17

1. Add dirty state tracking to useUIStudioEditorStore (isDirty flag)
2. Create SaveDraftAction (calls useSaveDraftMutation, clears isDirty)
3. Add autosave debounce (500ms after last change)
4. Create DirtyStateBadge (shown in editor header when isDirty)
5. Create UnsavedChangesGuard (React Router blocker or dialog on route leave)
6. Create PublishAction (calls usePublishViewMutation, increments version, creates snapshot)
7. Add version snapshot storage to mockViewRepository (array of snapshots per view)
8. Create VersionHistoryPanel (list version snapshots with rollback button)
9. Create RollbackAction (restores ViewArtifact from snapshot, sets isDirty=true)
10. Add tests for save, publish, rollback flows
11. Run milestone gate checks and update HANDOFF.md
