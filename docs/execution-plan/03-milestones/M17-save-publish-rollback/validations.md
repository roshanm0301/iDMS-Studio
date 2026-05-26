# Validations — M17

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] Making a change sets isDirty = true and shows DirtyStateBadge
- [ ] Save Draft clears isDirty and persists to mock repository
- [ ] Autosave fires 500ms after last change
- [ ] Publish increments version and changes status to published
- [ ] Version history shows all published snapshots
- [ ] Rollback restores prior version artifact and sets isDirty = true
- [ ] UnsavedChangesGuard warns on navigation away with unsaved changes

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
