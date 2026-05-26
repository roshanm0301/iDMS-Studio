# Validations — M15

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] SaleOrder entry actions configurable: Save Draft (toolbar), Submit (toolbar), Approve (toolbar), Reject (toolbar), Print (quick_action)
- [ ] Customer list row action configurable: Edit, Delete
- [ ] All 6 placement zones available and visible in preview
- [ ] All 6 action types selectable
- [ ] Visibility condition placeholder linkable to behavior rule
- [ ] Actions stored in ViewArtifact.actions

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
