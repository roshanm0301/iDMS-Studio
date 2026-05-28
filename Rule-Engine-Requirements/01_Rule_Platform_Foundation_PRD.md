# 01 - Rule Platform Foundation PRD

## 1. Feature Overview

The Rule Platform Foundation provides common capabilities used by all native iDMS rule-driven areas. It stores rule metadata, lifecycle state, versions, scope, ownership, publish status, rollback references, and execution eligibility.

It does not implement domain-specific charge, tax, accounting, workflow, or approval logic. It provides the shared foundation those engines use.

## 2. Business Objective

Enable business administrators to define, govern, version, publish, retire, and trace rule configurations safely across iDMS without developer intervention for routine policy changes.

## 3. Scope

### 3.1 In Scope

- Rule registry.
- Rule type catalog.
- Rule ownership and metadata.
- Rule lifecycle states.
- Draft, review, approve, publish, retire, rollback.
- Version creation and immutability.
- Scope resolution.
- Effective dating.
- Rule status and activation.
- Dependency metadata.
- Publish validation hooks.
- Admin Studio list/detail screens.
- Change audit hooks.
- Runtime retrieval APIs.
- AI Developer Agent implementation constraints.

### 3.2 Out of Scope

- Detailed Charge Rule Engine behavior.
- Detailed Tax Rule Engine behavior.
- Detailed Accounting Rule Engine behavior.
- Detailed Workflow Engine behavior.
- Detailed Approval Engine behavior.
- Full simulation workbench implementation.
- Arbitrary user-written code.
- Direct transaction commit.
- Direct ledger or inventory posting.

## 4. Personas

| Persona | Goal |
|---|---|
| Business Admin | Create and maintain rules within authorized scope. |
| Finance Admin | Manage finance-owned rules such as accounting and charge policies. |
| Tax Admin | Manage tax-owned rules. |
| Process Admin | Manage approval and workflow policies. |
| Reviewer / Approver | Review and approve rule versions before publish. |
| Auditor | Inspect published versions and change history. |
| Support Engineer | Diagnose runtime rule version and evaluation issues. |
| AI Developer Agent | Implement features exactly as specified. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Rule Family | Logical family of a rule across versions. |
| Rule Version | Immutable version of a rule. |
| Rule Type | Category such as Validation, Calculation, Charge, Tax, Accounting, Approval Decision, Workflow Decision. |
| Rule Scope | Applicability boundary such as tenant, organization, branch, role, entity, document type, date. |
| Rule Status | Lifecycle state. |
| Published Version | Active immutable version eligible for runtime selection. |
| Retired Version | Historical version not selected for new runtime execution. |
| Draft Version | Editable version not used in production runtime. |
| Effective Date | Date/time range during which a rule version is eligible. |
| Publish Validation | Checks required before a rule version can become published. |

## 6. Functional Requirements

### 6.1 Rule Registry

RULE-FND-001: The system shall provide a central rule registry for all rule definitions.

RULE-FND-002: Each rule shall belong to exactly one rule family.

RULE-FND-003: Each rule family shall have one or more rule versions.

RULE-FND-004: Each rule version shall have a unique system-generated version ID.

RULE-FND-005: Each rule family shall have a stable rule code that remains consistent across versions.

RULE-FND-006: The rule registry shall support at least the following rule types: Validation, Calculation, Charge, Tax, Accounting, Approval Decision, Workflow Decision, Field Behavior, Output Rule, Integration Rule.

RULE-FND-007: The rule registry shall allow future addition of new rule types without database redesign.

RULE-FND-008: Each rule version shall store display name, description, owner, rule type, domain, entity, document type, scope, effective date, lifecycle status, and audit fields.

RULE-FND-009: Each rule version shall store references to expression, condition, action, output, or domain-specific configuration records where applicable.

RULE-FND-010: The system shall prevent duplicate active rule codes within the same tenant and rule type.

### 6.2 Rule Lifecycle

RULE-LC-001: The system shall support these lifecycle states: Draft, In Review, Approved, Published, Retired, Rejected, Archived.

RULE-LC-002: A new rule shall be created in Draft status.

RULE-LC-003: Draft versions shall be editable by authorized users.

RULE-LC-004: Published versions shall be immutable.

RULE-LC-005: Editing a Published rule shall create a new Draft version.

RULE-LC-006: Retired versions shall remain visible in history and audit.

RULE-LC-007: Rejected versions shall not be eligible for runtime execution.

RULE-LC-008: Archived versions shall remain available for audit but hidden from normal admin lists by default.

RULE-LC-009: The system shall enforce valid lifecycle transitions.

RULE-LC-010: The system shall block transition from Draft to Published without required publish validations.

#### Valid Lifecycle Transitions

| From | To | Allowed? | Notes |
|---|---|---:|---|
| Draft | In Review | Yes | Submitted for review. |
| In Review | Draft | Yes | Sent back for correction. |
| In Review | Approved | Yes | Reviewer approval. |
| In Review | Rejected | Yes | Review rejection. |
| Approved | Published | Yes | Publish action. |
| Published | Retired | Yes | Stops future runtime selection. |
| Published | Draft | No | Must create new version. |
| Retired | Published | Yes | Rollback/reactivation only through governance action. |
| Rejected | Published | No | Must create new draft version. |

### 6.3 Versioning

RULE-VER-001: The system shall maintain major and minor version labels.

RULE-VER-002: The system shall generate version labels automatically unless manual label override is allowed by configuration.

RULE-VER-003: Published versions shall store an immutable snapshot of all executable metadata.

RULE-VER-004: Published versions shall not depend on mutable draft records for runtime execution.

RULE-VER-005: Runtime execution shall reference the exact published rule version used.

RULE-VER-006: A rule family may have multiple historical published versions, but only one version shall be selected for a given scope, date, and priority resolution unless rule type supports multiple matches.

RULE-VER-007: The system shall support comparing two rule versions.

RULE-VER-008: Version comparison shall show changes in metadata, scope, conditions, expressions, outputs, and effective dates.

RULE-VER-009: The system shall retain created by, created time, submitted by, reviewed by, approved by, published by, and retired by audit fields.

RULE-VER-010: The system shall prevent deleting a rule version that was ever used in runtime execution.

### 6.4 Scope Resolution

RULE-SCOPE-001: The system shall support rule scoping by tenant.

RULE-SCOPE-002: The system shall support rule scoping by parent organization.

RULE-SCOPE-003: The system shall support rule scoping by business unit where applicable.

RULE-SCOPE-004: The system shall support rule scoping by branch where applicable.

RULE-SCOPE-005: The system shall support rule scoping by role where applicable.

RULE-SCOPE-006: The system shall support rule scoping by entity.

RULE-SCOPE-007: The system shall support rule scoping by document type.

RULE-SCOPE-008: The system shall support rule scoping by effective date/time.

RULE-SCOPE-009: The system shall support rule scoping by transaction context fields if the domain engine allows it.

RULE-SCOPE-010: Scope resolution shall be deterministic.

RULE-SCOPE-011: The system shall define a priority order when multiple scopes match.

RULE-SCOPE-012: Unless changed by product governance, default specificity order shall be: Role, Branch, Business Unit, Organization, Tenant, Platform.

RULE-SCOPE-013: A more specific rule may strengthen or override configurable behavior only if the rule type allows override.

RULE-SCOPE-014: A more specific rule must not weaken non-overridable core controls.

### 6.5 Effective Dating

RULE-EFF-001: Each rule version shall support Effective From.

RULE-EFF-002: Each rule version may support Effective To.

RULE-EFF-003: Effective To shall be greater than Effective From when provided.

RULE-EFF-004: Runtime selection shall use transaction effective date, not always current system date.

RULE-EFF-005: The transaction effective date source shall be defined per rule type.

RULE-EFF-006: For tax and charge rules, effective date must be mandatory.

RULE-EFF-007: For validation rules, effective date may be optional if the rule is permanent.

RULE-EFF-008: Overlapping effective periods for mutually exclusive rule versions shall be blocked at publish.

### 6.6 Publish Validation

RULE-GOV-001: The system shall run publish validation before a rule version can be Published.

RULE-GOV-002: Publish validation shall check required metadata.

RULE-GOV-003: Publish validation shall check scope conflicts.

RULE-GOV-004: Publish validation shall check effective-date conflicts.

RULE-GOV-005: Publish validation shall check condition and expression validity.

RULE-GOV-006: Publish validation shall check output contract completeness.

RULE-GOV-007: Publish validation shall check references to active entities, fields, document types, and lookup values.

RULE-GOV-008: Publish validation shall check domain-specific mandatory constraints through domain engine hooks.

RULE-GOV-009: Publish validation shall return a structured list of blocking errors and warnings.

RULE-GOV-010: Blocking errors shall prevent publish.

RULE-GOV-011: Warnings may allow publish only if the publish policy permits override.

RULE-GOV-012: Publish validation results shall be stored in configuration audit.

### 6.7 Rollback and Retire

RULE-RBK-001: Authorized users shall be able to retire a published rule version.

RULE-RBK-002: Authorized users shall be able to reactivate a previous valid published version through rollback governance.

RULE-RBK-003: Rollback shall create an audit event.

RULE-RBK-004: Rollback shall not alter historical runtime traces.

RULE-RBK-005: Rollback shall affect only future runtime evaluations after rollback effective time.

RULE-RBK-006: The system shall require reason remarks for retire and rollback.

### 6.8 Admin Studio UI

RULE-UI-001: Admin Studio shall provide a rule list page.

RULE-UI-002: The rule list page shall support search by rule code, name, type, status, owner, entity, and document type.

RULE-UI-003: The rule list page shall support filters by tenant, organization, branch, rule type, status, effective date, and owner where the user has access.

RULE-UI-004: Admin Studio shall provide a rule detail page.

RULE-UI-005: The rule detail page shall show metadata, scope, conditions, outputs, version history, publish status, and audit history.

RULE-UI-006: Published versions shall open in read-only mode.

RULE-UI-007: Draft versions shall show editable fields according to permissions.

RULE-UI-008: The UI shall clearly label whether the user is editing a draft or viewing a published version.

RULE-UI-009: The UI shall provide submit for review, approve, reject, publish, retire, rollback, and create new version actions according to status and permission.

RULE-UI-010: The UI shall prevent accidental publish by requiring confirmation and reason where configured.

### 6.9 Drag-and-Drop Support in Foundation

RULE-DND-001: Rule Platform Foundation shall support storing visual layout metadata for rule builders that require drag-and-drop.

RULE-DND-002: Visual layout metadata shall not be used as executable truth.

RULE-DND-003: Executable rule metadata shall be stored in structured machine-readable form.

RULE-DND-004: Builder UIs may use drag-and-drop for condition grouping, formula composition, workflow design, approval flow design, tax rule tree design, and charge sequence design.

RULE-DND-005: Each drag-and-drop builder shall validate executable metadata before saving and publishing.

### 6.10 Runtime Retrieval

RULE-RUN-001: Runtime services shall retrieve only Published rule versions unless simulation mode explicitly requests Draft versions.

RULE-RUN-002: Runtime retrieval shall filter by rule type, tenant, entity, document type, effective date, and active status.

RULE-RUN-003: Runtime retrieval shall return enough metadata for traceability.

RULE-RUN-004: Runtime retrieval shall be cacheable by published version ID.

RULE-RUN-005: Runtime retrieval shall not return Draft or Rejected versions in production execution.

## 7. Data Model Requirements

### 7.1 Rule Family

| Field | Required | Notes |
|---|---:|---|
| rule_family_id | Yes | System ID. |
| rule_code | Yes | Stable business/system code. |
| rule_type | Yes | Validation, Calculation, Charge, Tax, Accounting, etc. |
| domain | Yes | Document, Commercial, Tax, Accounting, Workflow, Approval. |
| tenant_id | Yes | Tenant isolation. |
| owner_user_id | Conditional | Rule owner. |
| owner_role_id | Conditional | Rule owner role. |
| is_system_rule | Yes | Identifies platform/core rules. |
| created_at | Yes | Audit. |
| created_by | Yes | Audit. |

### 7.2 Rule Version

| Field | Required | Notes |
|---|---:|---|
| rule_version_id | Yes | System ID. |
| rule_family_id | Yes | Parent. |
| version_label | Yes | Example: v1.0. |
| status | Yes | Draft, Published, etc. |
| entity_id | Conditional | Required for entity-bound rules. |
| document_type_id | Conditional | Required for document type rules. |
| scope_json | Yes | Scope definition. |
| effective_from | Conditional | Mandatory for charge/tax/accounting where applicable. |
| effective_to | No | Optional. |
| condition_ref | Conditional | Reference to conditions. |
| expression_ref | Conditional | Reference to expressions. |
| output_contract_json | Conditional | Expected output. |
| domain_config_ref | Conditional | Domain-specific record. |
| immutable_snapshot_json | Required when published | Runtime snapshot. |
| publish_validation_json | Required when published | Last publish validation. |
| created_at / by | Yes | Audit. |
| submitted_at / by | Conditional | Governance. |
| approved_at / by | Conditional | Governance. |
| published_at / by | Conditional | Governance. |
| retired_at / by | Conditional | Governance. |

## 8. API Requirements

RULE-API-001: The system shall expose an internal API to create a rule draft.

RULE-API-002: The system shall expose an internal API to update a rule draft.

RULE-API-003: The system shall expose an internal API to submit a rule for review.

RULE-API-004: The system shall expose an internal API to approve or reject a rule version.

RULE-API-005: The system shall expose an internal API to publish a rule version.

RULE-API-006: The system shall expose an internal API to retire a rule version.

RULE-API-007: The system shall expose an internal API to retrieve applicable published rules for runtime execution.

RULE-API-008: The system shall expose an internal API to retrieve version history.

RULE-API-009: APIs shall enforce RBAC and tenant isolation.

RULE-API-010: APIs shall return structured errors with code, message, field reference, severity, and remediation where possible.

## 9. Error Handling

| Error | Expected Behavior |
|---|---|
| Duplicate rule code | Block save with clear message. |
| Missing required metadata | Block save or publish depending on field. |
| Invalid scope | Block save or publish. |
| Overlapping effective dates | Block publish. |
| Invalid referenced entity/field | Block publish. |
| Attempt to edit Published version | Block edit; offer create new draft version. |
| Unauthorized action | Block action and audit attempt. |
| Runtime requested Draft rule | Reject unless simulation mode. |

## 10. Audit Requirements

RULE-AUD-001: The system shall audit rule create, update, submit, approve, reject, publish, retire, rollback, archive, and failed governance actions.

RULE-AUD-002: Audit shall include actor, timestamp, previous values, new values, action, reason, and source channel.

RULE-AUD-003: Rule publish audit shall include publish validation result.

RULE-AUD-004: Rule rollback audit shall include old version, new active version, actor, reason, and effective time.

## 11. Security and RBAC

RULE-SEC-001: Access to rule configuration shall be permission-controlled by rule type and scope.

RULE-SEC-002: Users shall not view or edit rules outside their tenant and authorized organization scope.

RULE-SEC-003: Publish permission shall be separate from edit permission.

RULE-SEC-004: Approval/review permission shall be separate from create/edit permission.

RULE-SEC-005: System rules shall be editable only by authorized platform administrators.

## 12. Examples

### 12.1 Create a Validation Rule Draft

Business need: Sale Invoice from Sale Order must not allow invoice quantity above pending quantity.

Expected configuration:

- Rule Type: Validation.
- Entity: Sale Invoice.
- Document Type: Core Sale Invoice.
- Scope: Tenant + Organization.
- Effective From: Optional or configured.
- Condition: Creation Mode = From Sale Order.
- Output: Blocking validation if Invoice Quantity > Pending Invoice Quantity.

### 12.2 Create a Charge Rule Draft

Business need: Apply freight charge if delivery mode is Transporter and invoice amount is below threshold.

Expected configuration:

- Rule Type: Charge.
- Entity: Sale Invoice.
- Charge Master: Freight.
- Condition: Delivery Mode = Transporter AND Net Amount < 50000.
- Method: Fixed Amount.
- Effective From: Mandatory.
- Conflict Strategy: Priority.

### 12.3 Publish and Rollback

- Admin creates v1.1 draft from v1.0 published.
- Reviewer approves v1.1.
- Admin publishes v1.1.
- Runtime starts using v1.1 for future transactions.
- If issue found, authorized user rolls back to v1.0.
- Existing transactions retain trace to the version that actually executed.

## 13. Acceptance Criteria

AC-RULE-FND-001: Given an authorized admin creates a new rule, when saved, then it shall be stored in Draft status.

AC-RULE-FND-002: Given a rule is Published, when a user attempts direct edit, then the system shall block edit and offer create new draft version.

AC-RULE-FND-003: Given a rule has overlapping effective dates with a mutually exclusive published version, when user attempts publish, then publish shall be blocked.

AC-RULE-FND-004: Given a runtime service requests applicable rules, when no published rule exists, then the service shall return an empty rule set or configured default response, not a draft rule.

AC-RULE-FND-005: Given a rollback is performed, when future runtime evaluation occurs, then the rolled-back version shall be eligible according to effective date and scope.

## 14. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| User tries to publish rule with invalid field reference | Publish blocked. |
| User tries to edit published rule | Edit blocked. |
| User tries to publish without permission | Action blocked and audited. |
| Runtime requests inactive retired rule | Rule not returned. |
| More specific rule weakens non-overridable platform control | Publish blocked. |
| Rule references deleted document type | Publish blocked or rule marked broken. |

## 15. Edge Cases

| Edge Case | Expected Handling |
|---|---|
| Rule owner leaves organization | Rule remains valid; ownership can be reassigned by authorized admin. |
| Effective To expires during open transaction | Runtime uses transaction effective date and saved version trace. |
| Two admins edit same draft | Optimistic locking shall prevent lost update. |
| Rule is retired after transaction started but before save | Save-time rule selection policy shall define whether opened version or current version applies; default is final save-time selection. |
| System clock mismatch | Server time shall be authoritative. |

## 16. Dependencies

- Entity metadata service.
- User/RBAC service.
- Audit service.
- Expression and condition engine.
- Domain engines for publish validation hooks.
- Runtime orchestrator.

## 17. Open Questions

RULE-OQ-001: Should tenant admins be allowed to rollback without central platform approval?

RULE-OQ-002: Should rule publish support scheduled future activation?

RULE-OQ-003: Should rule import/export be part of MVP or Phase 2?

RULE-OQ-004: Should rule diff be MVP for high-risk domains like tax/accounting?

## 18. AI Developer Agent Notes

AIDEV-RULE-001: Implement foundation services generically, but do not implement charge/tax/accounting domain-specific outputs in this PRD.

AIDEV-RULE-002: Do not hardcode a rule type list in a way that blocks future extension.

AIDEV-RULE-003: Do not allow published metadata to be updated in place.

AIDEV-RULE-004: Do not skip audit for configuration changes.

AIDEV-RULE-005: Do not expose rules from other tenants through APIs.
