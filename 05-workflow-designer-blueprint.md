# 05 — Workflow Designer Blueprint

## 1. Purpose

The Workflow Designer models the lifecycle of a business artifact.

It should answer:

> Who can move this entity from one state to another, under what conditions, and what rules must pass before runtime allows it?

## 2. Design Philosophy

Workflow Designer is not a generic automation canvas. It is a **visual state machine with policy gates**.

The canvas should show states and transitions. The side panel should show transition policy.

## 3. Layout

```text
Workflow Designer: Vehicle Order

┌────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: Add State | Add Transition | Validate Paths | Simulate Command     │
├──────────────────────────────────────┬─────────────────────────────────────┤
│ Canvas                               │ Transition Inspector                │
│ DRAFT → SUBMITTED → APPROVED         │ From / To                           │
│        ↘ REJECTED                    │ Command                             │
│                                      │ Allowed Roles                       │
│                                      │ Guard Rules                         │
│                                      │ Before / After Hooks                │
└──────────────────────────────────────┴─────────────────────────────────────┘
```

## 4. Workflow Objects

| Object | Description |
|---|---|
| State | Lifecycle status such as DRAFT, SUBMITTED, APPROVED |
| Transition | Allowed movement from one state to another |
| Command | User/runtime action such as SUBMIT, APPROVE, REJECT |
| Actor Constraint | Role or permission requirement |
| Guard Rule | Rule that must pass for transition |
| Lifecycle Hook | BEFORE_SUBMIT, AFTER_APPROVE, etc. |
| Failure Outcome | Block, warn, reroute, or reject command |
| Side Effect | Notify, start workflow, set field |

## 5. State Node Design

Each state node should show:

| Item | Example |
|---|---|
| State Code | `SUBMITTED` |
| Label | Submitted |
| Type | Normal / Terminal / Exception |
| Incoming count | 2 |
| Outgoing count | 3 |
| Active overlays | Tenant, Role |
| Warning badge | Dead-end, no approver, unguarded |

## 6. Transition Inspector

When a transition is selected, show:

| Section | Fields |
|---|---|
| Identity | Transition ID, label |
| Movement | From state, to state |
| Command | SUBMIT / APPROVE / REJECT / CANCEL |
| Actors | Allowed roles |
| Permissions | Required permission action |
| Guard Rules | Rule references that must pass |
| Before Hook | Rules fired before command |
| After Hook | Notifications or secondary workflow |
| Failure Behavior | Block message or alternative route |
| Overlay Trace | Which layer added or changed transition |
| Simulation | Test this transition with payload/session |

## 7. Workflow Validation

### Structural Checks

| Check | Severity |
|---|---|
| No initial state | Error |
| State unreachable from initial state | Error |
| Non-terminal dead-end state | Warning or error |
| Transition missing command | Error |
| Transition missing allowed role | Warning |
| Duplicate transition command from same state | Warning |
| Transition points to disabled state | Error |

### Policy Checks

| Check | Severity |
|---|---|
| Approval transition has no guard rules | Warning |
| Guard rule action is not compatible with transition | Error |
| Role cannot see required approval fields | Error |
| Rule references missing field | Error |
| Transition blocked for all roles | Error |
| Protected transition disabled by downstream layer | Error |

## 8. Workflow Simulation

### Simulation Inputs

| Input | Example |
|---|---|
| Current State | DRAFT |
| Command | SUBMIT |
| Actor Role | SALES_EXECUTIVE |
| Node | Pune Central |
| Payload | Vehicle order JSON |

### Simulation Output

```text
1. Permission check: ALLOW submit on vehicle_order
2. Field mask applied: cost_price stripped for SALES_EXECUTIVE
3. BEFORE_SUBMIT rules evaluated
4. Rule result: Bajaj Dealer Code Required — PASS
5. Workflow transition DRAFT → SUBMITTED allowed
6. Persist simulation: OK
7. Audit/outbox preview: order_submitted event
```

## 9. Canvas UX

| Feature | Behavior |
|---|---|
| Auto-layout | Default layout should be readable without manual positioning |
| Manual drag | Allow drag to improve readability |
| Edge labels | Show command name |
| Error badges | Display validation errors on state/transition |
| Minimap | Useful for large workflows |
| Zoom | Fit, zoom in/out |
| Filter | Show only transitions for selected role |
| Layer coloring | Optional subtle layer indicator |

## 10. Difference from Salesforce-Style Flow

Do not model every automation as a free-form flow. In IDMS:

- States are explicit.
- Transitions are governed.
- Rules fire at lifecycle hooks.
- Permissions and field masks apply before rules.
- Runtime uses compiled artifacts.

The visual model must reflect this sequence.

## 11. Workflow Designer Acceptance Criteria

1. User can view Vehicle Order lifecycle as a canvas.
2. User can select transition `DRAFT → SUBMITTED`.
3. Inspector shows allowed roles, command, guard rules, and hooks.
4. User can add a new state as draft.
5. User can add a transition as draft.
6. Validation detects unreachable state.
7. Simulation evaluates permission, field mask, rules, and transition.
8. Overlay trace shows which layer added a transition.
9. Protected transitions cannot be disabled downstream.
10. Workflow changes can be added to a release package.
