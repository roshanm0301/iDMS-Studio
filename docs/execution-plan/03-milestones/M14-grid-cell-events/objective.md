# Objective — M14 Grid Cell Change Event Configuration

## Goal
Implement configuration for cell-change-triggered actions within the editable line grid.
When a grid cell value changes, row-level actions execute: set another cell, recalculate
row totals, refresh a lookup, show a warning, or require approval.

## P0 Feature Covered
Grid Cell Change Event Configuration

## Build Scope
- GridCellEventListPanel (list all cell events for the line grid)
- GridCellTriggerSelector (which column triggers the event)
- GridCellActionBuilder (action type + target column + formula/value)
- Action types: set_cell_value / recalculate_row / refresh_lookup / warn / confirm / flag_approval
- MockCellEventSimulator (simulates event in line grid preview)

## Primary Demo Scenarios
- Product cell change → populate UOM, Rate, Tax from mock product data
- Qty or Rate cell change → recalculate Amount (Qty × Rate)
- Discount cell change → warn if discount > threshold (e.g. > 30%)
- High-value amount → flag for approval warning

## Out of Scope
- Real formula engine, real approval workflow

## Hard Constraints
- Frontend only. Mock data only. Named exports only.
