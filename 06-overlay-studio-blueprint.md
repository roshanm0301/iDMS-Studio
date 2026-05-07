# 06 — Overlay Studio Blueprint

## 1. Purpose

Overlay Studio makes the IDMS customization architecture visible and safe.

It should answer:

> Which layer contributed this behavior, what delta changed it, what is protected, and what will runtime see after compilation?

## 2. Design Philosophy

Overlay must not be hidden. It also must not dominate the user's mental model.

Use a hybrid approach:

1. Designers show resolved artifacts.
2. Every item shows layer and override status.
3. Overlay Studio provides detailed trace, delta editing, and merge preview.

## 3. Overlay Layers

| Priority | Layer | Example |
|---:|---|---|
| 1 | Platform | customer_id, amount, audit fields |
| 2 | Vertical | vehicle_model for Automotive |
| 3 | Tenant | Bajaj dealer code and GSTIN |
| 4 | Node | Pune branch regional tax field |
| 5 | Role | SALES_EXECUTIVE hides cost_price |

Higher-priority layers can add or narrow behavior. They should not replace whole artifacts.

## 4. Overlay Studio Layout

```text
Overlay Studio: Vehicle Order

┌────────────────────────────────────────────────────────────────────────────┐
│ Artifact Picker | Layer Context | Operation | Save Draft Delta              │
├───────────────────────┬──────────────────────────────┬─────────────────────┤
│ Layer Stack           │ Delta Editor                 │ Resolved Preview    │
│ Platform              │ Operation: constrain          │ Final merged JSON    │
│ Vertical              │ Path: fields.discount_pct     │ Diff view            │
│ Tenant                │ Value: max = 7                │ Compile warnings     │
│ Node                  │                              │                     │
│ Role                  │                              │                     │
└───────────────────────┴──────────────────────────────┴─────────────────────┘
```

## 5. Layer Stack View

Each layer should show:

| Field | Example |
|---|---|
| Layer | Tenant |
| Scope | Bajaj Auto |
| Delta Count | 4 |
| Last Changed | 2026-04-28 |
| Status | Draft / Active / Compile Error |
| Author | Functional Consultant |
| Protected Conflicts | 0 |

Clicking a layer shows its deltas.

## 6. Delta Operations

Use the platform operation vocabulary.

| Operation | What It Does | UI Example |
|---|---|---|
| `extend` | Adds field, section, transition, policy | Add GSTIN field |
| `replace` | Replaces named property | Change field label |
| `disable` | Marks inherited node inactive | Disable optional notes field |
| `remove` | Physically removes where permitted | Remove tenant-only field |
| `constrain` | Narrows values, states, limits | Max discount 7% |
| `decorate` | Adds labels, hints, visual tokens | Add help text |
| `append` | Ordered insertion after inherited items | Add section after Pricing |
| `prepend` | Ordered insertion before inherited items | Add warning section before Submit |

## 7. Delta Editor Fields

| Field | Required | Notes |
|---|---|---|
| Artifact Key | Yes | Selected from registry, not free text |
| Layer | Yes | Current edit layer |
| Scope ID | Yes | Tenant/node/role specific |
| Operation | Yes | One of supported operations |
| Target Path | Yes | Stable-ID path |
| Value | Conditional | JSON value or form fields |
| Reason | Yes | Governance note |
| Risk Classification | Yes | Low, Medium, High |
| Protected Override Check | Automatic | Blocks invalid changes |

## 8. Resolved Preview

The resolved preview should show:

1. Final merged JSON
2. Human-readable summary
3. Diff from active compiled artifact
4. Source layer per node
5. Protected node warnings
6. Compile readiness

## 9. Trace Example

```text
vehicle_order.fields.gstin
  Platform: not present
  Vertical: not present
  Tenant: extended field, required = true
  Node: no change
  Role: visible
Result: Visible and required for Bajaj users
```

## 10. Conflict Types

| Conflict | Example | Outcome |
|---|---|---|
| Protected override | Role tries to hide audit field | Block |
| Type conflict | Tenant changes number to text | Block or high-risk |
| Constraint widening | Node expands tenant enum | Block |
| Duplicate stable ID | Two deltas add same field ID | Error |
| Broken reference | Rule references removed field | Error |
| Order conflict | Append after missing field | Error |
| Permission contradiction | Field required but hidden | Error |

## 11. Overlay UX Rules

1. Never ask users to type artifact keys manually.
2. Always show resolved preview before save.
3. Always show which layer the draft delta belongs to.
4. Always require reason for high-impact delta.
5. Never allow downstream layer to override protected node.
6. Prefer `decorate` for label/help changes.
7. Prefer `constrain` for narrowing allowed values.
8. Use `disable` instead of destructive delete when inherited.
9. Keep raw JSON available but not mandatory.
10. Every delta must be auditable.

## 12. Overlay Studio Acceptance Criteria

1. User can select `entity.vehicle_order` from dropdown.
2. User can see Platform, Vertical, Tenant, Node, Role stack.
3. User can inspect all deltas contributing to GSTIN.
4. User can create a tenant `extend` delta.
5. User can create a node `constrain` delta.
6. UI blocks override of protected `customer_id`.
7. Resolved preview updates after draft delta.
8. Diff shows before/after at property level.
9. Compile warnings appear before release.
10. Draft deltas can be added to release package.
