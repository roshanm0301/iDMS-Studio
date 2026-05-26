# Objective — M20 Runtime Renderer Contract

## Goal
Implement the runtime renderer that converts a published ViewArtifact into a functional
end-user page. The renderer is deterministic: same artifact + same context = same UI.
It is completely decoupled from builder-only components and stores.

## P0 Feature Covered
Runtime Renderer Contract

## Build Scope
- RuntimeRenderer root component (accepts ViewArtifact + PreviewContext)
- Surface renderers for all 6 surface types:
  - ListSurfaceRenderer
  - RecordDetailSurfaceRenderer
  - CreateEditSurfaceRenderer
  - RelatedRecordsSurfaceRenderer
  - TransactionWorkspaceSurfaceRenderer
  - DashboardSummarySurfaceRenderer
- ComponentResolver (maps ComponentDefinition to rendered React component)
- FieldRenderer (renders field based on widget type and context)
- GridRenderer (renders list/line grid from ComponentDefinition)
- ActionRenderer (renders action buttons based on placement and visibility)
- RulePipeline (applies BehaviorRules using MockRuleEvaluator in render context)
- MockPermissionPruner (removes components/actions hidden by role)

## Exit Criteria
- Published "Customer List" artifact renders as a functional end-user list page
- Published "Sale Order Entry" artifact renders as a functional transaction workspace page

## Out of Scope
- Real form submission, real data persistence, real navigation
- Custom Component SDK rendering

## Hard Constraints
- Renderer does NOT import from builder components or editor store
- Frontend only. Mock data only. Named exports only.
