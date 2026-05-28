# 07A - Financial Rule Execution Orchestration PRD

## 1. Feature Overview

Financial Rule Execution Orchestration defines how native iDMS executes charge, tax, total, approval-decision, and accounting-preview logic in a deterministic and auditable sequence for transaction documents.

This feature is not a separate business rule engine. It is the orchestration contract that coordinates existing native engines and transaction services without allowing tight coupling or hidden side effects.

It is critical because Charge Rules, Tax Rules, Accounting Rules, Validation Rules, Calculation Rules, Approval Decisions, and Transaction Commit logic are interdependent but must remain separated.

## 2. Business Objective

Ensure every financial transaction in iDMS produces correct, repeatable, explainable, and auditable commercial, tax, and accounting outputs without allowing individual document modules to hardcode or duplicate financial logic.

## 3. Scope

### 3.1 In Scope

- Standard execution sequence for financial rule evaluation.
- Runtime coordination of Validation, Calculation, Charge, Tax, Accounting, Approval Decision, Audit, and Transaction Service.
- Preview mode and final-save mode behavior.
- Error propagation and blocking rules.
- Recalculation triggers.
- Snapshot handling.
- Version selection.
- Idempotency expectations.
- Trace correlation across financial engines.
- Admin-facing diagnostics for execution trace.
- AI Developer Agent implementation constraints.

### 3.2 Out of Scope

- Detailed Charge Rule configuration. Covered in Charge PRD.
- Detailed Tax Rule configuration. Covered in Tax PRD.
- Detailed Accounting Rule configuration. Covered in Accounting PRD.
- Long-running workflow execution. Covered in Workflow Engine PRD.
- Actual transaction commit implementation. Owned by Transaction Service.
- Ledger posting implementation. Owned by Accounting Posting Service where applicable.
- Inventory posting implementation. Owned by Inventory/Transaction Service.

## 4. Personas

| Persona | Goal |
|---|---|
| Product Manager | Ensure financial rule behavior is consistent across modules. |
| Solution Architect | Define engine boundaries and runtime sequence. |
| AI Developer Agent | Implement orchestration without inventing side effects. |
| QA Architect | Test deterministic execution across document types. |
| Support Engineer | Diagnose mismatched charge/tax/accounting results. |
| Auditor | Trace exact versions and inputs used for transaction output. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Financial Orchestrator | Native iDMS service/logic that coordinates financial rule execution. |
| Preview Mode | Non-committing execution for UI preview, simulation, or draft calculation. |
| Final-Save Mode | Save-time execution or revalidation before transaction commit. |
| Post-Commit Mode | Execution after transaction commit for downstream events or asynchronous handoff. |
| Calculation Snapshot | Saved commercial/tax/accounting result attached to transaction. |
| Execution Context | Tenant, organization, branch, entity, document type, user, role, transaction date, payload. |
| Trace Correlation ID | Shared trace ID across validation, charge, tax, accounting, approval, and transaction logs. |
| Blocking Error | Error that prevents transaction save or publish. |
| Warning | Non-blocking issue shown to user and optionally audited. |
| Engine Boundary | Rule defining what each capability may and may not do. |

## 6. Architecture Boundary Matrix

| Capability | May Decide | May Calculate | May Commit Data | May Start Workflow | May Post Ledger |
|---|---:|---:|---:|---:|---:|
| Validation Engine | Yes | Limited | No | No | No |
| Calculation Engine | No | Yes | No | No | No |
| Charge Engine | Yes | Yes | No | No | No |
| Tax Engine | Yes | Yes | No | No | No |
| Accounting Rule Engine | Yes | Yes | No | No | No |
| Approval Decision Engine | Yes | No | No | No | No |
| Workflow Engine | Routes process | No financial calc | No direct transaction commit | Yes | No |
| Transaction Service | No rule authoring | Limited derived commit | Yes | Emits event | No unless accounting service owns |
| Accounting Posting Service | No | No | Yes for ledger | No | Yes |

## 7. Standard Financial Execution Sequence

### 7.1 Recommended Sequence

FIN-SEQ-001: The system shall use a deterministic financial execution sequence for transaction documents.

FIN-SEQ-002: The standard sequence shall be:

```text
1. Authorization and access validation
2. Document configuration validation
3. Source eligibility and source freshness validation
4. Mandatory field and lookup validation
5. Quantity/status/lifecycle validation
6. Base pricing and base amount calculation
7. Discount and pre-tax charge execution
8. Taxable base calculation
9. Tax rule execution
10. Post-tax charge execution
11. Totals, round-off, and payable/receivable amount calculation
12. Approval requirement decision
13. Accounting rule preview/handoff resolution
14. Final save-time revalidation
15. Transaction Service atomic commit
16. Post-commit workflow/integration/accounting events where configured
17. Audit and trace finalization
```

FIN-SEQ-003: The system shall allow document-specific sequence extensions only through approved extension points.

FIN-SEQ-004: The system shall not allow document modules to reorder charge, tax, total, and accounting execution arbitrarily.

FIN-SEQ-005: The system shall block configuration that creates circular dependency between charges, tax, totals, and accounting output.

FIN-SEQ-006: The system shall expose the resolved execution sequence in diagnostics.

FIN-SEQ-007: The system shall store execution sequence version or policy reference in trace.

## 8. Execution Modes

### 8.1 Preview Mode

FIN-MOD-001: The system shall support Preview Mode.

FIN-MOD-002: Preview Mode shall execute applicable rules without committing transaction data.

FIN-MOD-003: Preview Mode shall be used for UI calculation preview, simulation, and pre-save validation feedback.

FIN-MOD-004: Preview Mode shall return calculated values, warnings, errors, trace details, and version details.

FIN-MOD-005: Preview Mode shall not update parent quantities.

FIN-MOD-006: Preview Mode shall not post inventory.

FIN-MOD-007: Preview Mode shall not post ledger entries.

FIN-MOD-008: Preview Mode may generate temporary trace logs where configured but must mark them as non-committed preview traces.

### 8.2 Final-Save Mode

FIN-MOD-010: The system shall support Final-Save Mode.

FIN-MOD-011: Final-Save Mode shall revalidate mandatory rules before transaction commit.

FIN-MOD-012: Final-Save Mode shall use the latest eligible published rules unless a locked approved snapshot is passed by the Transaction Service.

FIN-MOD-013: Final-Save Mode shall return blocking errors when required financial outputs cannot be produced.

FIN-MOD-014: Final-Save Mode shall produce transaction-ready snapshots for charges, taxes, totals, and accounting preview where configured.

FIN-MOD-015: Final-Save Mode shall not independently commit records; it shall return results to Transaction Service.

### 8.3 Post-Commit Mode

FIN-MOD-020: The system shall support Post-Commit Mode for configured events.

FIN-MOD-021: Post-Commit Mode may be used for asynchronous accounting handoff, notifications, reporting events, or workflow initiation.

FIN-MOD-022: Post-Commit Mode shall use committed transaction snapshot as input.

FIN-MOD-023: Post-Commit Mode shall be idempotent.

FIN-MOD-024: Post-Commit Mode failures shall follow configured retry/dead-letter/manual intervention policy.

## 9. Version Selection

FIN-VER-001: Runtime orchestration shall select rule versions based on tenant, organization, branch, entity, document type, transaction date, effective date, status, and scope.

FIN-VER-002: Only Published rule versions shall be eligible for production runtime execution.

FIN-VER-003: Retired rules shall remain available only for historical trace and replay.

FIN-VER-004: If transaction date is backdated, the system shall use effective-date policy configured for the document type.

FIN-VER-005: The system shall store selected version IDs for charge, tax, accounting, validation, calculation, and approval decisions.

FIN-VER-006: The system shall ensure historical transaction replay can use saved snapshots and version references.

FIN-VER-007: The system shall not silently switch rule versions during final commit after preview unless final re-evaluation policy is explicitly configured.

FIN-VER-008: If rule version changed between preview and save, the system shall either re-evaluate and inform the user or use locked snapshot based on document policy.

## 10. Engine Interoperability Requirements

### 10.1 Charge to Tax

FIN-INT-001: Charge Engine shall provide tax-impact metadata to the Financial Orchestrator.

FIN-INT-002: Tax Engine shall consume pre-tax taxable charge metadata when calculating taxable base.

FIN-INT-003: Tax Engine shall not call Charge Engine directly.

FIN-INT-004: Charge Engine shall not call Tax Engine directly.

FIN-INT-005: Financial Orchestrator shall coordinate charge-tax sequencing.

### 10.2 Tax to Accounting

FIN-INT-010: Tax Engine shall provide tax component output to Financial Orchestrator.

FIN-INT-011: Accounting Rule Engine may consume tax component amounts as input for posting preview.

FIN-INT-012: Accounting Rule Engine shall not recalculate tax.

FIN-INT-013: Tax Engine shall not resolve GL accounts.

### 10.3 Charge to Accounting

FIN-INT-020: Accounting Rule Engine may consume applied charge snapshots as amount sources.

FIN-INT-021: Accounting Rule Engine shall not recalculate charge amounts.

FIN-INT-022: Charge Engine shall not resolve GL accounts.

### 10.4 Approval Decision

FIN-INT-030: Approval requirement decision shall execute after charge, tax, and totals are available unless configured for earlier gating.

FIN-INT-031: Approval Decision Engine may consume calculated discount, charge, tax, amount, margin, deviation, and override facts.

FIN-INT-032: Approval Decision Engine shall not create workflow tasks directly; Workflow/Approval Engine shall own task creation.

FIN-INT-033: Financial Orchestrator shall return approval requirement output to Transaction Service or Workflow Engine as configured.

### 10.5 Transaction Service

FIN-INT-040: Transaction Service shall be the only owner of atomic transaction commit.

FIN-INT-041: Financial Orchestrator shall return calculated snapshots and validation results to Transaction Service.

FIN-INT-042: Transaction Service shall decide whether to commit, rollback, or block save.

FIN-INT-043: Financial engines shall not update source/parent documents directly.

FIN-INT-044: Parent updates shall happen only as part of Transaction Service atomic commit.

## 11. Snapshot Requirements

FIN-SNP-001: The system shall store applied charge snapshot on transaction save.

FIN-SNP-002: The system shall store tax calculation snapshot on transaction save.

FIN-SNP-003: The system shall store totals and round-off snapshot on transaction save.

FIN-SNP-004: The system shall store accounting posting intent snapshot or reference where generated.

FIN-SNP-005: Snapshots shall include rule version references.

FIN-SNP-006: Snapshots shall include input facts necessary for audit and replay where permitted.

FIN-SNP-007: Snapshots shall be immutable after transaction commit unless an approved correction/reversal process exists.

FIN-SNP-008: Output/print shall use saved snapshots, not live recalculation.

FIN-SNP-009: Reports shall use saved snapshots unless explicitly marked as recalculated analytics.

## 12. Error Handling and Blocking Behavior

FIN-ERR-001: The system shall classify orchestration results as Success, Warning, Blocking Error, Retryable Error, or System Failure.

FIN-ERR-002: Blocking errors shall prevent transaction commit.

FIN-ERR-003: Warnings shall be shown to user and may be saved in trace where configured.

FIN-ERR-004: Retryable errors shall follow retry policy only for asynchronous post-commit flows.

FIN-ERR-005: Save-time synchronous failures shall return controlled error and shall not partially commit.

FIN-ERR-006: If Tax Engine fails and tax is mandatory, transaction save shall be blocked.

FIN-ERR-007: If Charge Engine fails for mandatory charge setup, transaction save shall be blocked.

FIN-ERR-008: If Accounting Preview fails and accounting preview is mandatory, transaction save shall be blocked.

FIN-ERR-009: If Accounting Preview is optional, failure shall produce warning based on document policy.

FIN-ERR-010: System failure shall include trace correlation ID for support.

## 13. Idempotency Requirements

FIN-IDM-001: Financial rule orchestration shall support idempotent evaluation for same input payload and rule versions.

FIN-IDM-002: Final save shall use Transaction Service idempotency key.

FIN-IDM-003: Post-commit events shall use idempotent event keys.

FIN-IDM-004: Duplicate user save clicks shall not create duplicate charge, tax, accounting, audit, or parent update records.

FIN-IDM-005: Duplicate accounting handoff shall not create duplicate ledger posting.

FIN-IDM-006: Trace records shall be correlated rather than duplicated where possible.

## 14. Performance Requirements

FIN-PERF-001: The orchestrator shall pre-filter eligible rules before evaluating conditions.

FIN-PERF-002: Rule retrieval shall use tenant, entity, document type, status, effective date, and scope indexes.

FIN-PERF-003: Published expressions should be compiled or cached where safe.

FIN-PERF-004: Tax rates should be cached by effective date and dimensions where safe.

FIN-PERF-005: Charge rule evaluation should short-circuit when scope or applicability pre-filter fails.

FIN-PERF-006: Accounting rule evaluation should run only after required monetary values are available.

FIN-PERF-007: The orchestrator shall avoid repeated recalculation of unchanged dependency blocks.

FIN-PERF-008: The system shall capture execution duration per engine for diagnostics.

FIN-PERF-009: The system shall provide timeout controls per engine.

FIN-PERF-010: Timeout shall return controlled error and trace reference.

## 15. Admin Studio Diagnostics

FIN-DIA-001: Admin Studio shall expose execution trace to authorized users.

FIN-DIA-002: Trace shall show validation, calculation, charge, tax, total, approval decision, and accounting stages.

FIN-DIA-003: Trace shall show stage status: skipped, success, warning, blocked, failed.

FIN-DIA-004: Trace shall show rule versions used.

FIN-DIA-005: Trace shall show input facts used by each stage where permission allows.

FIN-DIA-006: Trace shall show output of each stage.

FIN-DIA-007: Trace shall show execution duration per stage.

FIN-DIA-008: Trace shall show correlation ID.

FIN-DIA-009: Trace shall support filtering by document, rule version, error type, user, date, and engine.

FIN-DIA-010: Published business users may see simplified trace; support/architects may see advanced trace.

## 16. Document-Specific Usage Examples

### 16.1 Sale Invoice Execution Example

```text
1. User creates Sale Invoice from Sale Order
2. Source eligibility validates pending invoice quantity
3. Base amount calculated
4. Dealer discount applies
5. Freight charge applies pre-tax
6. Tax Engine resolves GST
7. Post-tax round-off applies
8. Approval required if discount deviation exceeds threshold
9. Accounting preview resolves receivable, sales, GST posting lines
10. Transaction Service commits invoice, parent progress, audit, snapshots
11. Workflow starts if approval or post-save workflow is configured
```

### 16.2 Purchase Invoice Execution Example

```text
1. User creates Purchase Invoice from Purchase Receipt
2. Source precedence and pending invoice quantity validate
3. Duplicate supplier invoice reference validates
4. Charges apply if configured
5. Tax Engine calculates input GST/VAT
6. Totals calculate
7. Accounting preview resolves expense/inventory, input tax, supplier payable
8. Transaction Service commits invoice and source invoice progress
```

### 16.3 Delivery Execution Example

```text
1. Delivery validates Sale Invoice source and pending delivery quantity
2. No tax recalculation occurs
3. No charge recalculation occurs unless document specifically enables delivery charges
4. Inventory movement executes through Transaction/Inventory Service
5. Sale Invoice commercial values remain unchanged
```

### 16.4 Return Execution Example

```text
1. Return validates source and pending return quantity
2. Return deductions/charges apply where enabled
3. Tax reversal or reference behavior is determined by configured tax policy
4. Accounting preview may produce return accounting intent where configured
5. Inventory impact is committed atomically by Transaction Service
```

### 16.5 Stock Transfer Outward/Inward Example

```text
1. STO validates STOR source and pending outward quantity
2. Product rate and tax behavior follow inherited configuration where applicable
3. Supplier-side inventory update is owned by Transaction Service
4. STI later validates Closed STO with pending inward quantity
5. STI updates receiving-side inventory and STO inward progress atomically
```

## 17. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Tax rule changes between preview and save | Re-evaluate or warn based on lock policy. |
| Charge formula references tax amount before tax execution | Publish blocked due to dependency order. |
| Accounting preview runs before tax output exists | Orchestrator blocks sequence. |
| Document module tries to bypass Tax Engine | Not allowed by integration contract. |
| Post-tax charge configured as tax-affecting | Publish blocked or forced to pre-tax where policy allows. |
| Accounting handoff posts duplicate event | Idempotency prevents duplicate ledger posting. |
| Parent update fails after financial calculations | Transaction rollback; financial snapshots not committed. |
| User saves twice quickly | Single committed transaction. |
| Async post-commit event fails | Retry/dead-letter policy applies; transaction remains committed unless policy says otherwise. |
| Output recalculates using current tax rules instead of saved snapshot | Not allowed. Output must use saved snapshot. |

## 18. Acceptance Criteria

FIN-ACC-001: Financial execution sequence is deterministic and visible in diagnostics.

FIN-ACC-002: Charge, Tax, and Accounting engines do not call each other directly.

FIN-ACC-003: Financial Orchestrator coordinates charge-tax-accounting sequence.

FIN-ACC-004: Transaction Service remains owner of commit.

FIN-ACC-005: Runtime stores charge, tax, total, and accounting snapshots where configured.

FIN-ACC-006: Preview mode does not commit any business data.

FIN-ACC-007: Final-save mode revalidates mandatory financial rules.

FIN-ACC-008: Post-commit mode is idempotent.

FIN-ACC-009: Output uses saved snapshot, not live rules.

FIN-ACC-010: Support user can trace rule versions used for a saved transaction.

## 19. AI Developer Agent Implementation Notes

1. Do not build a monolithic financial mega-engine.
2. Build orchestration around clear service contracts.
3. Do not allow Charge Engine, Tax Engine, or Accounting Rule Engine to directly commit transaction data.
4. Do not let document modules hardcode financial rule sequencing.
5. Always generate trace correlation ID.
6. Respect preview/final/post-commit mode differences.
7. Keep runtime deterministic.
8. Use saved snapshots for output and audit.
9. Treat Transaction Service as commit truth.
10. Treat Accounting Posting Service as ledger posting truth.

