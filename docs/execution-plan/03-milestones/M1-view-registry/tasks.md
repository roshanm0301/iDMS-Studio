# Tasks — M1

1. Inspect EntityListPage.tsx for card/list/filter pattern to reuse
2. Create/update TypeScript types if needed (ViewSummary already defined in M0)
3. Implement UIStudioListPage with real view list from useViewListQuery
4. Create ViewStatusBadge component
5. Create ViewRegistryToolbar (search + filters)
6. Create ViewRegistryCards or ViewRegistryTable
7. Create CreateViewDraftDialog using Radix UI Dialog + React Hook Form
8. Wire useCreateViewMutation to dialog submit
9. Wire navigation to /admin/ui-studio/editor/:viewId
10. Add smoke test for UIStudioListPage (renders views from query)
11. Add unit test for ViewStatusBadge
12. Add integration test for CreateViewDraftDialog (creates draft, appears in list)
13. Run npm run test && npm run typecheck:ui-studio && npm run lint:ui-studio
14. Update HANDOFF.md
