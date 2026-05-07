# 04 — Rule Builder Blueprint

## 1. Purpose

The Rule Builder is a governed policy authoring tool.

It should answer:

> What policy is being enforced, what risk does it mitigate, when does it fire, and what happens when the condition is true?

## 2. Rule Builder Modes

The Rule Builder has three synchronized modes.

| Mode | User | Purpose |
|---|---|---|
| Guided Policy Mode | Functional consultant | Business-friendly rule creation |
| Condition Tree Mode | Architect / advanced admin | Precise nested logic |
| JSON Preview Mode | Architect / reviewer | Exact DSL inspection |

JSON Preview should be read-only by default. Expert editing can be allowed later, but must be permission-gated.

## 3. Rule Required Fields

Every rule editor must capture:

| Field | Required | Notes |
|---|---|---|
| Business Intent | Yes | One sentence |
| Risk Mitigated | Yes | What can go wrong without rule |
| Rule Name | Yes | Human-readable |
| Rule ID | Yes | Stable ID |
| Entity Type | Yes | Example: `vehicle_order` |
| Trigger | Yes | Must use supported lifecycle trigger |
| Layer | Yes | Platform, Vertical, Tenant, Node, Role |
| Priority | Yes | Lower number runs first |
| Enabled | Yes | Draft/active state handled separately |
| Condition | Yes | DSL condition tree |
| Action | Yes | Explicit outcome |
| Message | Conditional | Required for BLOCK/WARN/NOTIFY |
| Simulation Cases | Strongly recommended | At least one positive and one negative case |

## 4. Supported Triggers

Use only the platform-supported triggers:

| Trigger | Typical Use |
|---|---|
| `BEFORE_CREATE` | Mandatory fields/defaulting before create |
| `BEFORE_UPDATE` | Update validation |
| `BEFORE_SUBMIT` | Submission gate |
| `BEFORE_APPROVE` | Approval gate |
| `BEFORE_CANCEL` | Cancellation gate |
| `BEFORE_DELETE` | Soft-delete gate |
| `AFTER_CREATE` | Notification or secondary process |
| `AFTER_SUBMIT` | Post-submit notification/routing |
| `AFTER_APPROVE` | Post-approval action |
| `ON_FIELD_CHANGE` | Field-level UI/defaulting behavior |

## 5. Supported Condition Operators

### Comparison

`EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `NOT_IN`, `CONTAINS`, `IS_NULL`, `IS_NOT_NULL`

### Logical

`AND`, `OR`, `NOT`

Do not introduce unsupported operators such as `BETWEEN` unless the backend DSL is extended first.

## 6. Supported Action Types

Use only supported action types:

| Action | UI Meaning |
|---|---|
| `BLOCK` | Hard stop; command fails |
| `WARN` | Yellow warning; command can continue |
| `SET_FIELD` | Mutates payload before persist |
| `ROUTE` | Overrides workflow transition target |
| `START_WORKFLOW` | Starts secondary workflow |
| `NOTIFY` | Queues notification via outbox |

Avoid generic labels like `allow`, `deny`, or `require-field` in the rule JSON unless they are mapped explicitly to supported action types.

## 7. Guided Policy Mode

Guided mode uses policy templates.

### Template Examples

| Template | Generates |
|---|---|
| Required before submit | `IS_NULL` + `BLOCK` |
| Amount threshold approval | `GT` + `ROUTE` or `BLOCK` |
| Role approval limit | `AND(session.role, amount)` + `BLOCK` |
| High discount warning | `GT(discount_pct)` + `WARN` |
| Auto-set value | condition + `SET_FIELD` |
| Notify on approval | trigger + `NOTIFY` |

### Guided Policy Flow

1. Select policy template.
2. Select entity field.
3. Select trigger.
4. Define threshold or value.
5. Select action.
6. Write business intent and risk mitigated.
7. Preview rule sentence.
8. Run simulation.
9. Save draft.

## 8. Condition Tree Mode

Visual tree structure:

```text
AND
 ├── GT(vehicle_order.total_amount, 500000)
 └── EQ(session.role, SALES_EXECUTIVE)
ACTION: BLOCK
```

### Condition Node Controls

| Control | Behavior |
|---|---|
| Add condition | Adds comparison node |
| Add group | Adds AND / OR group |
| Negate | Wraps selected condition with NOT |
| Field selector | Uses entity schema and related references |
| Operator selector | Shows only valid operators by field type |
| Value input | Type-aware literal editor |
| Path preview | Shows exact DSL path |
| Evaluate node | Tests selected condition against payload |

## 9. JSON Preview Mode

Display exact DSL JSON.

### Requirements

| Requirement | Behavior |
|---|---|
| Read-only by default | Prevent accidental invalid JSON |
| Syntax highlighting | Use monospace code panel |
| Copy button | Allows copying DSL |
| Validation status | Shows valid/invalid with error location |
| Diff view | Compare inherited vs drafted rule |
| Layer trace | Show source layer and overrides |

## 10. Simulation Panel

Simulation is always available.

### Inputs

| Input | Example |
|---|---|
| Entity Type | `vehicle_order` |
| Trigger | `BEFORE_APPROVE` |
| Payload | Vehicle order JSON |
| Session | Role, tenant, node |
| Related Data | Customer credit limit, inventory state |

### Outputs

| Output | Example |
|---|---|
| Matched? | Yes |
| Action | BLOCK |
| Message | Sales Executive cannot approve orders above ₹5L |
| Rules Evaluated | Ordered by priority |
| Short-circuit | Yes / No |
| Warnings | List |
| SET_FIELD mutations | Before/after |
| Workflow impact | Transition allowed / blocked / rerouted |

## 11. Rule List Table

When listing multiple rules, use this format.

| Rule Name | Entity Type | Trigger | Action Type | Layer | Priority |
|---|---|---|---|---|---|
| Minimum Line Items Required | vehicle_order | BEFORE_SUBMIT | BLOCK | Platform | 5 |
| Automotive Vehicle Model Required | vehicle_order | BEFORE_SUBMIT | BLOCK | Vertical | 10 |
| Bajaj Dealer Code Required | vehicle_order | BEFORE_SUBMIT | BLOCK | Tenant | 20 |
| Sales Executive Approval Limit | vehicle_order | BEFORE_APPROVE | BLOCK | Role | 5 |

## 12. Rule Builder Acceptance Criteria

1. User can create a rule through Guided Policy Mode.
2. User can inspect the generated condition tree.
3. JSON preview uses supported DSL operators and actions only.
4. User must enter business intent and risk mitigated.
5. Rule layer is explicit before save.
6. Rule save creates draft, not active runtime.
7. Simulation shows ordered rule evaluation.
8. BLOCK short-circuit is shown.
9. WARN accumulates without blocking.
10. Rule can be added to release package after validation.
