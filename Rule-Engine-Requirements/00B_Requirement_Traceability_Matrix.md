# 00B - Requirement Traceability Matrix

## 1. Document Purpose

This matrix maps source material and feature needs to PRD files. It is used to ensure coverage and reduce missed requirements.

This file shall be maintained as the PRD pack expands.

## 2. Source-to-PRD Coverage Matrix

| Source / Domain | Core Topics | PRD Coverage |
|---|---|---|
| Sale Invoice specification | Source modes, commercial boundary, tax, charges, parent update, accounting handoff, post-save protection, atomicity. | 00, 00A, 01, 02, 03, 04, future Sales Document Pack, future Charge/Tax/Accounting PRDs. |
| Sale Order specification | Demand capture, lifecycle, calculation, downstream-derived statuses, processed-scope protection. | 00, 00A, 03, 04, future Sales Document Pack. |
| Sale Allocation Requisition specification | Request lifecycle, no inventory commit, source traceability, quantity rules, downstream readiness. | 03, 04, future Sales Document Pack. |
| Sale Allocation specification | Inventory allocation execution, source validation, parent update, atomic save, post-save read-only. | 03, 04, future Sales Document Pack, future Inventory/Execution Pack. |
| Sale Return Requisition specification | Return request, quantity control, no inventory/accounting impact, status rules. | 03, 04, future Sales Document Pack. |
| Sale Return specification | Return execution, source traceability, inventory impact, no direct credit note/accounting, atomic save. | 03, 04, future Sales Document Pack. |
| Delivery specification | Fulfilment execution, source invoice, pending delivery quantity, optional inventory movement, no commercial mutation. | 03, 04, future Sales Document Pack. |
| Purchase Requisition specification | Internal demand, no supplier commitment, quantity lifecycle, optional budget check. | 03, 04, future Procurement Document Pack. |
| Purchase Order specification | Supplier commitment, commercial/tax-ready values, source PR conversion, receipt/invoice readiness. | 03, 04, future Procurement Document Pack, future Charge/Tax PRDs. |
| Purchase Receipt specification | Goods receipt, source PO, same-supplier multi-source, received quantity, damage/shortage/excess, source progress. | 03, 04, future Procurement Document Pack. |
| Inspection specification | Inspection status, product availability, next transaction eligibility, child tab behavior. | 03, 04, future Procurement Document Pack, future Workflow Pack. |
| Purchase Invoice specification | Source precedence, tax, charges, inventory double-post prevention, accounting readiness, atomic save. | 03, 04, future Procurement Document Pack, future Charge/Tax/Accounting PRDs. |
| Purchase Return Requisition specification | Return request, pending quantity, no direct inventory, downstream return readiness. | 03, 04, future Procurement Document Pack. |
| Purchase Return specification | Return execution, quantity validation, inventory impact, no direct accounting/credit note. | 03, 04, future Procurement Document Pack. |
| Stock Adjustment Requisition specification | Request before stock adjustment, date-driven statuses, one-time consumption. | 03, 04, future Inventory Document Pack. |
| Stock Adjustment specification | Final stock adjustment, closed state, inventory impact, no edit/cancel/reopen. | 03, 04, future Inventory Document Pack. |
| Stock Transfer Core specification | Source-to-destination stock movement, requisition-linked execution, inventory impact, progress callback. | 03, 04, future Inventory/Transfer Pack. |
| Stock Transfer Outward specification | Final outward execution, inherited Sale Invoice tax/amount behavior, supplier inventory update, STI readiness. | 03, 04, future Transfer Pack, future Tax PRD. |
| Stock Transfer Inward specification | Final inward execution, inherited Purchase Invoice behavior, receiving inventory update, source STO progress update. | 03, 04, future Transfer Pack, future Tax PRD. |
| Accounting Rules FRD | GL mapping, posting lines, debit/credit, BU scoping, sub-ledger, simulation. | 00A, future Accounting Rules PRD, future Simulation PRD. |
| Tax Rules FRD | Conditional tree, rate resolver, formula engine, tax group, multi-regime, simulation. | 00A, 02, 04, future Tax Rules PRD, future Simulation PRD. |
| Charge Rules FRD | Applicability, calculation method, conflict strategy, deviation, pre/post tax, simulator. | 00A, 02, 04, future Charge Rules PRD, future Simulation PRD. |
| Approval Studio FRD | Workflow orchestration, approval policies, SLA, escalation, maker-checker, audit. | 00, 00A, future Workflow Engine PRD, future Approval Engine PRD. |
| Deep research output | Native build, BPMN/DMN boundaries, rule governance, engine separation, workflow inclusion. | 00, 00A, 01 to 04, future PRDs. |

## 3. Feature-to-PRD Matrix

| Feature Area | Phase | PRD File | Requirement Prefix |
|---|---:|---|---|
| Product context and glossary | 0 | 00_Product_Context_and_Glossary.md | PRD-CONTEXT, AI-DEV-CONTEXT |
| Architecture boundaries | 0 | 00A_Architecture_Boundaries.md | ARCH |
| Traceability matrix | 0 | 00B_Requirement_Traceability_Matrix.md | TRACE |
| Rule registry | 1 | 01_Rule_Platform_Foundation_PRD.md | RULE-FND |
| Rule lifecycle | 1 | 01_Rule_Platform_Foundation_PRD.md | RULE-LC |
| Rule scoping | 1 | 01_Rule_Platform_Foundation_PRD.md | RULE-SCOPE |
| Publish and rollback | 1 | 01_Rule_Platform_Foundation_PRD.md | RULE-GOV |
| Expression engine | 1 | 02_Expression_Condition_Engine_PRD.md | EXP |
| Condition builder | 1 | 02_Expression_Condition_Engine_PRD.md | COND |
| Formula builder | 1 | 02_Expression_Condition_Engine_PRD.md | FORM |
| Validation engine | 1 | 03_Validation_Engine_PRD.md | VAL |
| Save-time revalidation | 1 | 03_Validation_Engine_PRD.md | VAL-SAVE |
| Calculation engine | 1 | 04_Calculation_Engine_PRD.md | CALC |
| Quantity calculations | 1 | 04_Calculation_Engine_PRD.md | QTY |
| Financial totals calculation | 1 | 04_Calculation_Engine_PRD.md | AMT |
| Charge rules | 2 | Future: 05_Charge_Rules_PRD.md | CHG |
| Tax rules | 2 | Future: 06_Tax_Rules_PRD.md | TAX |
| Accounting rules | 2 | Future: 07_Accounting_Rules_PRD.md | ACC |
| Workflow engine | 3 | Future: 08_Workflow_Engine_PRD.md | WF |
| Approval engine | 3 | Future: 09_Approval_Engine_PRD.md | APR |
| Simulation workbench | 4 | Future: 10_Simulation_Workbench_PRD.md | SIM |
| Audit and trace | 4 | Future: 11_Audit_Traceability_PRD.md | AUD |
| Governance and rollback | 4 | Future: 12_Versioning_Rollback_Governance_PRD.md | GOV |
| Sales document pack | 5 | Future: 13_Document_Packs_Sales_PRD.md | SALES |
| Procurement document pack | 5 | Future: 14_Document_Packs_Procurement_PRD.md | PROC |
| Inventory/transfer document pack | 5 | Future: 15_Document_Packs_Inventory_Transfers_PRD.md | INV, TRF |
| Security/performance/operations | 6 | Future: 16_NFR_Security_Performance_Operations_PRD.md | NFR |
| API/event contracts | 6 | Future: 17_API_Event_Contracts_PRD.md | API, EVT |
| AI Developer implementation guide | 6 | Future: 18_AI_Developer_Implementation_Guide.md | AIDEV |

## 4. Requirement Coverage Checklist

Every PRD shall include the following sections unless explicitly marked not applicable:

| Coverage Item | Required? |
|---|---:|
| Feature overview | Yes |
| Business objective | Yes |
| In scope | Yes |
| Out of scope | Yes |
| Personas | Yes |
| Key concepts | Yes |
| Functional requirements | Yes |
| Configuration requirements | Yes |
| Runtime behavior | Yes |
| Data model or metadata requirements | Yes |
| API/event requirements | Where applicable |
| Admin UI behavior | Where applicable |
| Drag-and-drop behavior | Where applicable |
| Error handling | Yes |
| Audit requirements | Yes |
| Security and RBAC | Yes |
| Versioning/lifecycle | Yes |
| Examples | Yes |
| Acceptance criteria | Yes |
| Negative scenarios | Yes |
| Edge cases | Yes |
| Dependencies | Yes |
| Open questions | Yes |
| AI Developer notes | Yes |

## 5. Anti-Vagueness Checklist

The PRD must not use vague phrases unless followed by a clear definition:

| Avoid | Replace With |
|---|---|
| properly | specific expected result |
| as needed | exact trigger or condition |
| etc. | complete list or say non-exhaustive explicitly |
| configurable | who configures, where, allowed values, validation |
| system should handle | expected behavior, error, audit, fallback |
| user-friendly | exact UI behavior or usability rule |
| real-time | target latency or synchronous/asynchronous behavior |
| flexible | specific extensibility mechanism |

## 6. Open Traceability Items for Later Phases

TRACE-OPEN-001: Detailed Charge Rules PRD must map every existing Charge Rules FRD capability to requirement IDs.

TRACE-OPEN-002: Detailed Tax Rules PRD must map every existing Tax Rules FRD capability to requirement IDs.

TRACE-OPEN-003: Detailed Accounting Rules PRD must map every existing Accounting Rules FRD capability to requirement IDs.

TRACE-OPEN-004: Detailed Approval and Workflow PRDs must map Approval Studio features into Workflow Engine and Approval Engine boundaries.

TRACE-OPEN-005: Sales, Procurement, Inventory, and Transfer document packs must classify source document rules into validation, calculation, decision, transaction, workflow, and audit responsibilities.

TRACE-OPEN-006: A future rule register must enumerate Section 18 rule matrices from each transaction document into atomic requirement/test IDs.
