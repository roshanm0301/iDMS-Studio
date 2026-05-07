# 08 — Release Governance and Simulation

## 1. Purpose

Release Governance ensures configuration changes are treated with the same discipline as code changes.

It should answer:

> What changes are being promoted, what do they affect, have they been simulated, have they compiled, who approved them, and how can they be rolled back?

## 2. Core Principle

Save is not activation.

Configuration changes move through this flow:

```text
Edit Draft → Simulate → Validate Compile → Add to Release Package
→ Submit Approval → Promote to UAT → Promote to Production → Activate → Monitor
```

## 3. Change Set / Release Package

A release package groups related metadata changes.

### Package Can Include

| Artifact Type | Example |
|---|---|
| Entity delta | Add GSTIN field to Vehicle Order |
| Rule change | Block submit if GSTIN missing |
| Workflow change | Add Sales Manager Review state |
| Permission change | Hide cost_price from SALES_EXECUTIVE |
| Overlay delta | Node-level discount constraint |
| Theme change | Tenant color update |

## 4. Release Package Header

| Field | Example |
|---|---|
| Release ID | `rel.bajaj.vehicle-order-governance.v1` |
| Name | Bajaj Vehicle Order Governance v1 |
| Environment | Dev |
| Target Environment | UAT |
| Status | Draft |
| Owner | Functional Consultant |
| Risk | Medium |
| Approval Required | Yes |
| Created At | 2026-04-28 |

## 5. Release Package Items

| Item | Artifact | Layer | Type | Risk | Status |
|---|---|---|---|---|---|
| Add GSTIN | entity.vehicle_order | Tenant | Entity Delta | Medium | Validated |
| Dealer Code Rule | rule.vehicle_order.bajaj_dealer_code_required | Tenant | Rule | High | Simulated |
| Cost Price Field Mask | permission.vehicle_order.sales_executive | Role | Permission | Medium | Validated |
| Sales Manager Review | workflow.vehicle_order | Tenant | Workflow | Medium | Needs Simulation |

## 6. Always-On Impact Panel

During editing, show lightweight impact continuously.

### Impact Categories

| Category | Example |
|---|---|
| Field dependencies | `discount_pct` used by 2 rules |
| Workflow dependencies | `BEFORE_APPROVE` rules guard APPROVE transition |
| Permission impact | `cost_price` hidden for SALES_EXECUTIVE |
| Overlay conflicts | Node delta narrows tenant value |
| Compile warnings | Missing field reference |
| Release readiness | 3 of 5 checks passed |

## 7. Full Pre-Promotion Validation

Before promotion, run full validation.

### Validation Pipeline

```text
1. Artifact schema validation
2. Overlay merge validation
3. Protected node validation
4. Entity dependency validation
5. Rule DSL validation
6. Rule simulation validation
7. Workflow path validation
8. Permission consistency validation
9. Compiled preview generation
10. Approval readiness check
```

## 8. Validation Results

| Result Type | Meaning | Promotion Impact |
|---|---|---|
| Pass | No issue | Can promote |
| Warning | Risk exists but allowed | Requires acknowledgement |
| Error | Invalid or unsafe | Blocks promotion |
| Approval Required | High-risk change | Requires approver |
| Simulation Missing | No test case | Blocks or warns based on policy |

## 9. Simulation Suite

A release package should contain simulation cases.

### Simulation Case Fields

| Field | Example |
|---|---|
| Case ID | `sim.vehicle_order.submit.missing_gstin` |
| Entity Type | `vehicle_order` |
| Trigger / Command | `SUBMIT` |
| Payload | Vehicle order JSON |
| Session | Sales Executive at Pune |
| Expected Result | BLOCK |
| Expected Message | GSTIN is required |
| Status | Pass / Fail / Not Run |

### Required Simulation Cases

For each high-risk rule or transition, include:

1. Positive case where command succeeds
2. Negative case where command blocks
3. Role boundary case
4. Node/tenant overlay case
5. Field mask case if permissions are involved

## 10. Approval Model

| Release Risk | Approval |
|---|---|
| Low | Functional lead approval |
| Medium | Tenant admin approval |
| High | Platform/OEM admin approval |
| Protected area touched | Platform architect approval |
| Production promotion | Explicit approval required |

## 11. Promotion States

| State | Meaning |
|---|---|
| Draft | Package being assembled |
| Validating | Checks running |
| Validation Failed | Blocking issue |
| Ready for Approval | All checks pass or acknowledged |
| Approved | Approved for target environment |
| Promoted to UAT | Available for UAT testing |
| Promoted to Production | Available for production activation |
| Active | Runtime is using compiled artifacts |
| Rolled Back | Previous compiled version restored |
| Deprecated | Package closed and superseded |

## 12. Rollback

Rollback should restore the previous compiled artifact set for the affected scope.

UI must show:

1. Current active package
2. Previous active package
3. Artifacts affected
4. Rollback risk
5. Required approval
6. Post-rollback simulation cases

## 13. Release Governance Acceptance Criteria

1. User can create a release package.
2. User can add entity, rule, workflow, permission, and overlay changes.
3. Validation shows pass/warning/error results.
4. Blocking errors prevent promotion.
5. Simulation cases can be run from package.
6. Package shows compile preview.
7. Approval status is visible.
8. Promotion to UAT and Production are separate steps.
9. Activation is separate from save.
10. Rollback path is visible for active package.
