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
