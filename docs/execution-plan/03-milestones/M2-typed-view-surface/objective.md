# Objective — M2 Typed View Surface Designer

## Goal
Implement surface type selection and surface-specific configuration so every view has an
explicit type and only relevant configuration options appear.

## P0 Feature Covered
Typed View Surface Designer

## Build Scope
- View type selector (6 surface types)
- Surface-specific setup panels (different config fields per type)
- Surface compatibility rules and validation
- Basic validation for required surface context

## Supported Surface Types
- list, record_detail, create_edit, related_records, transaction_workspace, dashboard_summary

## Out of Scope
- External URL View (P1)
- Free-form custom page
- Portal/mobile-specific builders

## Hard Constraints
- Frontend only. Mock data only. No backend APIs. Named exports only.

## Requirement IDs

P0-02 — Typed View Surface Designer: SUR-001 through SUR-020 (total 20 requirements)

## Acceptance Criteria (from spec)

- Admin can select surface type during view creation and in the editor
- Surface type is immutable after publish
- Each surface type has its own context contract fields validated during publish
- Surface type controls which layout options are available

## Edge Cases (from spec)

- Admin tries to change surface type after publish (blocked)
- Surface type conflicts with selected entity (warn)
