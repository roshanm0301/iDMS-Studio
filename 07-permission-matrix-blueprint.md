# 07 — Permission Matrix Blueprint

## 1. Purpose

The Permission Matrix controls who can perform which actions, which fields they can see, and which rows they can access.

It should answer:

> For this artifact and role, what can the user do, what can they see, and which records are in scope?

## 2. Permission Tabs

| Tab | Purpose |
|---|---|
| Action Access | Role × resource × action matrix |
| Field Visibility | Role × field visibility matrix |
| Row Filters | Role-based record scope rules |
| Effective Preview | Runtime permission result for selected role |
| Change Impact | What behavior changes if permission is modified |

## 3. Action Access Matrix

Rows are roles. Columns are resources/actions.

Example:

| Role | Create | Read | Update | Submit | Approve | Reject | Delete |
|---|---|---|---|---|---|---|---|
| SALES_EXECUTIVE | Allow | Allow | Allow Own | Allow | Deny | Deny | Deny |
| SALES_MANAGER | Allow | Allow | Allow | Allow | Allow <= ₹10L | Allow | Deny |
| DEALER_PRINCIPAL | Allow | Allow | Allow | Allow | Allow | Allow | Deny |
| OEM_ADMIN | Allow | Allow | Allow | Allow | Allow | Allow | Allow |

## 4. Field Visibility Matrix

Field-level access should use the existing convention:

```text
resource_ref = entity artifact name
action_ref   = field:{fieldName}
effect       = ALLOW | DENY
role_ref     = role name
```

Example:

| Field | SALES_EXECUTIVE | SALES_MANAGER | DEALER_PRINCIPAL | OEM_ADMIN |
|---|---|---|---|---|
| customer_id | Allow | Allow | Allow | Allow |
| total_amount | Allow | Allow | Allow | Allow |
| cost_price | Deny | Allow | Allow | Allow |
| margin_pct | Deny | Allow | Allow | Allow |
| gstin | Allow | Allow | Allow | Allow |

## 5. Row Filters

Row-level filters should use the convention:

```text
resource_ref = entity artifact name
action_ref   = row_filter
effect       = ALLOW
role_ref     = role name
conditions   = expression string
```

Example:

| Role | Resource | Condition | Meaning |
|---|---|---|---|
| SALES_EXECUTIVE | Vehicle Order | `created_by = {actor.user_id}` | Own records only |
| SALES_MANAGER | Vehicle Order | `node_id = {actor.node_id}` | Branch records |
| DEALER_PRINCIPAL | Vehicle Order | `tenant_id = {actor.tenant_id}` | Tenant records |
| OEM_ADMIN | Vehicle Order | `true` | Full access |

## 6. Effective Preview

The user should be able to select:

```text
Role: SALES_EXECUTIVE
Node: Pune Central
Entity: Vehicle Order
Command: APPROVE
Record: VO-1001
```

The preview should show:

```text
Action access: DENY approve
Field mask: cost_price hidden, margin_pct hidden
Row filter: created_by = current user
Result: User cannot approve this order
```

## 7. Permission + Rule Interaction

Permissions are checked before rules in the command pipeline. The UI must expose this.

Example:

If SALES_EXECUTIVE cannot approve Vehicle Order, then a BEFORE_APPROVE rule for SALES_EXECUTIVE approval limit may never run for that user because permission fails first.

Impact Panel should say:

> This role is denied APPROVE. Related approval rules may not execute for this role.

## 8. Permission UX Safeguards

| Risk | Safeguard |
|---|---|
| Required field hidden | Show error |
| Approval allowed but approver cannot see approval fields | Show error |
| Row filter too broad | Show warning |
| Row filter invalid syntax | Block save |
| All roles denied submit | Show workflow-breaking error |
| Field mask hides protected audit field | Block |
| Tenant admin grants OEM-only action | Block by permission boundary |

## 9. Permission Editing Rules

1. Roles must load dynamically.
2. Resources must include entity artifacts dynamically.
3. Field list must come from resolved entity schema.
4. Permission changes create draft artifacts/deltas.
5. Effective preview must include layer context.
6. Deny should be explicit and visible.
7. No role should silently inherit dangerous access.
8. Every high-risk permission change requires reason.

## 10. Permission Matrix Acceptance Criteria

1. User can select Vehicle Order resource.
2. Roles are listed dynamically from seed/API.
3. Actions show Allow/Deny/Conditional states.
4. Field Visibility tab shows fields from resolved schema.
5. Row Filters tab allows adding a condition per role.
6. Effective preview shows action, field, and row access.
7. UI blocks hidden required field conflict.
8. UI warns when approve is denied but workflow expects role.
9. Changes are saved as draft.
10. Draft can be added to release package.
