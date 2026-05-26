# Validations — M1

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] View list renders 5 seeded views from mock repository via TanStack Query
- [ ] Search filters views by label
- [ ] Filter by surface type works
- [ ] View status is visually clear (Draft / Published / Needs Attention) via ViewStatusBadge
- [ ] Create Draft dialog opens, form validates, new view appears in list
- [ ] Clicking a view navigates to /admin/ui-studio/editor/:viewId
- [ ] No backend calls are made

## Code Quality Checks
- [ ] Named exports only
- [ ] No default exports
- [ ] No new unapproved dependencies
- [ ] No console.log in committed code
