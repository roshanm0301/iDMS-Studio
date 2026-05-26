# Validations — M16

## Build Checks
- [ ] npm run test passes
- [ ] npm run typecheck:ui-studio passes
- [ ] npm run lint:ui-studio passes
- [ ] npx vite build passes

## Functional Checks
- [ ] SaleOrder workflow states (Draft, Submitted, Approved, Invoiced, Closed, Rejected, Cancelled) configurable
- [ ] WorkflowStatusStrip renders in canvas preview with current state highlighted
- [ ] Per-state action buttons configurable (e.g. Submitted state → Approve, Reject buttons)
- [ ] Comment-required flag configurable per action
- [ ] Disabled actions rendered visually distinct in preview
- [ ] WorkflowTimelinePlaceholder renders in preview
- [ ] Workflow config stored in ViewArtifact metadata

## Code Quality Checks
- [ ] Named exports only. No console.log. No unapproved deps.
