# 09B - Workflow and Approval Runtime Orchestration PRD

## 1. Feature Overview

This PRD defines how Workflow Engine and Approval Engine interact with transaction services, validation engine, calculation engine, financial engines, notification services, audit, and integration events.

The goal is to prevent tight coupling and prevent workflow or approval logic from corrupting transaction integrity.

## 2. Core Boundary Rule

Workflow and Approval may coordinate, route, wait, escalate, and call approved service actions. They must not directly mutate transaction records, inventory ledgers, accounting ledgers, tax summaries, or commercial calculations.

## 3. Runtime Ownership Matrix

| Capability | Owner | Workflow/Approval Role |
|---|---|---|
| Transaction save | Transaction Service | May trigger after commit. |
| Field validation | Validation Engine | May call for submit eligibility. |
| Derived calculation | Calculation Engine | May consume results, not recompute. |
| Charge calculation | Charge Engine | May consume result, not calculate. |
| Tax calculation | Tax Engine | May consume result, not calculate. |
| Accounting preview | Accounting Engine | May require approval based on output. |
| Inventory update | Inventory Service | Workflow may call approved action only. |
| Status transition | Transaction Service | Workflow requests transition through service. |
| Human routing | Workflow + Approval | Owns task orchestration and approval policy. |
| Audit | Audit Platform | Must write workflow and approval traces. |

## 4. Trigger Patterns

### 4.1 Post-Commit Trigger

Use when workflow should start only after a transaction is safely saved.

Example:

- Delivery saved successfully.
- Workflow starts notification and logistics follow-up.

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-TRG-001 | Workflow shall start from post-commit event only after transaction commit succeeds. | MVP |
| ORCH-TRG-002 | Failed or rolled-back transactions shall not emit workflow start events. | MVP |
| ORCH-TRG-003 | Post-commit event shall include idempotency key. | MVP |
| ORCH-TRG-004 | Workflow start shall be idempotent for the same event key. | MVP |

### 4.2 Submit-for-Approval Trigger

Use when transaction should wait for approval before finalization or before a sensitive action.

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-SUB-001 | Submit action shall run backend validation before starting approval. | MVP |
| ORCH-SUB-002 | Submit action shall create approval workflow only if approval requirement decision returns required. | MVP |
| ORCH-SUB-003 | Submit action shall lock or restrict transaction editing based on approval policy. | MVP |
| ORCH-SUB-004 | Transaction lock/unlock shall be performed by Transaction Service, not Approval Engine. | MVP |

### 4.3 Manual Workflow Start

Use for controlled operational workflows.

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-MAN-001 | Manual workflow start shall require explicit workflow configuration. | Phase 2 |
| ORCH-MAN-002 | Manual workflow start shall require permission. | Phase 2 |
| ORCH-MAN-003 | Manual workflow start shall capture reason. | Phase 2 |

## 5. Approval Orchestration Patterns

### 5.1 Pre-Save Approval

Use sparingly. This is useful only when final save must not happen before approval.

Example:

- Purchase Order above high threshold must be approved before becoming active supplier commitment.

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-PRE-001 | Pre-save approval shall store transaction as controlled pending/request state if business design allows. | Phase 2 |
| ORCH-PRE-002 | Pre-save approval shall not create final document number unless transaction design allows it. | Phase 2 |
| ORCH-PRE-003 | Pre-save approval shall define what fields are locked during approval. | Phase 2 |

### 5.2 Post-Save Approval

Use when document exists but next action needs approval.

Example:

- Sale Order saved as Open, approval required before allocation/invoice.

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-POST-001 | Post-save approval shall reference saved document ID and version. | MVP |
| ORCH-POST-002 | Approval workflow shall not modify saved document directly. | MVP |
| ORCH-POST-003 | Approved outcome shall call transaction service to update allowed approval status. | MVP |

### 5.3 Action Approval

Use when a specific action requires approval.

Examples:

- Cancel document.
- Override charge.
- Approve discount deviation.
- Reopen allowed document in future design.

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-ACT-001 | Action approval shall identify requested action, target document, requester, payload, and reason. | Phase 2 |
| ORCH-ACT-002 | Approved action shall be executed by owning service only. | Phase 2 |
| ORCH-ACT-003 | Rejected action shall leave document unchanged except audit/status where configured. | Phase 2 |

## 6. Runtime Sequence Requirements

### 6.1 Save With Approval Check

Expected sequence:

```text
1. User initiates Save or Submit.
2. Transaction Service validates user permission.
3. Validation Engine runs required save/submit validations.
4. Calculation/Charge/Tax/Accounting preview run if required by document design.
5. Approval Requirement Decision runs.
6. If approval not required, Transaction Service completes allowed action.
7. If approval required, Transaction Service creates pending/locked state if configured.
8. Workflow Engine starts approval workflow.
9. Approval Engine creates approval tasks.
10. Final approval outcome calls Transaction Service action.
11. Audit records entire chain.
```

Requirements:

| ID | Requirement | Priority |
|---|---|---|
| ORCH-SEQ-001 | Approval requirement decision shall run after necessary calculations are available. | MVP |
| ORCH-SEQ-002 | Accounting preview may be generated before approval if approval condition depends on posting output. | Phase 2 |
| ORCH-SEQ-003 | Workflow shall start only after transaction service confirms configured state. | MVP |
| ORCH-SEQ-004 | Approval completion shall call transaction service using idempotent action key. | MVP |
| ORCH-SEQ-005 | Workflow shall store references to calculation, tax, charge, and accounting snapshot versions where used for approval. | MVP |

## 7. Integration Contracts

### 7.1 Workflow Start Request

```json
{
  "tenantId": "T001",
  "workflowCode": "SALE_INVOICE_APPROVAL",
  "triggerEvent": "SUBMIT_FOR_APPROVAL",
  "correlationType": "SALE_INVOICE",
  "correlationId": "SI-12345",
  "documentVersion": 7,
  "initiatedBy": "USER-100",
  "idempotencyKey": "SALE_INVOICE:SI-12345:SUBMIT:7",
  "payloadRef": "PAYLOAD-REF-001"
}
```

### 7.2 Approval Outcome Request to Transaction Service

```json
{
  "tenantId": "T001",
  "documentType": "SALE_INVOICE",
  "documentId": "SI-12345",
  "requestedAction": "MARK_APPROVED",
  "approvalInstanceId": "APR-987",
  "approvalOutcome": "APPROVED",
  "approvedBy": "USER-200",
  "idempotencyKey": "APR-987:MARK_APPROVED"
}
```

## 8. Error Handling and Recovery

| Error | Owner | Expected Behavior |
|---|---|---|
| Approval policy not found | Approval Engine | Return controlled error; transaction action blocked if approval required. |
| Workflow start failed | Workflow Engine | Transaction remains in configured pending/error state; audit failure. |
| Approval completed but transaction update failed | Transaction Service | Retry through workflow service task; if exhausted, manual intervention. |
| Duplicate approval outcome | Orchestrator | Ignore duplicate using idempotency key. |
| Inconsistent document version | Transaction Service | Reject action and require refresh/re-evaluation. |
| Stale approval payload | Approval Engine | Revalidate before final action if configured. |

## 9. Audit Requirements

| ID | Requirement | Priority |
|---|---|---|
| ORCH-AUD-001 | The system shall maintain correlation ID across transaction, workflow, approval, rule, and audit records. | MVP |
| ORCH-AUD-002 | The system shall audit cross-service action requests and outcomes. | MVP |
| ORCH-AUD-003 | The system shall store idempotency keys for workflow and approval actions. | MVP |
| ORCH-AUD-004 | The system shall show end-to-end trace from transaction document view where authorized. | Phase 2 |

## 10. Examples

### Example 1: Sale Invoice Approval Based on Discount

1. Sale Invoice calculation produces discount percent = 8.
2. Approval requirement decision says approval required.
3. Transaction Service marks invoice as Pending Approval or blocks finalization based on document design.
4. Workflow starts approval process.
5. Sales Manager approves.
6. Finance approves.
7. Workflow calls Transaction Service to finalize approval state.
8. Audit shows calculation snapshot, approval policy version, approvers, and final outcome.

### Example 2: Purchase Return Action Approval

1. User requests high-value purchase return.
2. Validation confirms source and pending quantity.
3. Approval required based on amount and reason.
4. Workflow starts approval.
5. After approval, Purchase Return Service executes return save using current validation rules.

## 11. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| ORCH-AC-001 | Workflow starts only once for a given transaction event idempotency key. |
| ORCH-AC-002 | Approval outcome updates transaction only through transaction service. |
| ORCH-AC-003 | Duplicate approval completion does not duplicate transaction action. |
| ORCH-AC-004 | Failed transaction update after approval is recoverable through retry/manual intervention. |
| ORCH-AC-005 | End-to-end audit correlation is available. |

## 12. Developer Implementation Notes

1. Treat transaction service as commit truth.
2. Treat workflow engine as orchestration truth.
3. Treat approval engine as approval policy and approver truth.
4. Use events or service contracts between components.
5. Require idempotency keys for every cross-service action.
6. Never rely only on frontend status for workflow/approval progression.
