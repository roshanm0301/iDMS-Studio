# 04 - Calculation Engine PRD

## 1. Feature Overview

The Calculation Engine derives deterministic values used by iDMS transactions. It calculates quantities, amounts, totals, taxable bases, round-off values, progress quantities, and other derived fields.

It provides reusable calculation orchestration but does not own tax law, charge applicability, GL account resolution, workflow tasks, or transaction commit.

## 2. Business Objective

Ensure derived values are calculated consistently, traceably, and in the correct sequence across all iDMS documents, avoiding duplicate formulas scattered across transaction modules.

## 3. Scope

### 3.1 In Scope

- Calculation definition registry.
- Formula-based calculations.
- Dependency graph.
- Calculation sequencing.
- Quantity calculations.
- Amount calculations.
- Precision and rounding.
- Recalculation triggers.
- Line-level and header-level calculations.
- Aggregation from lines to header.
- Calculation snapshots for saved documents.
- Simulation support.
- Trace output.

### 3.2 Out of Scope

- Tax component decisioning.
- Charge applicability decisioning.
- Accounting GL mapping.
- Workflow orchestration.
- Transaction commit.
- Direct inventory movement.
- Direct parent progress update.

## 4. Personas

| Persona | Goal |
|---|---|
| Entity Studio Admin | Configure derived fields and calculation order. |
| Finance Admin | Configure financial precision and rounding behavior. |
| Tax Admin | Use taxable base outputs as tax inputs. |
| Commercial Admin | Use charge/discount outputs as calculation inputs. |
| QA | Verify formulas and boundary values. |
| Support Engineer | Diagnose calculation mismatch. |
| AI Developer Agent | Implement deterministic calculation runtime. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Calculation Definition | Metadata describing a derived value. |
| Input Field | Source value required for calculation. |
| Output Field | Derived value produced by calculation. |
| Dependency Graph | Relationship between calculations and inputs. |
| Calculation Sequence | Ordered execution plan. |
| Precision | Number of decimal places allowed. |
| Rounding Mode | Rule for converting high-precision value to stored/displayed value. |
| Snapshot | Saved calculated value and version used at commit. |

## 6. Calculation Types

CALC-TYPE-001: The system shall support field formula calculation.

CALC-TYPE-002: The system shall support line-level calculation.

CALC-TYPE-003: The system shall support header-level calculation.

CALC-TYPE-004: The system shall support aggregation calculation.

CALC-TYPE-005: The system shall support quantity progress calculation.

CALC-TYPE-006: The system shall support amount calculation.

CALC-TYPE-007: The system shall support taxable base calculation.

CALC-TYPE-008: The system shall support round-off calculation.

CALC-TYPE-009: The system shall support status/progress indicator calculation where it is purely derived.

CALC-TYPE-010: The system shall support calculation from prior engine outputs if execution sequence allows it.

## 7. Calculation Definition Requirements

CALC-DEF-001: Each calculation definition shall have a unique ID.

CALC-DEF-002: Each calculation definition shall specify entity and document type applicability.

CALC-DEF-003: Each calculation definition shall specify execution point.

CALC-DEF-004: Each calculation definition shall specify input fields.

CALC-DEF-005: Each calculation definition shall specify output field.

CALC-DEF-006: Each calculation definition shall specify formula or calculation method.

CALC-DEF-007: Each calculation definition shall specify precision and rounding policy where output is numeric.

CALC-DEF-008: Each calculation definition shall specify whether output is editable, read-only, or system-controlled.

CALC-DEF-009: Each calculation definition shall be versioned through Rule Platform Foundation.

CALC-DEF-010: Calculation definitions shall be validated before publish.

## 8. Dependency and Sequencing Requirements

CALC-SEQ-001: The engine shall build a dependency graph for calculations.

CALC-SEQ-002: The engine shall detect circular dependencies.

CALC-SEQ-003: Circular dependencies shall block publish.

CALC-SEQ-004: The engine shall execute calculations in dependency order.

CALC-SEQ-005: The engine shall allow configured sequence groups where business order matters.

CALC-SEQ-006: The default commercial calculation sequence shall support: base amount, discount, pre-tax charges, taxable amount, tax outputs, post-tax charges, total, round-off, net amount.

CALC-SEQ-007: The engine shall allow domain engines such as Charge and Tax to plug into the calculation sequence.

CALC-SEQ-008: The engine shall not silently reorder calculations in a way that changes business meaning without trace.

CALC-SEQ-009: The engine shall provide diagnostic output showing calculation order.

## 9. Quantity Calculation Requirements

QTY-CALC-001: The engine shall support pending quantity calculations.

QTY-CALC-002: The engine shall support already processed quantity calculations.

QTY-CALC-003: The engine shall support current transaction quantity calculations.

QTY-CALC-004: The engine shall support line-level source quantity calculations.

QTY-CALC-005: The engine shall support cumulative quantity calculations across saved child documents.

QTY-CALC-006: The engine shall calculate pending quantity from committed records only unless configured otherwise.

QTY-CALC-007: Failed, rolled-back, or unsaved transactions shall not contribute to processed quantity.

QTY-CALC-008: Cancelled or retired records shall be included or excluded according to document-specific rules.

### 9.1 Standard Quantity Formulas

| Use Case | Formula |
|---|---|
| Sale Invoice from Order | Pending Invoice Qty = Source Order Qty - Already Invoiced Qty |
| Delivery | Pending Delivery Qty = Invoice Qty - Already Delivered Qty |
| Sale Return Requisition | Pending Request Qty = Invoice Qty - Already Returned Qty - Already Requested Qty |
| Sale Return | Pending Return Qty = Source Returnable Qty - Already Returned Qty |
| Purchase Receipt | Pending Receipt Qty = Ordered Qty - Already Received Qty |
| Purchase Invoice | Pending Invoice Qty = Source Qty - Already Invoiced Qty |
| Purchase Return | Pending Return Qty = Source Returnable Qty - Already Returned Qty |
| Stock Transfer Inward | Pending Inward Qty = Outward Qty - Already Inwarded Qty |
| Stock Adjustment Requisition | Remaining request usage depends on one-time consumption rule |

## 10. Amount Calculation Requirements

AMT-CALC-001: The engine shall support base amount calculation.

AMT-CALC-002: The engine shall support discount amount calculation.

AMT-CALC-003: The engine shall support charge amount calculation inputs from Charge Engine.

AMT-CALC-004: The engine shall support taxable amount calculation.

AMT-CALC-005: The engine shall support tax amount inputs from Tax Engine.

AMT-CALC-006: The engine shall support gross total calculation.

AMT-CALC-007: The engine shall support round-off calculation.

AMT-CALC-008: The engine shall support net amount calculation.

AMT-CALC-009: The engine shall support line-to-header aggregation.

AMT-CALC-010: The engine shall support header-to-line apportionment where domain engine provides allocation logic.

### 10.1 Standard Amount Flow

```text
Line Quantity x Rate = Base Amount
Base Amount - Discount = Discounted Base
Discounted Base + Pre-Tax Charges = Taxable Amount
Taxable Amount + Tax Amount + Post-Tax Charges = Gross Amount
Gross Amount +/- Round-Off = Net Amount
```

## 11. Precision and Rounding Requirements

CALC-PRC-001: The engine shall support configurable quantity precision.

CALC-PRC-002: The engine shall support configurable amount precision.

CALC-PRC-003: The engine shall support configurable tax precision.

CALC-PRC-004: The engine shall support configurable charge precision.

CALC-PRC-005: The engine shall support rounding modes: round half up, round down, round up, and no rounding where supported.

CALC-PRC-006: Default quantity precision shall be configurable by Product/UOM or document policy.

CALC-PRC-007: Default amount precision shall be 2 decimals unless configuration overrides it.

CALC-PRC-008: The engine shall store raw value and rounded value where required for audit.

CALC-PRC-009: The engine shall use consistent precision between UI, API, simulation, and runtime.

## 12. Recalculation Requirements

CALC-RECALC-001: The engine shall identify which calculations are affected when an input field changes.

CALC-RECALC-002: The engine shall recalculate dependent values when required inputs change.

CALC-RECALC-003: The engine shall not recalculate saved final documents unless a separate correction/reversal design allows it.

CALC-RECALC-004: The engine shall support recalculation in draft/working form before save.

CALC-RECALC-005: The engine shall support explicit recalculation action where configured.

CALC-RECALC-006: The engine shall show errors when required inputs are missing.

CALC-RECALC-007: The engine shall prevent save when required calculations cannot be completed.

## 13. Snapshot Requirements

CALC-SNAP-001: The system shall store calculated values on committed transaction records where required.

CALC-SNAP-002: The system shall store calculation version references used at commit.

CALC-SNAP-003: The system shall store enough trace to explain calculated totals.

CALC-SNAP-004: Output/print shall use saved calculation snapshot, not recalculate from current rule versions.

CALC-SNAP-005: Historical reports shall use committed values unless report explicitly requests recalculation scenario.

## 14. Admin UI Requirements

CALC-UI-001: Admin Studio shall provide calculation rule list and detail screens.

CALC-UI-002: Calculation detail shall show input fields, formula, output field, precision, rounding, execution point, and dependencies.

CALC-UI-003: Formula configuration shall use the shared Formula Builder.

CALC-UI-004: Admin Studio shall show dependency graph or ordered calculation sequence.

CALC-UI-005: Admin Studio may support drag-and-drop for calculation sequence where sequence is configurable.

CALC-UI-006: Drag-and-drop sequence changes shall update executable sequence metadata only after explicit save.

CALC-UI-007: Admin Studio shall prevent publishing invalid dependency graphs.

## 15. API Requirements

CALC-API-001: The system shall expose internal API to calculate derived values for a payload.

CALC-API-002: Calculation API shall accept entity, document type, execution point, payload, actor context, and optional previous engine outputs.

CALC-API-003: Calculation API shall return calculated fields, errors, warnings, calculation order, and trace references.

CALC-API-004: Calculation API shall support line-level and header-level calculation.

CALC-API-005: Calculation API shall support simulation mode.

CALC-API-006: Calculation API shall not commit transaction data.

## 16. Error Handling

| Error | Expected Behavior |
|---|---|
| Missing required input | Return calculation error and block save if required. |
| Invalid formula | Block publish. |
| Circular dependency | Block publish. |
| Division by zero | Return structured error. |
| Precision config missing | Use approved default and log warning where allowed. |
| Derived value exceeds allowed range | Return validation/calculation error. |
| Calculation timeout | Fail safely with structured error. |

## 17. Audit Requirements

CALC-AUD-001: Runtime calculation trace shall include calculation version IDs.

CALC-AUD-002: Calculation trace shall include inputs, outputs, formula references, and errors where applicable.

CALC-AUD-003: Saved transaction shall reference calculation snapshot where required.

CALC-AUD-004: Changes to calculation definitions shall be configuration-audited.

## 18. Examples

### 18.1 Sale Invoice Calculation

Inputs:

- Quantity = 10
- Rate = 1000
- Discount = 5 percent
- Pre-tax freight = 500
- GST = calculated by Tax Engine

Expected calculation:

```text
Base Amount = 10 x 1000 = 10000
Discount Amount = 10000 x 5 percent = 500
Discounted Base = 9500
Taxable Amount = 9500 + 500 = 10000
Tax Amount = Tax Engine output
Net Amount = Taxable Amount + Tax Amount + Post-Tax Charges +/- Round-Off
```

### 18.2 Delivery Pending Quantity

Inputs:

- Invoice Quantity = 10
- Already Delivered Quantity = 6

Expected:

```text
Pending Delivery Quantity = 10 - 6 = 4
```

Validation then blocks Delivery Quantity > 4.

### 18.3 Purchase Return Pending Quantity

Inputs:

- Source Returnable Quantity = 100
- Already Returned Quantity = 30

Expected:

```text
Pending Return Quantity = 100 - 30 = 70
```

## 19. Acceptance Criteria

AC-CALC-001: Given a calculation has valid inputs, when executed, then output shall match formula and precision policy.

AC-CALC-002: Given calculation A depends on calculation B, when executed, then B shall run before A.

AC-CALC-003: Given a circular dependency exists, when publishing calculation, then publish shall be blocked.

AC-CALC-004: Given a saved final document is printed, when current rule version changed after save, then print shall use saved calculated values.

AC-CALC-005: Given pending quantity changed due to another transaction, when final save-time calculation runs, then latest committed values shall be used.

## 20. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Formula references missing field | Block publish. |
| Calculation has circular dependency | Block publish. |
| Required input is null | Block calculation/save unless configured default exists. |
| Quantity precision exceeds UOM precision | Return error. |
| Taxable amount becomes negative where not allowed | Block save. |
| Return amount becomes negative after deductions | Block save. |

## 21. Edge Cases

| Edge Case | Handling |
|---|---|
| Zero quantity line visible for trace | Exclude from totals where configured. |
| Multiple child documents consume same source | Use committed saved records only and save-time recheck. |
| Rounding difference across lines/header | Apply configured rounding policy and store round-off. |
| Foreign currency values | Defer conversion to currency service; calculation engine uses supplied exchange-rate context where provided. |
| Product UOM precision changes after saved transaction | Historical transaction retains saved precision snapshot. |

## 22. Dependencies

- Rule Platform Foundation.
- Expression and Condition Engine.
- Validation Engine.
- Charge Engine future integration.
- Tax Engine future integration.
- Entity metadata service.
- Transaction Service for committed quantity lookup.
- Audit service.

## 23. Open Questions

CALC-OQ-001: Should calculation sequence designer be part of MVP or restricted to predefined templates?

CALC-OQ-002: Should raw high-precision values always be stored or only for financial/tax calculations?

CALC-OQ-003: Should calculation engine own currency conversion or rely on a separate currency service?

CALC-OQ-004: Should line-level recalculation be lazy or immediate in high-volume grids?

## 24. AI Developer Agent Notes

AIDEV-CALC-001: Do not implement tax group selection in Calculation Engine.

AIDEV-CALC-002: Do not implement GL account selection in Calculation Engine.

AIDEV-CALC-003: Do not commit transactions from Calculation Engine.

AIDEV-CALC-004: Build dependency detection and circular reference blocking.

AIDEV-CALC-005: Ensure UI, API, simulation, and runtime use same calculation logic.
