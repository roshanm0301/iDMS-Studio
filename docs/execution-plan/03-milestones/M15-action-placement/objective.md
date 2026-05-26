# Objective — M15 Action Placement Configuration

## Goal
Implement the action registry and placement configuration. Admins define actions, assign
them to placement zones, and configure their type, label, icon, and visibility rules.

## P0 Feature Covered
Action Placement Configuration

## Build Scope
- ActionRegistryPanel (list all actions for the view)
- ActionConfigurator (label, icon, type, placement, visibility condition placeholder)
- Placement zones: toolbar / row_action / form_footer / section / grid_toolbar / quick_action
- Action types: navigate / save_draft / submit / open_modal / show_confirmation / mock_command
- ActionPlacementPreview (shows actions in correct zones in preview canvas)
- Visibility condition placeholder (links to behavior rules from M12)

## Out of Scope
- Real action execution, real navigation routing, real modal content

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-15 — Action Placement: ACT-001 through ACT-021 (total 21 requirements)

## Acceptance Criteria (from spec)

- Admin can place registered actions in header toolbar, form toolbar, row actions, or bulk action zones
- Action placement is validated against approved action registry
- Actions can be conditionally hidden by behavior rules
- Primary vs secondary action styling is configurable

## Edge Cases (from spec)

- Action removed from registry after placed in view (blocked on publish)
- Conflicting primary action placement (warn)
