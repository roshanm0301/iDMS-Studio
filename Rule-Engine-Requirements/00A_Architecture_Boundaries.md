# 00A - Architecture Boundaries

## 1. Document Purpose

This document defines responsibility boundaries for the native iDMS Rule and Workflow Platform.

The most important product risk is not missing a screen. The risk is implementing business logic in the wrong place. This document prevents that.

## 2. Architecture Summary

The platform shall use separated backend capabilities and a unified Admin Studio experience.

```text
Admin Studio
   |
   |-- Document Configuration
   |-- Commercial Rules
   |-- Tax Configuration
   |-- Accounting Configuration
   |-- Workflow and Approval
   |-- Simulation Workbench
   |-- Governance
   |-- Audit and Diagnostics

Runtime Orchestrator
   |
   |-- Rule Platform Foundation
   |-- Expression and Condition Engine
   |-- Validation Engine
   |-- Calculation Engine
   |-- Charge Rule Engine
   |-- Tax Rule Engine
   |-- Accounting Rule Engine
   |-- Approval Engine
   |-- Workflow Engine
   |-- Transaction Service
   |-- Audit and Trace Service
```

## 3. Responsibility Matrix

| Capability | Owns | Must Not Own |
|---|---|---|
| Rule Platform Foundation | Rule metadata, scoping, lifecycle, versions, publish, retire, rollback. | Domain-specific tax, charge, accounting, or workflow business logic. |
| Expression and Condition Engine | Safe condition evaluation, formula parsing, field binding, operators, functions. | Transaction commit, parent updates, inventory updates. |
| Validation Engine | Mandatory checks, source checks, quantity checks, status checks, stale-data checks, save blocking. | Long-running workflows, approval task routing, ledger posting. |
| Calculation Engine | Derived quantities, amounts, totals, round-off, dependency sequencing. | Tax regime interpretation or accounting posting account resolution. |
| Charge Rule Engine | Charge/discount applicability, amount method, pre/post tax behavior, deviation controls. | Tax law, GL posting, transaction commit. |
| Tax Rule Engine | Tax applicability, tax group, rate resolution, component calculation, tax trace. | Invoice lifecycle, payment, accounting posting. |
| Accounting Rule Engine | Posting intent, debit/credit mapping, GL account resolution, sub-ledger output. | Direct ledger mutation unless called by an approved accounting posting service. |
| Approval Engine | Approval policy, approver resolution, maker-checker rules, approval decisions. | Core transaction save, tax calculation, inventory movement. |
| Workflow Engine | Process orchestration, tasks, timers, escalations, service tasks, workflow instances. | Tax, charge, accounting calculation, direct transaction mutation outside service contracts. |
| Transaction Service | Atomic save, document number persistence, parent progress update, inventory commit, final status. | Rule authoring and workflow modeling. |
| Audit and Trace Service | Immutable execution evidence, before/after values, version used, actor, payload references. | Business decision authoring. |
| Simulation Workbench | Side-effect-free test execution of rules and workflows. | Production transaction commit. |

## 4. Runtime Execution Boundary

ARCH-BND-001: The system shall evaluate rules through a runtime orchestrator that invokes validation, calculation, charge, tax, accounting, approval, and workflow capabilities in a deterministic order.

ARCH-BND-002: The runtime orchestrator shall not persist business transaction state directly unless it is part of the transaction service.

ARCH-BND-003: A rule evaluation result may be used by the transaction service, but the rule engine itself must not directly commit parent quantity, inventory, ledger, or document status changes.

ARCH-BND-004: Workflow service tasks must call approved service contracts when they need to trigger transaction actions.

ARCH-BND-005: Workflow tasks must not directly update transaction tables.

## 5. Standard Transaction Save Flow

The default save-time flow shall be:

```text
1. Authentication and authorization check.
2. Document configuration and dependency check.
3. Source eligibility and source freshness check.
4. Field-level validation.
5. Quantity, status, and lifecycle validation.
6. Derived calculation execution.
7. Charge rule execution, where applicable.
8. Tax rule execution, where applicable.
9. Total and rounding calculation.
10. Approval requirement decision, where applicable.
11. Accounting posting preview or handoff output, where applicable.
12. Final save-time revalidation.
13. Transaction service atomic commit.
14. Audit trace persistence.
15. Post-commit event and workflow start, where applicable.
```

ARCH-BND-006: Expensive financial calculations should not run until fatal source, permission, and quantity validations have passed.

ARCH-BND-007: Final save-time revalidation shall recheck source status, pending quantity, and stale data immediately before commit.

ARCH-BND-008: If final revalidation fails, the transaction shall not commit.

## 6. Workflow Boundary

ARCH-WF-001: Workflow shall own long-running process orchestration.

ARCH-WF-002: Workflow shall support future features such as human tasks, approval tasks, service tasks, timers, escalations, retries, send-back, rejection, and completion events.

ARCH-WF-003: Workflow shall call decision services or rule services for decisions; workflow definitions must not embed complex tax, charge, accounting, or quantity formulas.

ARCH-WF-004: Active workflow instances shall continue on the workflow definition version with which they started unless an explicit migration policy is implemented.

ARCH-WF-005: Workflow start after transaction save shall happen post-commit unless the product explicitly defines a pre-save approval flow.

ARCH-WF-006: A workflow instance shall store transaction reference, workflow definition version, actor, state, task list, SLA data, and trace references.

## 7. Approval Boundary

ARCH-APR-001: Approval Engine shall define who approves, in what order, under what conditions, with what SLA and escalation.

ARCH-APR-002: Approval Engine shall not calculate tax, charges, or accounting postings.

ARCH-APR-003: Approval requirement decisions may use transaction values generated by validation, calculation, charge, and tax engines.

ARCH-APR-004: Approval outcomes may unlock, reject, approve, or send back a transaction according to configured policy and transaction service rules.

## 8. Accounting Boundary

ARCH-ACC-001: Accounting Rules shall produce posting intent, posting preview, or posting handoff output.

ARCH-ACC-002: Accounting Rules must not directly post ledgers unless an approved accounting posting service explicitly owns the commit.

ARCH-ACC-003: Posting output shall include debit/credit role, GL account, amount basis, sub-ledger references, and trace data.

ARCH-ACC-004: Debit and credit balancing shall be validated before accounting handoff is considered complete.

## 9. Tax Boundary

ARCH-TAX-001: Tax Engine shall determine tax applicability, tax group, tax components, rates, formulas, and tax trace.

ARCH-TAX-002: Tax Engine shall not own invoice save, invoice lifecycle, payment, or ledger posting.

ARCH-TAX-003: Tax rules shall support date-effective rate resolution.

ARCH-TAX-004: Tax logic shall be system-derived where required and manual override shall be disallowed unless separately approved.

## 10. Charge Boundary

ARCH-CHG-001: Charge Engine shall determine charge or discount applicability and amount.

ARCH-CHG-002: Charge Engine shall respect pre-tax and post-tax sequencing.

ARCH-CHG-003: Charge Engine shall expose charge outputs to Tax Engine when charges affect taxable base.

ARCH-CHG-004: Charge Engine shall not own tax component resolution or GL posting.

## 11. Validation Boundary

ARCH-VAL-001: Validation Engine shall be the authoritative backend enforcement point for save-blocking business rules.

ARCH-VAL-002: UI validations may improve user experience but shall not be treated as authoritative.

ARCH-VAL-003: Validation Engine shall run for UI, API, import, background job, and workflow-triggered actions.

ARCH-VAL-004: Validation Engine shall support blocking, warning, and informational outcomes.

## 12. Calculation Boundary

ARCH-CALC-001: Calculation Engine shall derive deterministic values such as pending quantity, already processed quantity, taxable amount, line total, document total, and round-off.

ARCH-CALC-002: Calculation Engine shall record dependencies so recalculation can occur when inputs change.

ARCH-CALC-003: Calculation Engine shall not decide tax regime or GL account.

## 13. Transaction Service Boundary

ARCH-TXN-001: Transaction Service shall own document number persistence, document header/line save, parent progress update, inventory update, and final committed status.

ARCH-TXN-002: Transaction Service shall enforce idempotency.

ARCH-TXN-003: Transaction Service shall ensure atomicity: either all required save effects commit or none commit.

ARCH-TXN-004: Rule engines and workflow engines shall not bypass transaction service for business data mutation.

## 14. Audit Boundary

ARCH-AUD-001: Audit and Trace Service shall store configuration changes and runtime execution traces.

ARCH-AUD-002: Runtime trace shall include at minimum: transaction reference, engine invoked, version used, input reference, output, actor, timestamp, result, and failure reason.

ARCH-AUD-003: Published configuration history shall never be physically deleted through normal admin actions.

## 15. Drag-and-Drop Boundary

ARCH-UX-001: Drag-and-drop builders shall be provided where visual configuration is materially better than form/grid configuration.

ARCH-UX-002: Drag-and-drop builders shall save structured executable metadata separately from layout metadata.

ARCH-UX-003: Drag-and-drop workflows and rule trees shall be validated before publish.

ARCH-UX-004: Invalid connections, invalid branches, orphan nodes, cycles where not allowed, and missing terminal paths shall block publish.

## 16. Examples

### 16.1 Sale Invoice Save

- Validation Engine checks creation mode, source eligibility, product/UOM, mandatory payment reference, quantity cap, stale source.
- Calculation Engine derives line base amount, discount amount, taxable amount, tax base, round-off, invoice total.
- Charge Engine applies configured freight or discount rules.
- Tax Engine determines GST group and components.
- Accounting Rule Engine generates posting preview.
- Transaction Service commits invoice and parent progress.
- Workflow Engine starts approval or post-commit workflow only if configured.

### 16.2 Delivery Save

- Validation Engine checks Sale Invoice source, pending delivery quantity, serial/batch requirements.
- Calculation Engine derives pending delivery quantity.
- Transaction Service commits delivery, inventory movement where enabled, invoice delivery progress, audit.
- Tax, charge, and accounting engines do not run unless a future requirement explicitly adds a reference-only output.

### 16.3 Approval Flow

- Approval Engine decides whether approval is needed and who must approve.
- Workflow Engine creates tasks, timers, and escalation paths.
- Approval steps may call rule decisions but must not calculate tax or update inventory directly.

## 17. Prohibited Implementation Patterns

ARCH-ANTI-001: Do not implement one generic mega engine that directly handles validation, workflow, tax, charges, accounting, and transaction commit.

ARCH-ANTI-002: Do not place long-running approval workflows inside validation rules.

ARCH-ANTI-003: Do not place tax formulas inside workflow diagrams.

ARCH-ANTI-004: Do not place parent progress update logic inside decision rules.

ARCH-ANTI-005: Do not permit UI-only enforcement of save-critical rules.

ARCH-ANTI-006: Do not let business users write arbitrary code.

ARCH-ANTI-007: Do not silently resolve rule conflicts without trace.

ARCH-ANTI-008: Do not edit published versions in place.
