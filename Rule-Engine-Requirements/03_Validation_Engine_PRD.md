# 03 - Validation Engine PRD

## 1. Feature Overview

The Validation Engine is the authoritative backend service for validating transaction data, document actions, source eligibility, quantity constraints, lifecycle restrictions, stale data, and configuration-dependent rules.

It shall run consistently across UI, API, import, background job, and workflow-triggered actions.

## 2. Business Objective

Prevent invalid, inconsistent, duplicate, stale, or unauthorized transactions from being committed, while providing clear errors and traceable validation outcomes.

## 3. Scope

### 3.1 In Scope

- Field mandatory validation.
- Conditional mandatory validation.
- Field type and value validation.
- Lookup active/inactive validation.
- Source document eligibility validation.
- Single-source and multi-source compatibility validation.
- Quantity cap validation.
- Status and lifecycle validation.
- Post-save read-only enforcement.
- Stale record and optimistic locking validation.
- Idempotency pre-check support.
- Backend/API/import parity.
- Validation severity: Block, Warning, Info.
- Save-time revalidation.
- Validation result trace.
- Configuration hooks for document-specific packs.

### 3.2 Out of Scope

- Tax component calculation.
- Charge amount calculation.
- GL account resolution.
- Workflow task assignment.
- Transaction commit.
- Direct inventory movement.
- Direct parent progress update.

## 4. Personas

| Persona | Goal |
|---|---|
| Entity Studio Admin | Configure document validation rules. |
| Implementation Consultant | Configure tenant-specific stronger rules. |
| Runtime User | Receive clear validation messages. |
| Support Engineer | Diagnose why transaction was blocked. |
| QA | Test positive, negative, and boundary validation cases. |
| AI Developer Agent | Implement deterministic validation runtime. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Validation Rule | Rule that returns Block, Warning, or Info. |
| Blocking Validation | Prevents action from continuing. |
| Warning Validation | Allows action only if policy allows acknowledgement. |
| Informational Validation | Shows message but does not block. |
| Execution Point | When validation runs: on load, on field change, on calculate, on save, on submit, post-commit. |
| Source Eligibility | Whether selected source document can be used. |
| Save-Time Revalidation | Mandatory final check immediately before commit. |
| Stale Data | Data opened earlier but changed by another committed transaction. |
| Non-overridable Validation | Core validation that cannot be weakened. |

## 6. Validation Categories

VAL-CAT-001: The system shall support field mandatory validation.

VAL-CAT-002: The system shall support conditional mandatory validation.

VAL-CAT-003: The system shall support data type validation.

VAL-CAT-004: The system shall support range validation.

VAL-CAT-005: The system shall support lookup active value validation.

VAL-CAT-006: The system shall support permission validation.

VAL-CAT-007: The system shall support source eligibility validation.

VAL-CAT-008: The system shall support source line eligibility validation.

VAL-CAT-009: The system shall support single-source validation.

VAL-CAT-010: The system shall support same-source-type multi-source validation where allowed.

VAL-CAT-011: The system shall support quantity cap validation.

VAL-CAT-012: The system shall support status/lifecycle validation.

VAL-CAT-013: The system shall support stale data validation.

VAL-CAT-014: The system shall support duplicate-submit/idempotency validation.

VAL-CAT-015: The system shall support backend/API parity validation.

VAL-CAT-016: The system shall support configuration dependency validation.

VAL-CAT-017: The system shall support post-save read-only validation.

## 7. Execution Point Requirements

VAL-EXEC-001: Validations shall be assigned to one or more execution points.

VAL-EXEC-002: On Load validations shall check whether a form/action is available.

VAL-EXEC-003: On Change validations shall provide user feedback after field changes.

VAL-EXEC-004: On Calculate validations shall validate prerequisites for calculation.

VAL-EXEC-005: On Save validations shall run before transaction commit.

VAL-EXEC-006: On Submit validations shall run before workflow/approval submission.

VAL-EXEC-007: Post-Commit validations shall not block the already committed transaction; they may create alerts or diagnostic events only.

VAL-EXEC-008: Save-time validations shall be authoritative even if earlier UI validations passed.

VAL-EXEC-009: Workflow-triggered actions shall run the same backend validations as UI actions.

## 8. Severity Requirements

VAL-SEV-001: Validation result shall support severity Block.

VAL-SEV-002: Validation result shall support severity Warning.

VAL-SEV-003: Validation result shall support severity Info.

VAL-SEV-004: Blocking validation shall prevent the requested action.

VAL-SEV-005: Warning validation may require user acknowledgement if policy requires it.

VAL-SEV-006: Info validation shall not block action.

VAL-SEV-007: Severity shall be configurable only where rule type allows it.

VAL-SEV-008: Non-overridable core validations shall not be downgraded from Block to Warning.

## 9. Source Eligibility Requirements

VAL-SRC-001: The system shall validate selected source document type is allowed for the target document.

VAL-SRC-002: The system shall validate selected source document is saved/committed.

VAL-SRC-003: The system shall validate selected source document is accessible to the user.

VAL-SRC-004: The system shall validate selected source document is in an eligible status.

VAL-SRC-005: The system shall validate selected source document is not cancelled, reversed, expired, blocked, or closed where such status makes it ineligible.

VAL-SRC-006: The system shall validate selected source has pending quantity where quantity-based processing applies.

VAL-SRC-007: The system shall validate selected source line has pending quantity where line-level processing applies.

VAL-SRC-008: The system shall validate source line product/UOM context is valid.

VAL-SRC-009: The system shall validate source-derived fields are protected/read-only where required.

VAL-SRC-010: Source eligibility shall be checked at lookup time and rechecked at save time.

VAL-SRC-011: Save-time source recheck shall be mandatory and non-overridable for source-based execution documents.

## 10. Single Source and Multi-Source Requirements

VAL-MSRC-001: The system shall support single-source-only validation.

VAL-MSRC-002: The system shall block mixed source document types unless explicitly allowed by document configuration.

VAL-MSRC-003: The system shall support same-source-type multi-source validation where a document allows it.

VAL-MSRC-004: Same-source-type multi-source validation shall check configured compatibility rules such as same supplier, same customer, same branch, same currency, same place of supply, or same tax context.

VAL-MSRC-005: Mixed-source validation failures shall return all conflicting source references where possible.

## 11. Quantity Validation Requirements

VAL-QTY-001: The system shall validate quantity is numeric.

VAL-QTY-002: The system shall validate quantity precision according to product/UOM configuration.

VAL-QTY-003: The system shall validate active line quantity is greater than zero where required.

VAL-QTY-004: The system shall validate requested/executed quantity does not exceed pending quantity.

VAL-QTY-005: The system shall validate at least one active line exists where document save requires active lines.

VAL-QTY-006: The system shall validate serialized products follow one-unit or serial-count rules where configured.

VAL-QTY-007: The system shall validate batch/lot/stock-point quantities reconcile with line quantity where configured.

VAL-QTY-008: The system shall revalidate pending quantity at final save.

VAL-QTY-009: Quantity cap validations shall be non-overridable for source-based execution documents.

### 11.1 Common Quantity Formula Patterns

| Pattern | Formula |
|---|---|
| Pending Invoice Quantity | Source Quantity - Already Invoiced Quantity |
| Pending Delivery Quantity | Invoice Quantity - Already Delivered Quantity |
| Pending Return Request Quantity | Invoice Quantity - Already Returned Quantity - Already Requested Quantity |
| Pending Return Quantity | Source Returnable Quantity - Already Returned Quantity |
| Pending Allocation Quantity | Source Demand Quantity - Already Allocated Quantity |
| Pending Receipt Quantity | Ordered Quantity - Already Received Quantity |
| Pending Inward Quantity | Outward Quantity - Already Inwarded Quantity |

## 12. Lifecycle Validation Requirements

VAL-LC-001: The system shall validate whether the action is allowed in the current document status.

VAL-LC-002: The system shall block edit on final read-only statuses.

VAL-LC-003: The system shall block cancel/reverse/reopen actions where out of scope.

VAL-LC-004: The system shall validate line-level status restrictions where applicable.

VAL-LC-005: The system shall validate that downstream-processed scope cannot be edited unless explicitly allowed.

VAL-LC-006: The system shall validate cancellation safety where cancellation is supported.

VAL-LC-007: The system shall validate date-driven status transitions where configured.

## 13. Stale Data and Concurrency Requirements

VAL-STL-001: The system shall support row version or equivalent optimistic locking for transaction records.

VAL-STL-002: The system shall detect if source document or source line changed after user loaded it.

VAL-STL-003: The system shall block save if stale source data affects eligibility, quantity, status, pricing, tax, or other critical values.

VAL-STL-004: The validation error shall explain that data changed and reload is required.

VAL-STL-005: The system shall support final save-time re-fetch/recheck for source quantities.

## 14. Idempotency Validation Requirements

VAL-IDEMP-001: The system shall support duplicate submit detection.

VAL-IDEMP-002: Duplicate submit detection shall use idempotency key, transaction context, or system-generated request token.

VAL-IDEMP-003: If a duplicate save request is received after successful commit, the system shall return the existing committed result where safe.

VAL-IDEMP-004: If a duplicate save request is received while processing, the system shall prevent duplicate commit.

VAL-IDEMP-005: Idempotency validation shall apply to UI, API, import, and workflow-triggered actions.

## 15. Configuration Requirements

VAL-CONFIG-001: Admins shall be able to configure validation rules by entity and document type.

VAL-CONFIG-002: Admins shall be able to configure execution point.

VAL-CONFIG-003: Admins shall be able to configure severity where allowed.

VAL-CONFIG-004: Admins shall be able to configure validation message.

VAL-CONFIG-005: Admins shall be able to configure message parameters using fields from evaluation context.

VAL-CONFIG-006: Admins shall be able to mark validations as non-overridable only if they have platform-level permission.

VAL-CONFIG-007: Derived document types may add stricter validations but must not weaken non-overridable validations.

## 16. Runtime Validation Result

VAL-RESULT-001: Validation result shall include validation ID.

VAL-RESULT-002: Validation result shall include rule version ID.

VAL-RESULT-003: Validation result shall include severity.

VAL-RESULT-004: Validation result shall include message.

VAL-RESULT-005: Validation result shall include field reference where applicable.

VAL-RESULT-006: Validation result shall include line reference where applicable.

VAL-RESULT-007: Validation result shall include source reference where applicable.

VAL-RESULT-008: Validation result shall include remediation hint where configured.

## 17. Admin UI Requirements

VAL-UI-001: Admin Studio shall provide validation rule list and detail screens.

VAL-UI-002: Validation rule detail shall show entity, document type, execution point, condition, severity, message, and lifecycle status.

VAL-UI-003: Validation condition configuration shall use the shared condition builder.

VAL-UI-004: Admins shall be able to preview validation message with sample payload.

VAL-UI-005: The UI shall clearly mark non-overridable validations.

VAL-UI-006: The UI shall prevent standard tenant admins from weakening core validations.

## 18. API Requirements

VAL-API-001: The system shall expose an internal validation API for runtime services.

VAL-API-002: Validation API shall accept entity, document type, action, execution point, transaction payload, actor context, and source context.

VAL-API-003: Validation API shall return structured validation results.

VAL-API-004: Validation API shall support fail-fast and collect-all modes.

VAL-API-005: Validation API shall support simulation mode.

VAL-API-006: Validation API shall enforce tenant isolation.

## 19. Error Handling

| Error | Expected Behavior |
|---|---|
| Missing required field | Blocking validation. |
| Invalid source status | Blocking validation. |
| Quantity exceeds pending | Blocking validation. |
| Stale source | Blocking validation; ask reload. |
| Duplicate submit | Prevent duplicate commit. |
| Validation configuration invalid | Block publish. |
| Unknown validation type | Block publish/runtime registration. |

## 20. Audit Requirements

VAL-AUD-001: Runtime validation failures shall be traceable.

VAL-AUD-002: Save-blocking validation failures shall store failure reason and actor where configured.

VAL-AUD-003: Published validation version used during save shall be stored in transaction trace.

VAL-AUD-004: Warning acknowledgement shall be audited if warnings are allowed to proceed.

## 21. Examples

### 21.1 Sale Invoice from Sale Order

Validation:

- Creation Mode must be From Sale Order.
- Exactly one Sale Order source must be selected.
- Sale Order must be eligible.
- Invoice quantity must be greater than 0.
- Invoice quantity must not exceed pending invoice quantity.
- Source eligibility and pending quantity must be rechecked on save.

Expected result: Save allowed only if all validations pass.

### 21.2 Delivery from Sale Invoice

Validation:

- Source must be Sale Invoice.
- Direct Delivery is not allowed.
- Delivery quantity must be greater than 0.
- Delivery quantity must not exceed pending delivery quantity.
- Delivery must not mutate invoice commercial fields.

Expected result: Delivery save blocked if delivery quantity exceeds pending.

### 21.3 Purchase Invoice from Purchase Receipt

Validation:

- Purchase Receipt source must be finalized and eligible.
- Receipt-based invoice must not update inventory again.
- Duplicate supplier invoice number/date policy must pass.
- Tax setup must exist where tax applies.

Expected result: Save blocked if duplicate supplier invoice reference exists.

## 22. Acceptance Criteria

AC-VAL-001: Given a source-based document is saved, when source pending quantity changed after load, then save shall be blocked.

AC-VAL-002: Given a user uses API import, when payload violates same rule as UI, then API shall block with same validation code.

AC-VAL-003: Given a final read-only document, when user attempts edit, then edit shall be blocked.

AC-VAL-004: Given validation severity is Warning, when policy requires acknowledgement, then user acknowledgement shall be captured before proceed.

AC-VAL-005: Given a non-overridable validation exists, when derived document tries to weaken it, then publish shall be blocked.

## 23. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Invoice uses multiple Sale Orders in core | Block. |
| Delivery created without Sale Invoice | Block. |
| Return quantity exceeds pending | Block. |
| Purchase Invoice from PO when receipt exists and precedence blocks PO | Block. |
| Source document is stale | Block. |
| API skips required field | Block. |
| User tries edit after final status | Block. |

## 24. Edge Cases

| Edge Case | Handling |
|---|---|
| Source becomes ineligible during save | Final revalidation blocks commit. |
| Concurrent users consume same pending quantity | One commit succeeds; second fails revalidation. |
| Inactive lookup used in historical document | Display allowed historically; new selection blocked. |
| Zero-quantity lines retained for trace | Exclude from totals and execution impact where configured. |
| Time-based status expires during open form | Runtime recheck applies at save. |

## 25. Dependencies

- Rule Platform Foundation.
- Expression and Condition Engine.
- Calculation Engine for derived validation inputs.
- Entity metadata service.
- Transaction Service.
- Audit service.
- RBAC service.

## 26. Open Questions

VAL-OQ-001: Should warning acknowledgements be allowed in MVP or deferred?

VAL-OQ-002: Should validation failures be persisted for every failed attempt or only high-risk actions?

VAL-OQ-003: Should validation rules support localization of messages in MVP?

## 27. AI Developer Agent Notes

AIDEV-VAL-001: Implement validation as backend-authoritative.

AIDEV-VAL-002: Do not make UI validation the only check.

AIDEV-VAL-003: Do not perform transaction commit inside validation engine.

AIDEV-VAL-004: Ensure validation API is reusable by UI, API, import, and workflow-triggered actions.

AIDEV-VAL-005: Ensure save-time revalidation is always available for source and quantity rules.
