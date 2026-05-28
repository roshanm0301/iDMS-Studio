# iDMS PRD Pack - Phase 2: Financial Rule Engines

## Package Purpose

This package contains Phase 2 Product Requirement Documents for the native iDMS financial rule capabilities:

1. Charge and Discount Rule Engine
2. Tax Rule Engine
3. Accounting Rule Engine
4. Financial Rule Execution Orchestration

These documents are designed for handoff to an AI Developer Agent and engineering teams. They assume Phase 0 and Phase 1 foundation documents already exist:

- Product context and glossary
- Architecture boundaries
- Requirement traceability matrix
- Rule Platform Foundation
- Expression and Condition Engine
- Validation Engine
- Calculation Engine

## Native iDMS Build Assumption

The requirements in this package assume iDMS will build these capabilities natively. They do not assume purchase or runtime dependency on a third-party rule, tax, accounting, workflow, BPMN, or DMN platform.

External standards such as BPMN and DMN may be used as conceptual references only. Runtime execution remains native iDMS.

## Files Included

| File | Purpose |
|---|---|
| `05_Charge_Discount_Rules_PRD.md` | Requirements for charge, discount, surcharge, fee, deduction, apportionment, deviation, and charge simulation capabilities. |
| `06_Tax_Rules_PRD.md` | Requirements for tax rule configuration, tax groups, rates, place of supply, HSN/SAC, GST/VAT/TDS/TCS extensibility, tax calculation, and tax simulation. |
| `07_Accounting_Rules_PRD.md` | Requirements for posting rules, debit/credit line resolution, GL mapping, sub-ledger handling, bank account dependency, posting preview, and accounting handoff. |
| `07A_Financial_Rule_Execution_Orchestration_PRD.md` | Requirements for deterministic execution order across charges, tax, totals, approval decisions, accounting preview, validation, audit, and transaction commit integration. |

## How to Use This Package

1. Read `07A_Financial_Rule_Execution_Orchestration_PRD.md` before implementing any domain engine integration.
2. Implement charge, tax, and accounting engines against the shared Rule Platform, Expression Engine, Validation Engine, and Calculation Engine.
3. Do not let any domain engine directly commit transaction, inventory, or ledger records unless explicitly called by the owning transaction/accounting service.
4. Treat requirement IDs as the source for engineering stories and QA test cases.
5. Treat all `must not` statements as non-negotiable unless the product owner explicitly changes the requirement.

## Key Design Principle

Many capability engines may exist underneath, but the business user should experience one coherent Admin Studio.

