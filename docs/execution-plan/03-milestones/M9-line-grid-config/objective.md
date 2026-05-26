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
