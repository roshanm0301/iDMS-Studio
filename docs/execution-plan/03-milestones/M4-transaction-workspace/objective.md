# Objective — M4 Header-Line Transaction Workspace Builder

## Goal
Implement the native builder for enterprise transaction screens: header form, editable line
grid, totals panel, and action/status areas. Primary scenario: SaleOrder + SaleOrderLine.

## P0 Feature Covered
Header-Line Transaction Workspace Builder

## Build Scope
- Header entity selection
- Line entity selection + relationship mapping
- Header sections configuration
- Line grid columns configuration
- Totals panel configuration
- ViewCode configuration
- Transaction workspace canvas preview

## Out of Scope
- Real multi-entity save, real tax calculation, real workflow execution

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-04 — Header-Line Transaction Workspace: TXN-001 through TXN-025 (total 25 requirements)

## Acceptance Criteria (from spec)

- Admin can build a transaction view with a header entity and a line entity
- Line entity must have a relationship to the header entity
- Line grid shows line fields; header section shows header fields
- Totals section is optional and declarative

## Edge Cases (from spec)

- No valid line entity relationship exists
- Line entity removed from schema after view saved
- Recursive totals definition
