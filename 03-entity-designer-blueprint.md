# 03 — Entity Designer Blueprint

## 1. Purpose

The Entity Designer is the source-of-truth cockpit for a business object.

It should answer:

> What is this business object, how is it captured, which layer changed it, and what downstream behavior depends on it?

## 2. Primary Users

| User | Needs |
|---|---|
| Platform Architect | Define protected core model and reusable structures |
| Functional Consultant | Configure tenant-specific fields and layout |
| Tenant Admin | Add tenant-required fields and labels |
| Role Admin | Hide or restrict fields for roles |
| QA / Release Reviewer | Validate impact before promotion |

## 3. Entity Designer Layout

```text
Entity Designer: Vehicle Order

┌────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: Add Field | Add From Catalog | Reorder | Preview Role | Save Draft │
├──────────────────────────────────────────────┬─────────────────────────────┤
│ Main Panel                                    │ Inspector                  │
│ Tabs: Schema | Form Layout | Catalog |        │ Selected field details     │
│ Dependencies | Resolved Preview               │ Layer trace                │
│                                                │ Rules using field          │
└──────────────────────────────────────────────┴─────────────────────────────┘
```

## 4. Tabs

| Tab | Purpose |
|---|---|
| Schema | Data model fields, types, validations, source layer |
| Form Layout | Sections, groups, ordering, visibility, UI hints |
| Attribute Catalog | Reusable governed attributes |
| Dependencies | Rules, workflows, permissions, reports using fields |
| Resolved Preview | Final merged entity schema for selected scope |
| Versions | Historical versions and rollback comparison |

## 5. Schema Table Columns

| Column | Example | Notes |
|---|---|---|
| Field | `gstin` | Stable technical name |
| Label | GSTIN | User-facing label |
| Type | text | Must match supported field types |
| Required | Yes | Can be inherited or constrained |
| Source Layer | Tenant | Use layer badge |
| Override Status | Added / Inherited / Overridden | Must be visible |
| Protected | Yes / No | Locked if protected |
| Used By | 2 rules, 1 layout | Click to inspect dependencies |
| Runtime Visibility | Visible / Hidden | Role preview dependent |

## 6. Field Inspector

When a field is selected, show:

| Section | Content |
|---|---|
| Identity | Stable ID, field name, label, description |
| Type | Data type, format, max length, precision |
| Validation | Required, min/max, allowed values, pattern |
| UI Behavior | Section, order, placeholder, help text |
| Overlay Trace | Which layer created or modified it |
| Dependencies | Rules, workflows, permission masks |
| Runtime Preview | Value display under selected role |
| Edit Controls | Create delta, constrain, decorate, disable where permitted |

## 7. Attribute Catalog Panel

The catalog prevents duplicate fields and inconsistent naming.

### Catalog Card

| Field | Example |
|---|---|
| Attribute Code | `vehicle_model` |
| Label | Vehicle Model |
| Domain | Automotive |
| Type | select |
| Owner Layer | Vertical |
| Reusable | Yes |
| Used In | Vehicle Order, Vehicle Booking, Service Job |

### Catalog Actions

| Action | Behavior |
|---|---|
| Add to entity | Creates `extend` delta with stable field ID |
| View usage | Shows all entities using attribute |
| Request new attribute | Draft catalog entry, not active |
| Compare similar | Warns against duplicate fields like `gst_no`, `gstin`, `gst_number` |

## 8. Form Layout Designer

The layout designer should not be confused with the data model. It controls presentation.

### Layout Objects

| Object | Description |
|---|---|
| Section | Group of fields |
| Field Placement | Field position and UI width |
| Tab | Logical grouping |
| Grid | Line item table |
| Visibility Rule | Role or condition-based display behavior |
| Help Text | User guidance |
| Badge / Token | Visual hint only |

## 9. Required UX Safeguards

| Risk | UI Safeguard |
|---|---|
| Removing a field used by rules | Block removal and show dependency list |
| Hiding a required field | Warn and require resolution |
| Changing data type | Show migration/runtime risk warning |
| Editing protected field | Disable edit and show lock reason |
| Creating duplicate field | Suggest catalog attribute |
| Role overlay hiding audit field | Block if protected |
| Tenant narrowing platform enum | Allow only if values are subset |

## 10. Entity Operations

| Operation | Allowed? | Notes |
|---|---|---|
| Add field from catalog | Yes | Preferred path |
| Add local tenant field | Yes | Requires naming validation |
| Rename label | Yes | Use `decorate` delta |
| Rename technical field | No for active field | Must create new field and deprecate old |
| Change field type | Restricted | Draft-only, requires no active dependencies |
| Disable inherited field | Conditional | Not allowed for protected fields |
| Remove field | Rare | Only if policy permits and no dependencies |
| Constrain enum values | Yes | Must narrow, not expand, at downstream layers |
| Hide field by role | Use permission/field mask, not schema deletion |

## 11. Entity Designer Acceptance Criteria

1. User can select `Vehicle Order` and view resolved fields.
2. Every field displays source layer and override status.
3. User can add `GSTIN` from catalog as a tenant field.
4. User cannot edit protected `customer_id`.
5. User can preview as `SALES_EXECUTIVE` and see `cost_price` hidden.
6. User can inspect which rules use `discount_pct`.
7. Removing a field used by a rule is blocked.
8. Saving creates draft delta, not active runtime.
9. Draft change can be added to a release package.
10. Resolved preview changes when tenant/node/role preview changes.
