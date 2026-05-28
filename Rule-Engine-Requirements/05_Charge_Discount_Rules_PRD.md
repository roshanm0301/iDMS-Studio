# 05 - Charge and Discount Rules PRD

## 1. Feature Overview

The Charge and Discount Rules capability allows authorized iDMS administrators to configure when financial adjustments apply to transactions and how they are calculated. These adjustments include charges, discounts, surcharges, fees, deductions, freight, insurance, handling charges, scheme discounts, restocking fees, depreciation deductions, and other commercial adjustments.

The capability is native to iDMS and uses the shared Rule Platform, Expression and Condition Engine, Validation Engine, and Calculation Engine. It must support both document-level and line-level adjustments.

The feature must be business-friendly in Admin Studio while remaining deterministic, auditable, testable, and safe for high-volume transactional processing.

## 2. Business Objective

Enable commercial, finance, and configuration teams to define and maintain transaction charges and discounts without code changes while preserving calculation correctness, tax sequencing, auditability, and transaction integrity.

## 3. Scope

### 3.1 In Scope

- Charge rule family and version management.
- Discount rule family and version management.
- Rule applicability conditions.
- Document-level and line-level charges.
- Fixed amount calculation.
- Percentage-based calculation.
- Formula-based calculation.
- Slab/tier-based calculation.
- Quantity-based and value-based apportionment.
- Pre-tax and post-tax classification.
- Charge taxability flag and tax interaction metadata.
- Conflict handling when multiple rules match.
- Priority and sequence controls.
- Rule effective dating.
- Scope by tenant, organization, branch, entity, document type, customer/supplier/product context, and role where required.
- Transaction-time editability and deviation control.
- Simulation before publish.
- Runtime execution trace.
- Admin Studio screens for configuration, testing, publish, and diagnostics.
- API/import parity with UI execution.

### 3.2 Out of Scope

- Tax component/rate calculation. Tax Engine owns this.
- GL account resolution. Accounting Rule Engine owns this.
- Transaction save or parent update. Transaction Service owns this.
- Inventory posting.
- Workflow task routing.
- Settlement, refund, payment receipt, or ledger posting.
- Arbitrary custom code execution.
- AI-generated rule authoring in MVP.

## 4. Personas

| Persona | Goal |
|---|---|
| Commercial Admin | Configure discounts, schemes, freight, insurance, and surcharges. |
| Finance Admin | Configure charge methods, deviation boundaries, and accounting readiness. |
| Tax Admin | Review charge taxability and taxable base impact. |
| Product Manager / BA | Define charge behavior for document types. |
| Implementation Consultant | Configure customer-specific charge policies. |
| Auditor | Review published charge rules and runtime application trace. |
| Support Engineer | Diagnose charge calculation failures. |
| AI Developer Agent | Implement requirements exactly and avoid inventing hidden behavior. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Charge Rule | A configurable rule that determines whether a charge/discount applies and how it is calculated. |
| Charge Master | Master definition of a charge or discount type such as Freight, Insurance, Handling, Scheme Discount, Restocking Fee. |
| Rule Metadata | Method, value, formula, scope, effective period, sequence, conflict strategy, deviation settings. |
| Applicability Condition | Predicate evaluated against transaction payload to decide whether rule applies. |
| Calculation Method | Fixed, percentage, formula, slab/tier. |
| Charge Scope | Header/document level or line level. |
| Pre-tax Charge | Charge/discount applied before tax calculation and included/excluded from taxable base based on taxability. |
| Post-tax Charge | Charge/discount applied after tax calculation. |
| Apportionment | Distribution of document-level charge across lines. |
| Conflict Strategy | Behavior when multiple rules match. |
| Deviation Control | Defines whether user can edit calculated value and within what boundary. |
| Applied Charge Snapshot | Saved transaction-level record of charge outcome used for audit and output. |

## 6. Feature Boundaries

| Area | Charge Rules Own | Charge Rules Must Not Own |
|---|---|---|
| Applicability | Whether a charge/discount applies | Source document eligibility |
| Calculation | Charge/discount amount | Tax rates and tax components |
| Sequence | Charge calculation order within allowed bands | Full transaction commit order |
| Deviation | Whether calculated value can be edited within configured limits | Approval workflow task routing |
| Apportionment | Distribution of header charges to lines | Inventory posting |
| Trace | Matched charge rules and calculation details | Ledger posting |

## 7. Functional Requirements

### 7.1 Charge Master Binding

CHG-MST-001: The system shall allow a charge rule to be linked to exactly one Charge Master record.

CHG-MST-002: The Charge Master shall define charge code, display name, charge category, default taxability, default scope, active status, and allowed document types where configured.

CHG-MST-003: The system shall prevent creation of a charge rule for an inactive Charge Master.

CHG-MST-004: The system shall allow historical transactions to retain inactive charge values as saved snapshots.

CHG-MST-005: The system shall not allow deletion of a Charge Master that is referenced by a published or historical charge rule.

CHG-MST-006: The system shall support charge categories including Charge, Discount, Surcharge, Fee, Deduction, Freight, Insurance, Handling, Restocking, Depreciation, and Other.

CHG-MST-007: The system shall allow tenant-specific charge master values while preserving platform-level standard charge type capability.

### 7.2 Charge Rule Registry

CHG-RUL-001: The system shall create each charge rule as a rule family using the shared Rule Platform Foundation.

CHG-RUL-002: The system shall maintain immutable published charge rule versions.

CHG-RUL-003: Editing a published charge rule shall create a new draft version.

CHG-RUL-004: Each charge rule version shall store Charge Master reference, entity, document type scope, effective date range, status, priority, sequence, calculation method, applicability conditions, and output behavior.

CHG-RUL-005: The system shall support tenant, organization, branch, role, entity, document type, customer/supplier group, product group, and transaction type scoping.

CHG-RUL-006: The system shall prevent multiple published charge rule versions with identical effective range, same scope, same priority, and same Charge Master unless conflict strategy explicitly allows multiple application.

CHG-RUL-007: The system shall allow published charge rule versions to be retired while preserving historical trace.

CHG-RUL-008: The system shall support charge rule cloning across document types only when target entity schemas contain required fields.

CHG-RUL-009: The system shall validate cloned charge rules before allowing publish.

CHG-RUL-010: The system shall store a business-readable display condition for every charge rule version.

### 7.3 Applicability Conditions

CHG-CON-001: The system shall allow admins to define applicability conditions using the shared Condition Builder.

CHG-CON-002: Conditions shall be evaluated against the normalized transaction payload.

CHG-CON-003: Conditions shall support header fields, line fields, customer/supplier attributes, product attributes, branch attributes, date attributes, amount attributes, quantity attributes, and configured contextual facts.

CHG-CON-004: The system shall support nested AND/OR condition groups.

CHG-CON-005: The system shall validate field/operator compatibility before publish.

CHG-CON-006: The system shall block publish if any condition references a deleted, inactive, inaccessible, or incompatible field.

CHG-CON-007: The system shall allow line-level applicability to be evaluated per line.

CHG-CON-008: The system shall allow header-level applicability to be evaluated once per document.

CHG-CON-009: The system shall log matched and non-matched charge rules in simulation.

CHG-CON-010: The system shall log matched charge rules in runtime trace.

### 7.4 Calculation Methods

CHG-CAL-001: The system shall support Fixed Amount calculation.

CHG-CAL-002: The system shall support Percentage calculation.

CHG-CAL-003: The system shall support Formula calculation using the shared Expression Engine.

CHG-CAL-004: The system shall support Slab/Tier calculation.

CHG-CAL-005: The calculation method shall be mandatory for every charge rule version.

CHG-CAL-006: Fixed Amount calculation shall require a configured numeric amount.

CHG-CAL-007: Percentage calculation shall require configured percentage and base amount selector.

CHG-CAL-008: Formula calculation shall require a valid formula expression and output type.

CHG-CAL-009: Slab/Tier calculation shall require non-overlapping tiers unless the rule explicitly uses cumulative tier mode.

CHG-CAL-010: The system shall block publish when slab ranges overlap in an invalid way.

CHG-CAL-011: The system shall block publish when slab ranges leave gaps and the missing range is not configured as allowed.

CHG-CAL-012: The system shall support formula references to transaction fields, calculated values, charge codes, tax components where allowed, and safe built-in functions.

CHG-CAL-013: The system shall not allow formulas to call external APIs, execute scripts, mutate data, or access unauthorized fields.

CHG-CAL-014: The system shall calculate charge amount using configured precision and rounding policy.

CHG-CAL-015: The system shall store raw calculated amount and rounded applied amount where precision policy requires both.

### 7.5 Charge Scope

CHG-SCP-001: The system shall support header/document-level charges.

CHG-SCP-002: The system shall support line-level charges.

CHG-SCP-003: A line-level charge shall apply only to lines matching the rule condition.

CHG-SCP-004: A header-level charge shall apply at document level and may be apportioned to lines where required.

CHG-SCP-005: The system shall prevent a charge rule from being both header-level and line-level in the same version unless explicitly modeled as separate output components.

CHG-SCP-006: The system shall store applied charge scope in the transaction charge snapshot.

### 7.6 Pre-Tax and Post-Tax Behavior

CHG-TAX-001: Each charge rule shall be classified as Pre-Tax, Post-Tax, or Non-Tax-Impacting Reference.

CHG-TAX-002: Pre-Tax charges shall be executed before tax calculation.

CHG-TAX-003: Post-Tax charges shall be executed after tax calculation.

CHG-TAX-004: Non-Tax-Impacting Reference charges shall be stored but shall not alter taxable base or invoice total unless explicitly configured.

CHG-TAX-005: Each charge rule shall store charge taxability metadata.

CHG-TAX-006: Charge taxability metadata shall be passed to the Tax Engine when the charge affects taxable base.

CHG-TAX-007: The system shall block publish when a charge is configured as tax-affecting but lacks taxability configuration.

CHG-TAX-008: The system shall support taxable and non-taxable charges.

CHG-TAX-009: The system shall support positive charges and negative adjustments/discounts.

CHG-TAX-010: The system shall prevent negative taxable amount unless the document type explicitly allows credit/return behavior.

### 7.7 Apportionment

CHG-APP-001: The system shall support apportionment of header-level charges to transaction lines.

CHG-APP-002: Supported apportionment methods shall include By Line Value, By Quantity, Equal Split, Manual Allocation, and Formula-Based Allocation.

CHG-APP-003: Manual Allocation shall be available only when user edit permission is configured.

CHG-APP-004: The system shall ensure total apportioned amount equals the header charge amount after rounding adjustment.

CHG-APP-005: The system shall assign rounding difference to a configured line selection strategy, such as highest value line, last eligible line, or system distribution.

CHG-APP-006: The system shall not apportion a charge to inactive or zero-quantity lines unless configured.

CHG-APP-007: The system shall store apportionment details in the applied charge snapshot.

### 7.8 Conflict Strategy

CHG-CNF-001: The system shall support conflict strategies when multiple rules match the same Charge Master and scope.

CHG-CNF-002: Supported conflict strategies shall include First Match, Apply All, Highest Priority, Lowest Amount, Highest Amount, Manual Selection, and Block as Conflict.

CHG-CNF-003: Conflict strategy shall be mandatory when multiple published matching rules are allowed.

CHG-CNF-004: The system shall block publish if multiple rules can match and no deterministic conflict strategy exists.

CHG-CNF-005: Runtime shall never silently choose a rule when conflict strategy is missing.

CHG-CNF-006: Simulation shall show all matched rules and the conflict strategy result.

CHG-CNF-007: Runtime trace shall record all matched rules if conflict strategy required selection.

### 7.9 Priority and Sequence

CHG-SEQ-001: Each charge rule shall support priority for conflict resolution.

CHG-SEQ-002: Each applied charge shall support sequence for calculation order.

CHG-SEQ-003: Pre-tax charge sequence shall execute before tax calculation.

CHG-SEQ-004: Post-tax charge sequence shall execute after tax calculation.

CHG-SEQ-005: The system shall prevent circular dependency between charge formulas.

CHG-SEQ-006: The system shall block publish if a charge formula references a charge that executes later in sequence.

CHG-SEQ-007: The system shall support admin-controlled drag-and-drop reordering of charge sequence where enabled.

CHG-SEQ-008: Drag-and-drop sequence reordering shall update structured sequence metadata only after user explicitly saves.

CHG-SEQ-009: The system shall validate sequence before publish.

### 7.10 Editability and Deviation Control

CHG-DEV-001: A charge rule shall define whether the calculated charge is editable at transaction time.

CHG-DEV-002: If editable, the rule shall define deviation type: absolute amount, percentage, min/max range, or unrestricted with permission.

CHG-DEV-003: The system shall block transaction save when user-edited charge exceeds configured deviation limit.

CHG-DEV-004: The system shall record original calculated amount, edited amount, user, timestamp, and reason where configured.

CHG-DEV-005: The system shall require reason for override when configured.

CHG-DEV-006: The system shall support approval trigger when edited charge exceeds a warning threshold but remains within maximum limit.

CHG-DEV-007: The system shall not allow editing of charges marked system-controlled.

CHG-DEV-008: The system shall enforce deviation rules in UI, API, and import flows.

### 7.11 Runtime Execution

CHG-RUN-001: Charge rules shall execute only after base pricing and discount inputs required for charge calculation are available.

CHG-RUN-002: Pre-tax charges shall execute before Tax Engine execution.

CHG-RUN-003: Post-tax charges shall execute after Tax Engine execution.

CHG-RUN-004: Charge Engine shall return applied charge records and shall not directly save the transaction.

CHG-RUN-005: Charge Engine shall not update parent documents.

CHG-RUN-006: Charge Engine shall not post ledger entries.

CHG-RUN-007: Charge Engine shall return warnings, blocking errors, applied charges, skipped charges, conflict details, and trace references.

CHG-RUN-008: Runtime execution shall use only eligible published rule versions effective for transaction date and scope.

CHG-RUN-009: Runtime execution shall support preview mode and final-save mode.

CHG-RUN-010: Final-save mode shall re-evaluate charge rules unless transaction service explicitly passes an immutable approved calculation snapshot.

## 8. Admin Studio Experience

### 8.1 Navigation

The Admin Studio shall expose this capability under Commercial Rules.

Recommended navigation:

```text
Admin Studio
└── Commercial Rules
    ├── Charge Masters
    ├── Charge Rules
    ├── Discount Rules
    ├── Charge Sequence
    ├── Deviation Policies
    ├── Simulation
    └── Published Versions
```

### 8.2 Charge Rule Form

CHG-ADM-001: The charge rule form shall include Basic Details, Scope, Applicability Conditions, Calculation Method, Tax Impact, Sequence, Conflict Strategy, Deviation Control, Simulation, and Publish Review sections.

CHG-ADM-002: The system shall use progressive disclosure so advanced fields appear only when relevant.

CHG-ADM-003: The system shall show a business-readable summary before publish.

CHG-ADM-004: The system shall show warnings for broad-scope rules that may apply to many transactions.

CHG-ADM-005: The system shall provide read-only view for published versions.

### 8.3 Drag-and-Drop Configuration

CHG-DND-001: The system should provide drag-and-drop reordering for charge sequence within a document type where sequencing is configurable.

CHG-DND-002: The system should provide drag-and-drop formula token insertion for fields, charge codes, and allowed functions.

CHG-DND-003: The system should provide drag-and-drop condition grouping for advanced users.

CHG-DND-004: Drag-and-drop changes shall update structured configuration metadata and shall not be runtime truth by themselves.

CHG-DND-005: The system shall validate drag-and-drop configuration before save and before publish.

## 9. API Requirements

CHG-API-001: The system shall expose an internal API to evaluate charge rules for a transaction payload.

CHG-API-002: The API shall support preview and final-save modes.

CHG-API-003: The API shall accept transaction context, entity, document type, tenant, organization, branch, transaction date, payload, and execution mode.

CHG-API-004: The API shall return applied charges, skipped rules, warnings, errors, trace ID, and version details.

CHG-API-005: The API shall be idempotent for the same payload, rule versions, and execution context.

CHG-API-006: The API shall not commit transaction records.

CHG-API-007: The API shall not call Accounting Engine directly.

CHG-API-008: The API may provide tax-impact metadata to the Financial Rule Orchestrator.

## 10. Data Model Requirements

CHG-DATA-001: The system shall store charge rule family.

CHG-DATA-002: The system shall store charge rule version.

CHG-DATA-003: The system shall store charge rule condition reference.

CHG-DATA-004: The system shall store calculation method configuration.

CHG-DATA-005: The system shall store slab/tier rows where applicable.

CHG-DATA-006: The system shall store deviation policy.

CHG-DATA-007: The system shall store sequence and priority.

CHG-DATA-008: The system shall store tax impact metadata.

CHG-DATA-009: The system shall store applied charge snapshot on transaction save.

CHG-DATA-010: The applied charge snapshot shall include charge code, rule version, source amount, calculated amount, rounded amount, edited amount, tax impact, apportionment, and trace reference.

## 11. Audit Requirements

CHG-AUD-001: The system shall audit creation, edit, review, approval, publish, retire, rollback, import, and export of charge rules.

CHG-AUD-002: Runtime trace shall capture matched rule version, input facts used, calculation method, formula/slab selected, output amount, conflict strategy, deviation, and applied result.

CHG-AUD-003: If a user overrides a charge, the system shall audit original value, new value, reason, user, timestamp, and approval reference where applicable.

CHG-AUD-004: Published charge versions shall remain available for historical transaction audit.

## 12. Error Handling

CHG-ERR-001: Missing mandatory charge configuration shall block publish.

CHG-ERR-002: Runtime missing optional charge configuration shall skip charge only where configured as optional.

CHG-ERR-003: Runtime missing mandatory charge configuration shall return blocking error.

CHG-ERR-004: Invalid formula shall block publish.

CHG-ERR-005: Formula division by zero shall return controlled error and shall not crash transaction processing.

CHG-ERR-006: Conflict without strategy shall block execution.

CHG-ERR-007: Charge calculation timeout shall return controlled error and trace reference.

## 13. Security Requirements

CHG-SEC-001: Only authorized users shall create or edit charge rules.

CHG-SEC-002: Only authorized users shall publish charge rules.

CHG-SEC-003: Users shall see only charge rules within their authorized tenant and organization scope.

CHG-SEC-004: Runtime evaluation shall not expose restricted fields in trace to unauthorized users.

CHG-SEC-005: Sensitive commercial rules shall support restricted view access.

## 14. Examples

### 14.1 Freight Charge Example

Scenario: Apply freight charge for Sale Invoice when delivery mode is Transporter.

Configuration:

```text
Entity: Sale Invoice
Charge Master: Freight
Scope: Header
Condition: Delivery Mode = Transporter
Method: Fixed Amount
Value: 1,500
Tax Timing: Pre-Tax
Taxability: Taxable
Sequence: 30
```

Expected Runtime:

```text
Base Amount: 100,000
Freight: 1,500
Taxable Base includes Freight if configured taxable
Tax Engine receives taxable charge metadata
Applied Charge Snapshot stores Freight rule version
```

### 14.2 Scheme Discount Example

Scenario: Apply 2% discount for dealer invoices above 5,00,000.

Configuration:

```text
Entity: Sale Invoice
Charge Master: Dealer Scheme Discount
Scope: Header
Condition: Customer Type = Dealer AND Invoice Base Amount >= 500000
Method: Percentage
Base: Invoice Base Amount
Value: -2%
Tax Timing: Pre-Tax
Taxability: Reduces Taxable Base
```

Expected Runtime:

```text
Base Amount: 600,000
Discount: -12,000
Taxable Amount before tax: 588,000
```

### 14.3 Return Deduction Example

Scenario: Sale Return includes restocking fee where enabled.

Configuration:

```text
Entity: Sale Return
Charge Master: Restocking Fee
Scope: Line
Condition: Return Reason = Customer Changed Mind
Method: Percentage
Base: Return Line Amount
Value: 5%
Tax Timing: Post-Tax or Non-Tax Impacting based on configuration
```

Expected Runtime:

```text
Return amount reduced by restocking fee
Return amount must not become negative
Trace stores deduction rule
```

### 14.4 Slab Charge Example

Scenario: Insurance charge based on invoice value.

```text
0 - 100,000: 500
100,001 - 500,000: 1,500
500,001 and above: 0.5% of invoice value
```

Expected Runtime:

```text
Invoice Value: 600,000
Selected slab: 500,001 and above
Insurance Charge: 3,000
```

## 15. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Rule references deleted field | Publish blocked. |
| Two rules match and conflict strategy missing | Publish or runtime blocked depending detection point. |
| Formula produces non-numeric value | Execution blocked with controlled error. |
| Editable charge exceeds max deviation | Transaction save blocked. |
| Post-tax charge configured before tax | Publish blocked or sequence corrected by system policy. |
| Slab ranges overlap | Publish blocked. |
| Tax-affecting charge lacks taxability | Publish blocked. |
| API submits edited charge without permission | Save blocked. |
| Inactive Charge Master used in new rule | Rule creation blocked. |
| Negative charge makes invoice total negative | Save blocked unless document type explicitly allows. |

## 16. Acceptance Criteria

CHG-ACC-001: Admin can create a fixed charge rule, simulate it, publish it, and see it apply to matching transaction payloads.

CHG-ACC-002: Admin can create a percentage discount rule and verify taxable base impact.

CHG-ACC-003: Admin can create a slab charge rule and publish only when slab validation passes.

CHG-ACC-004: Runtime evaluation returns applied charge snapshot without committing transaction.

CHG-ACC-005: Runtime trace shows matched rule version and calculation details.

CHG-ACC-006: User override beyond deviation limit blocks transaction save.

CHG-ACC-007: API and UI execution produce same charge result for same payload and rule version.

CHG-ACC-008: Published rule versions cannot be edited directly.

CHG-ACC-009: Charge sequence is deterministic.

CHG-ACC-010: Negative scenarios produce clear user-facing and support-facing errors.

## 17. AI Developer Agent Implementation Notes

1. Do not implement charges as hardcoded document logic.
2. Do not let Charge Engine calculate tax components.
3. Do not let Charge Engine post ledger entries.
4. Do not let Charge Engine commit transaction records.
5. Reuse shared Condition Engine and Expression Engine.
6. Store applied charge snapshots at transaction save time.
7. Runtime output must be deterministic for the same input and rule version.
8. Every execution must be traceable.
9. Drag-and-drop is an admin UX convenience, not runtime truth.
10. Do not invent undocumented charge types or conflict strategies without requirement update.

