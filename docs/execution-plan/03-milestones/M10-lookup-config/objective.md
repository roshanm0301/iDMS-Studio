# Objective — M10 Lookup / Entity Picker Configuration

## Goal
Implement configuration for entity picker (lookup) fields: which entity to pick from,
what field to display, what field to store as value, which columns appear in the picker
dialog, which fields are searched, and default filter expressions.

## P0 Feature Covered
Lookup / Entity Picker Configuration

## Build Scope
- LookupConfigPanel (per entity-picker field)
- LookupEntitySelector (target entity)
- LookupDisplayFieldSelector (display field from target entity)
- LookupValueFieldSelector (value/ID field from target entity)
- LookupPickerColumnsConfigurator (columns shown in picker dialog)
- LookupSearchFieldsSelector (fields searched in picker)
- LookupDefaultFilterExpression (simple filter string for mock)
- MockLookupPreview (simulated picker dialog)

## Primary Demo Scenarios
- Customer lookup on SaleOrder header (target: entity-customer)
- Product lookup on SaleOrderLine (target: entity-product)

## Out of Scope
- Real API-backed lookup search, real filter expression engine

## Hard Constraints
- Frontend only. Mock data only. Named exports only.
