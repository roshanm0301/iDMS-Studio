# Objective — M11 Data Source & Filter Override

## Goal
Implement data source configuration and view-level filter overrides. Each view can
declare its primary data source, related data sources, and field-level lookup overrides
that restrict or change what data is shown.

## P0 Feature Covered
Data Source & Filter Override

## Build Scope
- DataSourceRegistryPanel (list of data sources per view)
- DataSourceConfigurator (primary / related / static / mock-api types)
- FieldLookupOverrideConfigurator (per-field data source override)
- ViewFilterOverrideConfigurator (view-level filter expression override)
- DataSourcePreview (shows what records would be returned with mock data)

## Primary Demo Scenarios
- Product field default: all products (entity-product, no filter)
- Vehicle Booking override: only vehicle-type products (filter: productType = 'vehicle')
- Branch context filter: products filtered by branch

## Out of Scope
- Real query builder, real SQL expression parser, real API-backed sources

## Hard Constraints
- Frontend only. Mock data only. Named exports only.
