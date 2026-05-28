# 09 - Approval Engine PRD

## 1. Feature Overview

The Approval Engine is the iDMS governance capability for routing business transactions to appropriate approvers based on configured approval policies, approval rules, hierarchy rules, delegation rules, maker-checker controls, SLA policies, and escalation rules.

The Approval Engine works with the Native Workflow Engine. Workflow Engine orchestrates process steps, tasks, timers, and transitions. Approval Engine determines who should approve, what actions are allowed, what governance constraints apply, and what final approval outcome means.

## 2. Business Objective

Enable enterprises to configure auditable, rule-driven approval policies across Sales, Procurement, Inventory, Service, and Finance without custom code.

## 3. Scope

### In Scope

- Approval policy definition
- Approval versioning and lifecycle
- Approval triggers
- Approval requirement decision
- Approver resolution
- Sequential approval
- Parallel approval
- Any-one approval
- All approval
- Hierarchy-based approval
- Amount/threshold-based approval
- Role-based approval
- Maker-checker enforcement
- Delegation and fallback
- Send-back and resubmit
- Reject and cancel behavior
- Approval SLA, reminders, escalations, and auto-actions
- Approval task audit
- Approval simulation
- Integration with workflow engine
- Integration with transaction service for allowed status transitions

### Out of Scope

- Direct transaction save logic
- Direct inventory posting
- Direct accounting posting
- Tax calculation
- Charge calculation
- Replacement of workflow engine
- External approval platform dependency
- Uncontrolled email-only approvals without system audit

## 4. Personas

| Persona | Responsibilities |
|---|---|
| Approval Administrator | Configures approval policies. |
| Policy Owner | Owns business approval policy. |
| Requester | Submits document for approval. |
| Approver | Approves, rejects, sends back, or delegates task. |
| Escalation Approver | Acts when original approver misses SLA. |
| Auditor | Reviews approval evidence. |
| Support User | Resolves assignment failures and stuck approvals. |

## 5. Key Concepts

| Concept | Definition |
|---|---|
| Approval Policy | Versioned approval configuration for a module/document/event. |
| Approval Requirement Decision | Decision that determines whether approval is needed. |
| Approval Path | Ordered or parallel set of approval steps. |
| Approval Step | One approval level with assignee resolution and action policy. |
| Approver Resolver | Logic that resolves user, role, reporting manager, hierarchy, branch manager, finance approver, or custom group. |
| Maker-Checker | Rule preventing same user from creating/submitting and approving. |
| Send Back | Return transaction to requester or prior step for correction. |
| Reject | Negative approval outcome with configured transaction impact. |
| Escalation | Assignment or notification when approval SLA is breached. |
| Delegation | Temporary transfer of approval authority. |

## 6. Functional Requirements

### 6.1 Approval Policy Definition

| ID | Requirement | Priority |
|---|---|---|
| APR-POL-001 | The system shall allow authorized admins to create approval policy in Draft status. | MVP |
| APR-POL-002 | Approval policy shall be uniquely identified by policy code within tenant, module, document type, and trigger scope. | MVP |
| APR-POL-003 | Approval policy shall support tenant, organization, branch, department, document type, role, amount band, and channel scoping. | MVP |
| APR-POL-004 | Approval policy shall support status Draft, In Review, Published, Retired, and Archived. | MVP |
| APR-POL-005 | Published approval policy versions shall be immutable. | MVP |
| APR-POL-006 | Modifying a published policy shall create a new draft version. | MVP |
| APR-POL-007 | Approval policy shall include trigger event, applicability condition, approval path, action policy, SLA policy, escalation policy, fallback policy, and audit policy. | MVP |
| APR-POL-008 | Approval policy shall allow stricter derived policies but must not weaken non-overridable maker-checker, audit, or authorization controls. | MVP |

### 6.2 Approval Requirement Decision

| ID | Requirement | Priority |
|---|---|---|
| APR-REQ-001 | The system shall determine whether approval is required using configured approval requirement conditions. | MVP |
| APR-REQ-002 | Approval requirement conditions shall use the Expression and Condition Engine. | MVP |
| APR-REQ-003 | The system shall support always-required approval. | MVP |
| APR-REQ-004 | The system shall support conditional approval based on amount, discount, charge override, tax override flag, document type, branch, role, customer/supplier category, inventory variance, or custom payload fields. | MVP |
| APR-REQ-005 | The system shall support approval bypass only when explicitly configured and audited. | Phase 2 |
| APR-REQ-006 | The system shall return reason when approval is required. | MVP |
| APR-REQ-007 | The system shall return reason when approval is not required. | MVP |

### 6.3 Approval Types

| ID | Requirement | Priority |
|---|---|---|
| APR-TYPE-001 | The system shall support Single Approver approval. | MVP |
| APR-TYPE-002 | The system shall support Sequential Approval. | MVP |
| APR-TYPE-003 | The system shall support Parallel All approval. | MVP |
| APR-TYPE-004 | The system shall support Parallel Any-One approval. | MVP |
| APR-TYPE-005 | The system shall support Amount Matrix approval. | MVP |
| APR-TYPE-006 | The system shall support Hierarchy-Based approval. | Phase 2 |
| APR-TYPE-007 | The system shall support Committee approval. | Phase 2 |
| APR-TYPE-008 | The system shall support External Approver approval where enabled. | Phase 3 |

### 6.4 Approver Resolution

| ID | Requirement | Priority |
|---|---|---|
| APR-RES-001 | The system shall resolve approvers from explicit user selection. | MVP |
| APR-RES-002 | The system shall resolve approvers from role. | MVP |
| APR-RES-003 | The system shall resolve approvers from user group. | MVP |
| APR-RES-004 | The system shall resolve approvers from reporting manager hierarchy. | Phase 2 |
| APR-RES-005 | The system shall resolve approvers from branch/department owner. | Phase 2 |
| APR-RES-006 | The system shall resolve approvers from amount matrix. | MVP |
| APR-RES-007 | The system shall resolve approvers from custom resolver registered in iDMS. | Phase 2 |
| APR-RES-008 | The system shall validate that resolved approvers are active and authorized before task creation. | MVP |
| APR-RES-009 | If no approver resolves, system shall apply configured fallback or block approval start with clear error. | MVP |
| APR-RES-010 | Approver resolver output shall be auditable. | MVP |

### 6.5 Maker-Checker and Segregation of Duties

| ID | Requirement | Priority |
|---|---|---|
| APR-SOD-001 | The system shall support maker-checker control preventing creator from approving own transaction. | MVP |
| APR-SOD-002 | The system shall support preventing submitter from approving own transaction. | MVP |
| APR-SOD-003 | The system shall support preventing last modifier from approving own transaction where configured. | Phase 2 |
| APR-SOD-004 | If maker-checker removes all eligible approvers, system shall apply fallback or block workflow start. | MVP |
| APR-SOD-005 | Maker-checker violations shall be audited. | MVP |

### 6.6 Approval Actions

| ID | Requirement | Priority |
|---|---|---|
| APR-ACT-001 | The system shall support Approve action. | MVP |
| APR-ACT-002 | The system shall support Reject action with mandatory remarks where configured. | MVP |
| APR-ACT-003 | The system shall support Send Back action with target step/requester and mandatory remarks. | MVP |
| APR-ACT-004 | The system shall support Request Clarification action. | Phase 2 |
| APR-ACT-005 | The system shall support Delegate action when delegation policy allows. | Phase 2 |
| APR-ACT-006 | The system shall support Reassign action for authorized admins/support users. | Phase 2 |
| APR-ACT-007 | The system shall support Withdraw by requester only where configured and before final approval. | Phase 2 |
| APR-ACT-008 | Every approval action shall be idempotent. | MVP |
| APR-ACT-009 | Every approval action shall capture actor, timestamp, remarks, attachments, IP/device metadata where available, and outcome. | MVP |

### 6.7 Approval Outcomes and Transaction Impact

| ID | Requirement | Priority |
|---|---|---|
| APR-OUT-001 | The Approval Engine shall return approval outcome to Workflow Engine. | MVP |
| APR-OUT-002 | Transaction status changes after approval shall be performed only by Transaction Service. | MVP |
| APR-OUT-003 | Approval Engine shall not directly update transaction tables. | MVP |
| APR-OUT-004 | Approved outcome may trigger configured workflow transition. | MVP |
| APR-OUT-005 | Rejected outcome may trigger configured workflow transition and transaction service action. | MVP |
| APR-OUT-006 | Send Back outcome may reopen configured editable state only through transaction service rules. | MVP |
| APR-OUT-007 | Approval completion shall store final outcome, final approver, completed path, skipped steps, and reason. | MVP |

### 6.8 SLA, Reminder, and Escalation

| ID | Requirement | Priority |
|---|---|---|
| APR-SLA-001 | Approval step shall support due duration. | MVP |
| APR-SLA-002 | Approval policy shall support reminder schedule. | MVP |
| APR-SLA-003 | Approval policy shall support escalation target. | MVP |
| APR-SLA-004 | Approval policy shall support escalation action: notify only, reassign, add approver, auto-approve, auto-reject, or manual intervention. | Phase 2 |
| APR-SLA-005 | Auto-approve and auto-reject shall be disabled by default and require elevated permission to configure. | Phase 2 |
| APR-SLA-006 | SLA shall use business calendar when configured. | Phase 2 |
| APR-SLA-007 | Reminder and escalation events shall be audited. | MVP |

### 6.9 Delegation and Fallback

| ID | Requirement | Priority |
|---|---|---|
| APR-DEL-001 | The system shall support temporary delegation by date range. | Phase 2 |
| APR-DEL-002 | Delegation shall be scoped by module, document type, branch, and approval type where configured. | Phase 2 |
| APR-DEL-003 | Delegation shall not violate maker-checker controls. | Phase 2 |
| APR-DEL-004 | The system shall support fallback approver when primary approver is inactive, unavailable, or unresolved. | MVP |
| APR-DEL-005 | Delegation and fallback resolution shall be audited. | MVP |

### 6.10 External Approvals

| ID | Requirement | Priority |
|---|---|---|
| APR-EXT-001 | The system may support external approver links for vendor, customer, auditor, or partner approval where enabled. | Phase 3 |
| APR-EXT-002 | External approval links shall be tokenized, time-bound, and permission-limited. | Phase 3 |
| APR-EXT-003 | External approver shall see only approved minimal payload fields. | Phase 3 |
| APR-EXT-004 | External approval action shall be fully audited. | Phase 3 |

## 7. Data Model Requirements

| Entity | Required Fields |
|---|---|
| ApprovalPolicy | policy_id, code, name, module, document_type, trigger, scope, status, current_version, owner |
| ApprovalPolicyVersion | version_id, policy_id, version_no, applicability_condition_json, path_json, sla_json, fallback_json, action_policy_json, status |
| ApprovalStep | step_id, version_id, step_no, step_type, approver_resolver_json, action_policy_json, sla_policy_json |
| ApprovalInstance | approval_instance_id, workflow_instance_id, policy_version_id, document_ref, status, started_by, started_at, completed_at |
| ApprovalTask | task_id, approval_instance_id, step_id, assignee, status, due_at, actioned_by, actioned_at, outcome |
| ApprovalAudit | audit_id, approval_instance_id, event_type, actor, before_json, after_json, reason, timestamp |

## 8. Admin Studio Requirements

| ID | Requirement | Priority |
|---|---|---|
| APR-ADM-001 | Admin Studio shall provide approval policy list with filters by module, document type, status, owner, and version. | MVP |
| APR-ADM-002 | Admin Studio shall provide approval policy wizard with basic details, trigger, applicability, approver path, SLA, actions, simulation, and publish steps. | MVP |
| APR-ADM-003 | Admin Studio shall support drag-and-drop approval path builder. | MVP |
| APR-ADM-004 | Admin Studio shall allow configuring sequential and parallel approval steps visually. | MVP |
| APR-ADM-005 | Admin Studio shall show unresolved approver warnings before publish. | MVP |
| APR-ADM-006 | Admin Studio shall show maker-checker validation warnings before publish where possible. | MVP |
| APR-ADM-007 | Admin Studio shall provide approval simulation with sample transaction payload. | MVP |
| APR-ADM-008 | Admin Studio shall provide read-only view of published approval policy. | MVP |

## 9. Usage Examples

### Example 1: Sale Invoice Discount Approval

Condition:

- Document Type = Sale Invoice
- Discount Percent > 5
- User Role = Sales Executive

Expected:

1. Approval required.
2. Sales Manager approval task created.
3. If invoice amount exceeds configured threshold, Finance Manager approval task created after Sales Manager approval.
4. Maker-checker prevents invoice creator from approving.
5. Final approval outcome is sent to workflow.
6. Transaction status is updated only by transaction service.

### Example 2: Purchase Order Amount Matrix

Condition:

- PO Amount <= 100000: Branch Manager
- PO Amount > 100000 and <= 500000: Branch Manager then Procurement Head
- PO Amount > 500000: Branch Manager then Procurement Head then Finance Head

Expected:

- Approval path is resolved from amount matrix.
- Each level gets task only after previous approval if sequential.
- SLA applies independently per step.

## 10. Error Handling

| Error | Expected Behavior |
|---|---|
| No approver resolved | Apply fallback or block with clear error. |
| Approver inactive | Apply fallback or escalation policy. |
| Maker-checker violation | Remove ineligible approver; fallback or block. |
| Duplicate approval click | Ignore duplicate after first successful action. |
| Approval policy retired | Existing instances continue; new instances blocked. |
| Invalid approval path | Publish blocked. |

## 11. Audit Requirements

| ID | Requirement | Priority |
|---|---|---|
| APR-AUD-001 | The system shall audit approval policy create, edit, publish, retire, clone, and simulation. | MVP |
| APR-AUD-002 | The system shall audit approval instance start, step start, task assignment, task action, delegation, escalation, rejection, send-back, completion, and failure. | MVP |
| APR-AUD-003 | The system shall store approval policy version used by each approval instance. | MVP |
| APR-AUD-004 | The system shall store approver resolver inputs and outputs. | MVP |
| APR-AUD-005 | Approval audit shall be immutable. | MVP |

## 12. Security and RBAC

| ID | Requirement | Priority |
|---|---|---|
| APR-SEC-001 | Only authorized approval admins shall configure approval policies. | MVP |
| APR-SEC-002 | Only authorized users shall publish approval policies. | MVP |
| APR-SEC-003 | Only assigned approvers or valid delegates shall act on approval tasks. | MVP |
| APR-SEC-004 | Approval comments and attachments shall follow document access rules. | MVP |
| APR-SEC-005 | Support reassignment shall require elevated permission and mandatory reason. | MVP |

## 13. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| APR-AC-001 | Admin can configure approval policy for Sale Invoice discount threshold. |
| APR-AC-002 | System correctly determines approval required based on sample payload. |
| APR-AC-003 | System resolves active approver and creates approval task. |
| APR-AC-004 | Maker-checker prevents creator from approving own document. |
| APR-AC-005 | Sequential approval advances only after prior approval. |
| APR-AC-006 | Rejection requires remarks when configured. |
| APR-AC-007 | SLA reminder and escalation are scheduled and audited. |
| APR-AC-008 | Approval audit shows all actions and policy version used. |

## 14. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Approval policy has no approver resolver | Publish blocked. |
| Approver resolver returns inactive user | Fallback or block based on policy. |
| Creator tries to approve own transaction under maker-checker | Action blocked. |
| Duplicate approve request submitted | Only first action processed. |
| Rejection without remarks when mandatory | Action blocked. |
| Send Back target is invalid | Action blocked. |

## 15. Developer Implementation Notes

1. Approval Engine decides approval governance; Workflow Engine orchestrates process flow.
2. Approval Engine must not directly update transaction records.
3. All approval policies must be versioned and published before runtime use.
4. Approver resolution must be deterministic and auditable.
5. Maker-checker must be enforced backend-side.
6. Approval actions must be idempotent.
7. SLA and escalation should use Workflow Timer capability.
