# 08 - Native Workflow Engine PRD

## 1. Feature Overview

The Native Workflow Engine is the iDMS process orchestration capability. It coordinates long-running business processes such as approvals, escalations, service tasks, post-commit orchestration, notifications, and human task assignments.

The workflow engine must not replace transaction validation, tax calculation, charge calculation, accounting posting rule resolution, or atomic transaction commit. It orchestrates work after or around transaction events using explicit process definitions and versioned runtime instances.

## 2. Business Objective

Enable iDMS customers to configure repeatable, auditable, and governed business processes without code, while keeping critical transaction data mutations under the ownership of transaction services.

## 3. Scope

### In Scope

- Workflow definition management
- Workflow versioning and publish lifecycle
- Workflow instance runtime
- Human tasks
- Approval tasks through Approval Engine integration
- Service tasks
- Decision gateways
- Timers and SLA events
- Escalation paths
- Notifications
- Error handling and retries
- Workflow audit trail
- Workflow simulation support
- Drag-and-drop workflow design in Admin Studio
- Runtime correlation with transaction documents
- Idempotent task actions and service actions
- Workflow search, monitoring, suspension, termination, and retry operations

### Out of Scope

- Direct tax calculation inside workflow nodes
- Direct charge calculation inside workflow nodes
- Direct accounting posting inside workflow nodes
- Direct inventory posting inside workflow nodes
- Direct database mutation of transaction records by workflow nodes
- Replacement of validation engine
- Replacement of transaction service atomic save
- External workflow platform dependency
- Full BPMN standard compliance as a mandatory runtime requirement

## 4. Personas and Actors

| Actor | Description |
|---|---|
| Workflow Administrator | Configures workflow definitions and publishes versions. |
| Process Owner | Owns business process design and governance. |
| Transaction User | Performs business transactions that may trigger workflow. |
| Approver | Acts on workflow approval tasks. |
| Support User | Monitors failed workflow instances and retries service tasks. |
| Auditor | Reviews workflow state transitions, task actions, and decision history. |
| AI Developer Agent | Implements workflow services according to this PRD. |

## 5. Key Concepts

| Concept | Definition |
|---|---|
| Workflow Definition | Versioned process model created by admin. |
| Workflow Version | Immutable published version of a workflow definition. |
| Workflow Instance | Runtime execution created from one workflow version. |
| Node | A configured step in workflow. |
| Edge | A configured transition between nodes. |
| Human Task | A task assigned to a user, role, group, or resolver. |
| Approval Task | A human task governed by approval policy and approval rules. |
| Service Task | A system action executed through an internal service contract. |
| Decision Gateway | A branching point driven by condition or decision output. |
| Timer Event | A time-based trigger used for SLA, reminders, escalation, or auto-action. |
| Correlation Key | Identifier linking workflow instance with transaction/document. |
| Compensation | Explicit configured recovery or follow-up action after failure where applicable. |

## 6. Functional Requirements

### 6.1 Workflow Definition Management

| ID | Requirement | Priority |
|---|---|---|
| WF-DEF-001 | The system shall allow authorized admins to create a workflow definition in Draft status. | MVP |
| WF-DEF-002 | The system shall require workflow definitions to have a unique code within tenant and module scope. | MVP |
| WF-DEF-003 | The system shall support workflow name, description, owning module, owning document type, trigger event, status, version, owner, and tags. | MVP |
| WF-DEF-004 | The system shall allow workflow definitions to be scoped by tenant, organization, branch, module, document type, role, and optional channel. | MVP |
| WF-DEF-005 | The system shall allow a workflow definition to be cloned into a new draft. | Phase 2 |
| WF-DEF-006 | The system shall allow workflow definitions to be retired only when no new instance should be created from that version. | MVP |
| WF-DEF-007 | The system shall not delete published workflow definitions if any runtime instance or audit record exists. | MVP |
| WF-DEF-008 | The system shall support workflow categories such as Approval, Post Commit Process, Notification Process, Escalation Process, Integration Process, and Operational Task Process. | MVP |

### 6.2 Workflow Node Types

| ID | Requirement | Priority |
|---|---|---|
| WF-NODE-001 | The workflow designer shall support Start node. | MVP |
| WF-NODE-002 | The workflow designer shall support End node. | MVP |
| WF-NODE-003 | The workflow designer shall support Human Task node. | MVP |
| WF-NODE-004 | The workflow designer shall support Approval Task node integrated with Approval Engine. | MVP |
| WF-NODE-005 | The workflow designer shall support Service Task node for approved internal service calls. | MVP |
| WF-NODE-006 | The workflow designer shall support Decision Gateway node. | MVP |
| WF-NODE-007 | The workflow designer shall support Timer node for reminders, due dates, escalations, and auto-actions. | MVP |
| WF-NODE-008 | The workflow designer shall support Notification node. | MVP |
| WF-NODE-009 | The workflow designer shall support Error Handler node. | Phase 2 |
| WF-NODE-010 | The workflow designer shall support Parallel Split and Parallel Join nodes. | Phase 2 |
| WF-NODE-011 | The workflow designer shall support Sub-Workflow node only after workflow versioning and monitoring are stable. | Phase 3 |

### 6.3 Workflow Connections and Transitions

| ID | Requirement | Priority |
|---|---|---|
| WF-EDGE-001 | The system shall allow admins to connect valid nodes using directed transitions. | MVP |
| WF-EDGE-002 | The system shall prevent publishing if any required node is unreachable from Start. | MVP |
| WF-EDGE-003 | The system shall prevent publishing if a workflow has no terminal End path. | MVP |
| WF-EDGE-004 | The system shall support transition conditions using the Expression and Condition Engine. | MVP |
| WF-EDGE-005 | The system shall require mutually exclusive conditions when a gateway uses Exclusive routing. | MVP |
| WF-EDGE-006 | The system shall detect and warn about ambiguous gateway paths where multiple transitions can match. | MVP |
| WF-EDGE-007 | The system shall support a default gateway path. | MVP |
| WF-EDGE-008 | The system shall allow edge labels for business readability without changing runtime logic. | MVP |

### 6.4 Workflow Triggers

| ID | Requirement | Priority |
|---|---|---|
| WF-TRG-001 | The system shall support transaction event triggers such as On Submit, On Save Completed, On Approval Required, On Status Changed, On Cancel Requested, and On Manual Start. | MVP |
| WF-TRG-002 | The system shall not trigger workflow from failed, unsaved, or rolled-back transactions. | MVP |
| WF-TRG-003 | The system shall support post-commit workflow start for transaction-safe orchestration. | MVP |
| WF-TRG-004 | The system shall store the triggering event, document ID, document version, document status, user, timestamp, and payload snapshot reference. | MVP |
| WF-TRG-005 | The system shall prevent duplicate workflow starts for the same event using idempotency key. | MVP |
| WF-TRG-006 | The system shall support manual workflow start only when configured and authorized. | Phase 2 |

### 6.5 Human Tasks

| ID | Requirement | Priority |
|---|---|---|
| WF-TASK-001 | The system shall create human tasks for configured assignees, roles, groups, or resolver outputs. | MVP |
| WF-TASK-002 | A human task shall have status Open, Claimed, Completed, Cancelled, Escalated, Expired, or Failed. | MVP |
| WF-TASK-003 | The system shall support task due date. | MVP |
| WF-TASK-004 | The system shall support task priority. | MVP |
| WF-TASK-005 | The system shall support task comments and attachments where enabled. | MVP |
| WF-TASK-006 | The system shall require remarks for configured actions such as Reject, Send Back, Override, or Manual Close. | MVP |
| WF-TASK-007 | The system shall prevent unauthorized users from acting on tasks. | MVP |
| WF-TASK-008 | The system shall make task actions idempotent to prevent duplicate approvals or duplicate transitions. | MVP |
| WF-TASK-009 | The system shall record every task action in audit trace. | MVP |
| WF-TASK-010 | The system shall support task delegation based on Approval/Workflow delegation policy. | Phase 2 |

### 6.6 Service Tasks

| ID | Requirement | Priority |
|---|---|---|
| WF-SVC-001 | The system shall allow Service Task nodes to call only registered internal service actions. | MVP |
| WF-SVC-002 | Service Task configuration shall include service code, input mapping, output mapping, timeout, retry policy, failure policy, and idempotency key strategy. | MVP |
| WF-SVC-003 | Service Tasks shall not directly mutate database tables outside approved service contracts. | MVP |
| WF-SVC-004 | Service Task execution shall capture request reference, response reference, status, retry count, and failure reason. | MVP |
| WF-SVC-005 | The system shall support retry policies with max attempts, interval, and backoff type. | MVP |
| WF-SVC-006 | The system shall route exhausted failures to configured Error Handler or Manual Intervention Queue. | MVP |
| WF-SVC-007 | The system shall support idempotent service execution to avoid duplicate parent updates, notifications, or integrations. | MVP |
| WF-SVC-008 | The system shall not allow Service Tasks to bypass validation or transaction service rules. | MVP |

### 6.7 Timers, SLA, and Escalations

| ID | Requirement | Priority |
|---|---|---|
| WF-TMR-001 | The system shall support timer events based on absolute date, relative duration, business calendar, or task due date. | MVP |
| WF-TMR-002 | The system shall support reminders before due date. | MVP |
| WF-TMR-003 | The system shall support escalation after due date. | MVP |
| WF-TMR-004 | The system shall support auto-action after configured timeout where explicitly allowed. | Phase 2 |
| WF-TMR-005 | The system shall support business calendar rules including working days, holidays, branch calendar, and timezone. | Phase 2 |
| WF-TMR-006 | Timer execution shall be idempotent. | MVP |
| WF-TMR-007 | Timer scheduling and firing shall be audited. | MVP |

### 6.8 Workflow Runtime

| ID | Requirement | Priority |
|---|---|---|
| WF-RUN-001 | The system shall create workflow instances only from Published workflow versions. | MVP |
| WF-RUN-002 | A workflow instance shall retain the workflow version used at start. | MVP |
| WF-RUN-003 | Updates to workflow definition shall not change behavior of in-flight workflow instances unless explicit migration is supported. | MVP |
| WF-RUN-004 | The system shall support instance statuses: Running, Waiting, Completed, Cancelled, Failed, Suspended, and Terminated. | MVP |
| WF-RUN-005 | The system shall persist current node, executed path, pending tasks, timer state, variables, and correlation key. | MVP |
| WF-RUN-006 | The system shall support workflow variables resolved from transaction payload, user action, rule decision, or service output. | MVP |
| WF-RUN-007 | The system shall prevent duplicate node execution where the same idempotency key has already succeeded. | MVP |
| WF-RUN-008 | The system shall expose workflow status to authorized users from transaction view where configured. | MVP |
| WF-RUN-009 | The system shall allow authorized support users to retry failed service tasks. | MVP |
| WF-RUN-010 | The system shall allow authorized support users to suspend, resume, or terminate workflow instances with mandatory reason. | Phase 2 |

## 7. Data Model Requirements

### 7.1 Core Entities

| Entity | Required Fields |
|---|---|
| WorkflowDefinition | workflow_id, code, name, description, category, module, document_type, scope, status, current_version, owner, created_by, created_at |
| WorkflowVersion | version_id, workflow_id, version_no, status, definition_json, visual_layout_json, published_by, published_at, retired_by, retired_at |
| WorkflowNode | node_id, version_id, node_type, node_code, node_name, config_json, sequence_hint |
| WorkflowEdge | edge_id, version_id, from_node_id, to_node_id, condition_json, is_default, label |
| WorkflowInstance | instance_id, version_id, correlation_type, correlation_id, trigger_event, status, current_state_json, started_by, started_at, ended_at |
| WorkflowTask | task_id, instance_id, node_id, task_type, assignee_type, assignee_id, status, due_at, completed_by, completed_at |
| WorkflowTimer | timer_id, instance_id, node_id, fire_at, status, fired_at, retry_count |
| WorkflowAudit | audit_id, instance_id, event_type, actor, payload_ref, before_json, after_json, timestamp |

### 7.2 Visual vs Executable Metadata

| ID | Requirement | Priority |
|---|---|---|
| WF-DATA-001 | The system shall store visual layout metadata separately from executable workflow definition metadata. | MVP |
| WF-DATA-002 | Moving a node visually shall not change runtime behavior unless transitions or node configurations are changed and saved. | MVP |
| WF-DATA-003 | Published executable workflow metadata shall be immutable. | MVP |

## 8. Admin Studio Requirements

| ID | Requirement | Priority |
|---|---|---|
| WF-ADM-001 | Admin Studio shall provide a workflow list page with search, filters, status, module, document type, version, owner, and last modified date. | MVP |
| WF-ADM-002 | Admin Studio shall provide workflow creation wizard with basic details, trigger, canvas design, node configuration, simulation, and publish steps. | MVP |
| WF-ADM-003 | Admin Studio shall show validation errors before publish. | MVP |
| WF-ADM-004 | Admin Studio shall show read-only view of published workflow versions. | MVP |
| WF-ADM-005 | Admin Studio shall show workflow version history. | MVP |
| WF-ADM-006 | Admin Studio shall support cloning a published version into a new draft. | MVP |
| WF-ADM-007 | Admin Studio shall support visual diff between two workflow versions. | Phase 2 |

## 9. Runtime Examples

### Example 1: Sale Invoice Approval Workflow

1. User saves Sale Invoice as Invoiced or submits for approval based on configuration.
2. Approval requirement decision returns `Approval Required` because discount exceeds threshold.
3. Workflow Engine starts published Sale Invoice Approval workflow.
4. Human task is created for Sales Manager.
5. If approved, Finance approval task is created.
6. If Finance approves, workflow completes and transaction status is updated only through transaction service action.

### Example 2: Failed Service Task

1. Workflow reaches Service Task `Send ERP Integration Event`.
2. Internal service call fails due to timeout.
3. Workflow retries according to retry policy.
4. After max retries, instance enters Failed or Manual Intervention state.
5. Support user reviews failure and retries manually.

## 10. Error Handling

| Error | Expected Behavior |
|---|---|
| Invalid workflow graph | Block publish. |
| Missing assignee resolver | Block publish or block instance start based on validation stage. |
| Service task timeout | Retry according to policy. |
| Timer duplicate fire | Ignore duplicate using idempotency key. |
| Inactive user assigned | Apply fallback policy or mark assignment failure. |
| Workflow trigger duplicate | Do not create duplicate instance. |
| Workflow version retired | Do not create new instance from retired version. |

## 11. Audit Requirements

| ID | Requirement | Priority |
|---|---|---|
| WF-AUD-001 | The system shall audit workflow definition create, update, publish, retire, clone, and delete attempts. | MVP |
| WF-AUD-002 | The system shall audit workflow instance start, node entry, node exit, task creation, task action, timer scheduled, timer fired, service task called, retry, failure, completion, cancellation, suspension, and termination. | MVP |
| WF-AUD-003 | The system shall capture actor, timestamp, workflow version, correlation ID, before state, after state, and reason where applicable. | MVP |
| WF-AUD-004 | Published workflow audit records shall be immutable. | MVP |

## 12. Security and RBAC

| ID | Requirement | Priority |
|---|---|---|
| WF-SEC-001 | Only authorized workflow admins shall create or modify workflow definitions. | MVP |
| WF-SEC-002 | Only authorized publishers shall publish workflow versions. | MVP |
| WF-SEC-003 | Users shall only see tasks assigned to them, their role, their group, or delegated to them. | MVP |
| WF-SEC-004 | Support override actions shall require elevated permission and mandatory reason. | MVP |
| WF-SEC-005 | Workflow audit access shall be permission-controlled. | MVP |

## 13. Acceptance Criteria

| ID | Acceptance Criteria |
|---|---|
| WF-AC-001 | A workflow admin can create a draft workflow with Start, Approval Task, Decision Gateway, Notification, and End nodes. |
| WF-AC-002 | The system blocks publishing if a node is unreachable. |
| WF-AC-003 | The system starts a workflow instance from a published version when a configured trigger fires. |
| WF-AC-004 | A user can complete an assigned task exactly once. Duplicate clicks do not create duplicate transitions. |
| WF-AC-005 | A failed service task follows configured retry policy. |
| WF-AC-006 | In-flight workflow instances continue on the version used at start after a new version is published. |
| WF-AC-007 | Audit trace shows all workflow transitions and actions. |

## 14. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Admin tries to publish workflow with no End node | Publish blocked. |
| Gateway has no valid outgoing transition | Publish blocked. |
| User not assigned to task tries to approve | Action blocked. |
| Service task retries exhausted | Instance moves to configured failure handling path. |
| Workflow trigger fires twice for same document event | Single instance created. |
| Admin modifies published version directly | Action blocked; new draft version required. |

## 15. Developer Implementation Notes

1. Implement workflow runtime as a state machine over versioned workflow metadata.
2. Do not implement direct transaction mutations inside workflow engine.
3. Workflow engine should call transaction service actions through explicit service contracts.
4. Store visual layout and executable definition separately.
5. All runtime operations must be idempotent.
6. All published versions must be immutable.
7. All workflow instance state transitions must be auditable.
8. Do not implement full BPMN standard if it complicates MVP. Implement required iDMS workflow primitives first.
