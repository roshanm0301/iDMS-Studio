# 09C - Workflow and Approval Testing and Simulation PRD

## 1. Feature Overview

Workflow and Approval Simulation allows admins, process owners, implementation consultants, QA, and support users to test workflow paths, approval routing, SLA behavior, escalation behavior, and error handling before publishing workflow or approval policies.

Simulation must use the same rule and resolver logic as runtime but must not create real workflow tasks, send real notifications, update real transactions, or post integration events.

## 2. Business Objective

Prevent broken workflows, unresolved approvers, invalid approval matrices, incorrect SLA behavior, and unsafe approval policies from reaching production.

## 3. Scope

### In Scope

- Workflow path simulation
- Approval requirement simulation
- Approval path resolution simulation
- Approver resolver simulation
- Maker-checker simulation
- SLA and escalation simulation
- Gateway condition simulation
- Service task mock response simulation
- Negative path testing
- Regression scenario packs
- Publish readiness checks
- Simulation audit

### Out of Scope

- Creating real transaction records
- Creating real approval tasks
- Sending real notifications by default
- Updating real document status
- Posting real accounting/inventory/tax events
- Load testing as part of admin simulation UI

## 4. Functional Requirements

### 4.1 Simulation Setup

| ID | Requirement | Priority |
|---|---|---|
| WFS-SIM-001 | The system shall allow authorized users to simulate draft workflow definitions. | MVP |
| WFS-SIM-002 | The system shall allow authorized users to simulate draft approval policies. | MVP |
| WFS-SIM-003 | The system shall allow simulation using sample payload, existing document snapshot, or manually entered test data. | MVP |
| WFS-SIM-004 | Simulation shall use same condition engine and approver resolver logic as runtime. | MVP |
| WFS-SIM-005 | Simulation shall run without side effects. | MVP |
| WFS-SIM-006 | Simulation shall show workflow version or draft ID tested. | MVP |

### 4.2 Workflow Path Simulation

| ID | Requirement | Priority |
|---|---|---|
| WFS-PATH-001 | The system shall show expected workflow path for given input payload. | MVP |
| WFS-PATH-002 | The system shall show gateway condition results. | MVP |
| WFS-PATH-003 | The system shall show selected path and skipped paths. | MVP |
| WFS-PATH-004 | The system shall detect no-path and multi-path ambiguity. | MVP |
| WFS-PATH-005 | The system shall show expected end state. | MVP |

### 4.3 Approval Simulation

| ID | Requirement | Priority |
|---|---|---|
| WFS-APR-001 | The system shall show whether approval is required for test payload. | MVP |
| WFS-APR-002 | The system shall show approval-required reason. | MVP |
| WFS-APR-003 | The system shall show resolved approval path. | MVP |
| WFS-APR-004 | The system shall show resolved users, roles, groups, or fallback approvers. | MVP |
| WFS-APR-005 | The system shall show maker-checker violations. | MVP |
| WFS-APR-006 | The system shall show unresolved or inactive approver warnings. | MVP |
| WFS-APR-007 | The system shall support testing approve, reject, send-back, and escalation paths. | Phase 2 |

### 4.4 SLA and Escalation Simulation

| ID | Requirement | Priority |
|---|---|---|
| WFS-SLA-001 | The system shall calculate expected task due date for simulation payload. | MVP |
| WFS-SLA-002 | The system shall show reminder schedule. | MVP |
| WFS-SLA-003 | The system shall show escalation schedule. | MVP |
| WFS-SLA-004 | The system shall use business calendar when configured. | Phase 2 |
| WFS-SLA-005 | The system shall show auto-action warning when configured. | Phase 2 |

### 4.5 Service Task Simulation

| ID | Requirement | Priority |
|---|---|---|
| WFS-SVC-001 | The system shall allow service task mock responses during simulation. | Phase 2 |
| WFS-SVC-002 | The system shall show expected retry behavior for failed mock response. | Phase 2 |
| WFS-SVC-003 | The system shall show error handler path when retries are exhausted. | Phase 2 |
| WFS-SVC-004 | The system shall not call real external or internal mutating services during simulation unless explicitly configured as dry-run safe. | MVP |

### 4.6 Regression Packs

| ID | Requirement | Priority |
|---|---|---|
| WFS-REG-001 | The system shall allow saving simulation scenarios as regression tests. | Phase 2 |
| WFS-REG-002 | Regression test shall include input payload, expected path, expected approvers, expected SLA, and expected outcome. | Phase 2 |
| WFS-REG-003 | The system shall run regression pack before publish where configured. | Phase 2 |
| WFS-REG-004 | Publish shall be blocked if mandatory regression tests fail. | Phase 2 |
| WFS-REG-005 | Regression test results shall be stored with workflow/approval version. | Phase 2 |

## 5. Simulation Output Requirements

| Output | Description |
|---|---|
| Input Summary | Payload fields used in simulation. |
| Workflow Path | Nodes visited, skipped, and terminal result. |
| Gateway Results | Conditions evaluated and matched path. |
| Approval Requirement Result | Required/not required and reason. |
| Approver Resolution | Resolved approvers, fallback, delegation, ineligible users. |
| SLA Timeline | Due date, reminders, escalation. |
| Warnings | Ambiguity, unresolved data, risky config. |
| Blocking Errors | Issues that would block publish or runtime. |
| Trace | Step-by-step technical trace in advanced mode. |

## 6. Usage Examples

### Example 1: Sale Invoice Discount Approval Simulation

Input:

```json
{
  "documentType": "SaleInvoice",
  "invoiceAmount": 150000,
  "discountPercent": 8,
  "createdBy": "USER-101",
  "branch": "PUNE"
}
```

Expected output:

- Approval required = Yes
- Reason = Discount exceeds 5 percent
- Step 1 = Sales Manager
- Step 2 = Finance Manager because invoice amount exceeds 100000
- Maker-checker = USER-101 excluded
- SLA = 24 hours per step

### Example 2: Purchase Order Matrix Simulation

Input:

```json
{
  "documentType": "PurchaseOrder",
  "poAmount": 650000,
  "branch": "MUMBAI",
  "createdBy": "USER-500"
}
```

Expected output:

- Approval required = Yes
- Path = Branch Manager -> Procurement Head -> Finance Head
- No unresolved approvers
- Workflow publish readiness = Pass

## 7. Error Handling

| Error | Expected Behavior |
|---|---|
| Missing input field | Show missing field and affected condition. |
| Invalid field type | Show type mismatch. |
| No approver resolved | Show blocking simulation error. |
| Ambiguous gateway | Show matched paths and warning/error based on gateway type. |
| Service mock not provided | Use default success or require mock based on node config. |
| Regression expected output mismatch | Mark test failed. |

## 8. Audit Requirements

| ID | Requirement | Priority |
|---|---|---|
| WFS-AUD-001 | The system shall audit simulation execution for draft and published configurations. | MVP |
| WFS-AUD-002 | Simulation audit shall capture actor, timestamp, workflow/policy version or draft ID, input reference, and output summary. | MVP |
| WFS-AUD-003 | Simulation audit shall not store sensitive payload values unless allowed by masking policy. | MVP |

## 9. Security Requirements

| ID | Requirement | Priority |
|---|---|---|
| WFS-SEC-001 | Only authorized users shall run workflow/approval simulation. | MVP |
| WFS-SEC-002 | Simulation using existing document snapshot shall respect document access permission. | MVP |
| WFS-SEC-003 | Sensitive fields shall be masked according to data masking policy. | MVP |
| WFS-SEC-004 | Simulation shall not allow privilege escalation by testing documents outside user's scope. | MVP |

## 10. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| WFS-AC-001 | Admin can simulate approval policy using sample payload. |
| WFS-AC-002 | System shows resolved approvers and approval path. |
| WFS-AC-003 | System identifies maker-checker violation in simulation. |
| WFS-AC-004 | System shows workflow path and gateway results. |
| WFS-AC-005 | Simulation creates no real workflow task or notification. |
| WFS-AC-006 | Simulation result can be saved as regression scenario where enabled. |

## 11. Developer Implementation Notes

1. Simulation must use same evaluation logic as runtime.
2. Simulation must be side-effect free.
3. Do not send real notifications by default.
4. Do not call mutating transaction/inventory/accounting services.
5. Provide advanced trace for support users.
6. Support payload masking.
