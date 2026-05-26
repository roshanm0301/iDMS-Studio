# Objective — M16 Workflow UX Integration

## Goal
Implement mock workflow state visualization and workflow action button configuration for
views that participate in a workflow lifecycle.

## P0 Feature Covered
Workflow UX Integration

## Build Scope
- WorkflowStateConfigurator (list mock states, assign colors/labels)
- WorkflowStatusStrip (visual status bar showing current state in preview)
- WorkflowActionButtonConfigurator (which action buttons appear per state)
- CommentRequiredFlag (mark actions that require a comment on execution)
- DisabledActionDisplay (show disabled state for unavailable actions)
- WorkflowTimelinePlaceholder (read-only timeline stub for preview)

## Mock Workflow States (SaleOrder scenario)
- Draft → Submitted → Approved → Invoiced → Closed
- Side states: Rejected, Cancelled

## Out of Scope
- Real workflow engine, real state machine execution, real transition guards

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-16 — Workflow UX Integration: WFU-001 through WFU-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Workflow status badge renders current state from workflow engine output
- Available workflow commands render as buttons in configured placement zone
- Admin can configure which workflow command zone is primary/secondary
- Workflow states and commands are read from workflow metadata, not hardcoded

## Edge Cases (from spec)

- Workflow not configured for entity (graceful hide)
- Workflow command renamed after view published (warn)
