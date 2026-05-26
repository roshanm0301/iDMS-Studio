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
