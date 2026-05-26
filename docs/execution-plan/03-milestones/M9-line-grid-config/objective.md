# Objective — M9 Line Grid Configuration

## Goal
Implement the editable line grid configuration panel for transaction workspace views.
The line grid is bound to a line entity (e.g. SaleOrderLine) and supports inline editing.

## P0 Feature Covered
Line Grid Configuration

## Build Scope
- LineGridConfigPanel (per-column: field, label, width, editable, required, renderer)
- LineGridColumnConfigurator with add/remove/reorder
- LineGridPreview (mock editable grid with sample SaleOrderLine records)
- Row-level required field enforcement configuration
- Aggregate/total column placeholders
- Add row / delete row behavior flags

## Primary Demo Scenario
- Line entity: SaleOrderLine
- Columns: Product, Qty, UOM, Rate, Discount, Tax, Amount

## Out of Scope
- Real inline save, real tax computation

## Hard Constraints
- Frontend only. Mock data only. Named exports only.

## Requirement IDs

P0-09 — Line Grid Configuration: LINE-001 through LINE-024 (total 24 requirements)

## Acceptance Criteria (from spec)

- Admin can configure line grid columns for a transaction workspace
- Admin can set editable columns, widget types, and column order
- Line grid validates that each column references a valid line entity field
- Adding/removing footer totals is declarative

## Edge Cases (from spec)

- Line entity has no numeric fields for totals
- Editable column references read-only field (warn)
