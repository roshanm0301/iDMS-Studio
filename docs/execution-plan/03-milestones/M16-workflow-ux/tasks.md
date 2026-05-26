# Tasks — M16

1. Create WorkflowStateConfigurator (add/edit/remove states, assign color and label)
2. Seed SaleOrder workflow states: Draft, Submitted, Approved, Invoiced, Closed, Rejected, Cancelled
3. Create WorkflowStatusStrip component (renders current state indicator in preview)
4. Create WorkflowActionButtonConfigurator (per state: which action buttons are available)
5. Add comment-required flag per action button
6. Add disabled-display configuration for unavailable actions
7. Create WorkflowTimelinePlaceholder (stub component for preview)
8. Wire workflow state to PreviewContext (M18 will use this)
9. Store workflow configuration in ViewArtifact metadata
10. Add tests for WorkflowStateConfigurator and WorkflowStatusStrip
11. Run milestone gate checks and update HANDOFF.md
