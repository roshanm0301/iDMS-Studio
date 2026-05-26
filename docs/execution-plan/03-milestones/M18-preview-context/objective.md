# Objective — M18 Preview with Context Simulation

## Goal
Implement the preview context panel that lets admins simulate different execution contexts
and see how the view renders for a specific role, device, workflow state, and sample record.

## P0 Feature Covered
Preview with Context Simulation

## Build Scope
- PreviewContextPanel (collapsible side panel in editor)
- RoleSelector (Admin, Sales, Finance, Viewer mock personas)
- DeviceSelector (desktop / tablet / mobile)
- WorkflowStateSelector (states from M16 configuration)
- SampleRecordSelector (pick a mock record to simulate)
- PreviewModeToggle (builder mode vs runtime preview mode)
- Live preview area that re-renders on context change

## Out of Scope
- Real user sessions, real device detection, real record fetching

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-18 — Preview with Context Simulation: PRE-001 through PRE-022 (total 22 requirements)

## Acceptance Criteria (from spec)

- Admin can preview a draft as Sales Executive, Finance Manager, or Service Manager before publish
- Admin can see which fields/actions disappear due to permissions or workflow state
- Preview cannot accidentally create/update/delete production records

## Edge Cases (from spec)

- No sample record exists
- Permission service unavailable
- Workflow state simulation conflicts with record status
