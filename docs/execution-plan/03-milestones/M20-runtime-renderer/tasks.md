# Tasks — M20

1. Create RuntimeRenderer component in src/lib/ui-studio/renderer/RuntimeRenderer.tsx
2. Create surface renderer switch (routes to correct surface renderer by surfaceType)
3. Create ListSurfaceRenderer (renders grid from ViewArtifact, mock data from repository)
4. Create RecordDetailSurfaceRenderer (renders form from ViewArtifact, selected record)
5. Create CreateEditSurfaceRenderer (renders editable form, no real submit)
6. Create RelatedRecordsSurfaceRenderer (renders related records panel)
7. Create TransactionWorkspaceSurfaceRenderer (header form + line grid + totals)
8. Create DashboardSummarySurfaceRenderer (stat cards + chart placeholders)
9. Create ComponentResolver (maps ComponentDefinition.type to React component)
10. Create FieldRenderer (renders by widget type: text, currency, date, toggle, etc.)
11. Create GridRenderer (renders column headers + rows from mock data)
12. Create ActionRenderer (renders action buttons per placement zone, filters by visibility)
13. Create RulePipeline (wraps MockRuleEvaluator, applies effects to rendered components)
14. Create MockPermissionPruner (removes items not visible to current role)
15. Wire UIStudioRuntimePreviewPage to RuntimeRenderer (full page preview)
16. Verify Customer List renders as end-user list page
17. Verify Sale Order Entry renders as end-user transaction workspace
18. Add tests for RuntimeRenderer with Customer List and Sale Order Entry artifacts
19. Run milestone gate checks and update HANDOFF.md
