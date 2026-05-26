# Validations — M0

## Build Checks
- [x] npx vite build passes
- [x] npm run typecheck:ui-studio passes (0 errors)
- [x] npm run lint:ui-studio passes (0 errors)
- [x] npm run test passes (15 tests, 2 test files)

## Functional Checks
- [x] /admin/ui-studio route renders UIStudioListPage placeholder
- [x] Sidebar shows UI Studio nav item with Layers icon
- [x] UIStudioListPage has correct page-head, page-title, page-sub classes
- [x] All 4 route placeholders render without crash
- [x] Mock view repository returns 5 seeded views
- [x] Mock entity metadata includes all 8 required entities
- [x] TanStack Query hooks are defined and exported
- [x] Zustand editor store is defined and exported

## Code Quality Checks
- [x] Named exports only in all UI Studio files
- [x] No default exports in UI Studio files
- [x] No console.log in committed code
- [x] No hardcoded business screens outside mock/demo seed data
- [x] Pre-existing Entity Designer TypeScript errors documented but not fixed

## Notes
- Full npm run typecheck fails due to pre-existing Entity Designer TypeScript errors (not introduced by M0)
- Full npm run lint fails due to pre-existing Entity Designer lint errors (not introduced by M0)
- Use scoped commands (typecheck:ui-studio, lint:ui-studio) for milestone gate validation
