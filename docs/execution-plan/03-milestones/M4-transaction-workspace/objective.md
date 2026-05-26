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
