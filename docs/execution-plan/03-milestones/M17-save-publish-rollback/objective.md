# Objective — M17 Save / Publish / Rollback Model

## Goal
Implement the full draft/publish lifecycle for views: save drafts, publish a snapshot,
view version history, and roll back to a previous version.

## P0 Feature Covered
Save / Publish / Rollback Model

## Build Scope
- SaveDraftAction (autosave + manual save, dirty state tracking)
- PublishAction (increments version, creates published snapshot in mock repository)
- VersionHistoryPanel (list all versions: version number, published date, published by)
- RollbackAction (restore ViewArtifact from a previous version snapshot)
- UnsavedChangesGuard (warns on route leave if dirty)
- DirtyStateBadge (shows "Unsaved changes" in editor header)

## Out of Scope
- Real audit log persistence, real user identity, real diff viewer

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-17 — Save/Publish/Rollback: PUB-001 through PUB-022 (total 22 requirements)

## Acceptance Criteria (from spec)

- Draft changes do not affect end users until publish
- Published versions are immutable and recoverable
- A failed publish cannot break the active view
- Rollback can restore a known-good view quickly

## Edge Cases (from spec)

- Two admins edit same draft simultaneously
- Entity schema changes between save and publish
- Rollback target references deleted component type
