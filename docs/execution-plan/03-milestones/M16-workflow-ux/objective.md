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
