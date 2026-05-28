# 06 - Tax Rules PRD

## 1. Feature Overview

The Tax Rules capability is the native iDMS tax decision and calculation engine. It determines tax applicability, tax regime, tax group, tax components, tax rates, taxable base, tax amount, and tax trace for transaction documents.

The feature must support India-first GST use cases and must be extensible for Middle East VAT and LATAM tax/localization scenarios without redesigning the core engine.

The Tax Engine uses the shared Rule Platform, Expression and Condition Engine, Validation Engine, Calculation Engine, and Financial Rule Orchestrator. It must not be tightly coupled to any single document module.

## 2. Business Objective

Allow Tax Administrators and Finance teams to configure and maintain tax rules, rates, formulas, and jurisdiction logic without code changes while preserving statutory correctness, auditability, and transaction integrity.

## 3. Scope

### 3.1 In Scope

- Tax regime configuration.
- Tax type configuration.
- Tax group configuration.
- Tax component configuration.
- Tax rate configuration.
- HSN/SAC/product classification support.
- Place of supply rules.
- Intra-state and inter-state decisioning.
- GST component resolution including CGST, SGST, IGST, Cess where configured.
- VAT-compatible tax model for future Middle East expansion.
- Withholding/deduction-compatible model for TDS/TCS and future LATAM retention scenarios.
- Reverse charge, exempt, nil-rated, zero-rated, non-taxable, and out-of-scope treatment where configured.
- Taxable base calculation.
- Formula-based tax amount calculation.
- Date-effective tax rate lookup.
- Charge taxability and pre-tax/post-tax interaction.
- Tax simulation.
- Runtime tax trace.
- Versioning, publish, retire, rollback.
- API/import parity with UI.

### 3.2 Out of Scope

- Direct ledger posting of tax entries.
- Filing/GSTR/e-invoice/e-way bill generation in MVP.
- Tax payment settlement.
- Government portal integration in MVP.
- Manual tax override unless separately approved.
- Workflow approvals for tax exceptions except via Approval/Workflow Engine integration.
- Arbitrary code execution.
- Country-specific full compliance packs beyond configurable core model in this PRD.

## 4. Personas

| Persona | Goal |
|---|---|
| Tax Admin | Configure tax regimes, groups, rates, rules, and formulas. |
| Finance Manager | Review and approve tax changes before publish. |
| Commercial Admin | Understand tax impact of charges and discounts. |
| Product Manager / BA | Define tax behavior for document types. |
| Implementation Consultant | Configure tenant-specific tax rules. |
| Auditor | Review tax calculation trace and historical rule version. |
| Support Engineer | Diagnose tax calculation failure. |
| AI Developer Agent | Implement deterministic native tax capabilities. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Tax Regime | Broad tax framework such as GST, VAT, TDS, TCS, Withholding, Custom. |
| Tax Type | Specific type under regime, such as Output GST, Input GST, VAT Sales, VAT Purchase. |
| Tax Group | Runtime output grouping that determines which components apply. |
| Tax Component | Tax component such as CGST, SGST, IGST, Cess, VAT, WHT. |
| Tax Rate | Effective dated rate for component based on classification and jurisdiction. |
| Tax Rule | Rule deciding tax applicability or tax group based on facts. |
| Taxable Base | Amount on which tax is calculated. |
| Place of Supply | Jurisdictional decision attribute used to determine tax treatment. |
| Supply Type | Intra-state, inter-state, import, export, local, cross-border, etc. |
| Tax Treatment | Taxable, exempt, nil-rated, zero-rated, reverse charge, non-taxable. |
| Tax Trace | Saved explanation of matched rule, rate, components, inputs, and output. |

## 6. Feature Boundaries

| Area | Tax Engine Owns | Tax Engine Must Not Own |
|---|---|---|
| Applicability | Whether tax applies | Transaction save |
| Components | Which tax components apply | Ledger posting |
| Rates | Effective tax rates | Accounting account selection |
| Formulas | Tax amount calculation | Charge applicability |
| Taxable base | Applying configured taxable base rules | Inventory impact |
| Trace | Tax calculation evidence | Workflow task routing |

## 7. Functional Requirements

### 7.1 Tax Regime and Tax Type Setup

TAX-REG-001: The system shall support multiple tax regimes.

TAX-REG-002: The system shall include GST as a first-class supported regime for India.

TAX-REG-003: The system shall support VAT-compatible regime configuration for future Middle East markets.

TAX-REG-004: The system shall support withholding/deduction regimes such as TDS, TCS, and future withholding tax use cases.

TAX-REG-005: Each tax regime shall define allowed tax types, components, rate dimensions, jurisdiction dimensions, and applicability rules.

TAX-REG-006: Tax regime configuration shall be tenant-aware but may inherit platform templates.

TAX-REG-007: The system shall allow regime templates to be cloned and localized.

TAX-REG-008: A tax regime shall have active/inactive status.

TAX-REG-009: Inactive regimes shall not be selectable for new rule configuration.

TAX-REG-010: Historical transactions shall retain tax regime snapshot even if regime is later inactive.

### 7.2 Tax Group and Component Setup

TAX-GRP-001: The system shall allow configuration of tax groups.

TAX-GRP-002: A tax group shall contain one or more tax components.

TAX-GRP-003: For Indian GST, the system shall support tax groups such as CGST+SGST, IGST, Exempt, Zero Rated, Nil Rated, Reverse Charge, and Cess-inclusive variants where configured.

TAX-GRP-004: Each tax component shall define component code, display name, calculation order, recoverability metadata where required, and active status.

TAX-GRP-005: The system shall prevent publishing a tax rule that references an inactive tax group.

TAX-GRP-006: The system shall preserve component snapshots on transaction save.

TAX-GRP-007: The system shall support tax group selection as an output of tax decision rules.

TAX-GRP-008: The system shall allow tax group configuration to indicate whether tax is included in price or added on top where required.

TAX-GRP-009: The system shall allow tax components to be marked as reporting-only, payable, receivable, withholding, recoverable, non-recoverable, or reference where required.

TAX-GRP-010: The system shall prevent tax group circular dependencies.

### 7.3 Tax Rate Setup

TAX-RATE-001: The system shall support effective-dated tax rates.

TAX-RATE-002: Tax rate lookup shall support dimensions including tax regime, tax type, tax group, tax component, HSN/SAC, product category, state/region, country, customer/supplier tax status, transaction type, and date.

TAX-RATE-003: The system shall allow future-dated rates.

TAX-RATE-004: The system shall prevent overlapping effective date ranges for the same rate dimension unless explicitly configured as priority-based.

TAX-RATE-005: The system shall block publish when a tax rule can resolve to a tax group with no valid rate for mandatory components.

TAX-RATE-006: The system shall allow zero rate where legally configured.

TAX-RATE-007: The system shall distinguish zero rate from missing rate.

TAX-RATE-008: The system shall support rate import through controlled upload/API with validation.

TAX-RATE-009: The system shall audit rate creation, update, activation, deactivation, and import.

TAX-RATE-010: Historical transactions shall retain applied rate snapshot.

### 7.4 HSN/SAC and Product Classification

TAX-HSN-001: The system shall support HSN/SAC-based tax classification.

TAX-HSN-002: Product Master or service classification shall provide HSN/SAC where required.

TAX-HSN-003: The system shall block taxable transaction save where mandatory HSN/SAC is missing.

TAX-HSN-004: The system shall allow tax rules to use product category where HSN/SAC is not applicable for the regime.

TAX-HSN-005: The system shall support line-level tax classification.

TAX-HSN-006: The system shall allow different lines in one document to resolve different tax rates.

TAX-HSN-007: The system shall store HSN/SAC snapshot at transaction line level.

### 7.5 Place of Supply and Jurisdiction Rules

TAX-POS-001: The system shall support configurable place of supply rules.

TAX-POS-002: Place of supply shall not be hardcoded in document modules.

TAX-POS-003: Place of supply rules shall be versioned and auditable.

TAX-POS-004: Place of supply determination shall support seller location, buyer location, ship-to location, bill-to location, supply type, service location, branch, warehouse, and document type where configured.

TAX-POS-005: For India GST, the system shall support intra-state vs inter-state determination using configured supplier and recipient jurisdiction.

TAX-POS-006: The system shall support override of place-of-supply only where explicitly configured and permissioned.

TAX-POS-007: Place-of-supply override shall require reason and audit where enabled.

TAX-POS-008: The system shall block tax calculation if mandatory jurisdiction facts are missing.

TAX-POS-009: The system shall expose place-of-supply trace in tax simulation and runtime trace.

TAX-POS-010: The system shall support non-India jurisdiction models without changing core tax engine architecture.

### 7.6 Tax Rule Definition

TAX-RUL-001: Each tax rule shall be registered as a rule family under the shared Rule Platform Foundation.

TAX-RUL-002: Each tax rule version shall be immutable after publish.

TAX-RUL-003: Each tax rule shall define applicability conditions using the shared Condition Engine.

TAX-RUL-004: Each tax rule shall produce a deterministic output such as tax group, tax treatment, rate lookup instruction, taxable base rule, or blocking error.

TAX-RUL-005: The system shall support tree-style conditional branching.

TAX-RUL-006: The system shall support decision-table-style representation where appropriate.

TAX-RUL-007: The system shall allow nested AND/OR conditions.

TAX-RUL-008: The system shall block publish if tax rule output is incomplete.

TAX-RUL-009: The system shall support rule priority when multiple tax rules match.

TAX-RUL-010: The system shall require conflict strategy when multiple matching tax rules can return different tax treatment.

TAX-RUL-011: The system shall support default/fallback tax treatment where configured.

TAX-RUL-012: The system shall block runtime execution when no tax rule matches and tax is mandatory.

TAX-RUL-013: The system shall allow non-taxable treatment where configured.

TAX-RUL-014: The system shall distinguish non-taxable, exempt, nil-rated, and zero-rated outcomes.

TAX-RUL-015: The system shall store display condition and decision path.

### 7.7 Taxable Base Calculation

TAX-BASE-001: The system shall calculate taxable base using configured taxable base rules.

TAX-BASE-002: Taxable base shall consider base line amount, discounts, pre-tax charges, taxable/non-taxable charges, exemptions, deductions, and document-specific adjustments.

TAX-BASE-003: Taxable base shall be calculated at line level unless configured otherwise.

TAX-BASE-004: Header-level charges affecting tax shall be apportioned before line-level tax calculation where required.

TAX-BASE-005: The system shall prevent negative taxable base unless document type explicitly supports return/credit behavior.

TAX-BASE-006: The system shall store taxable base snapshot.

TAX-BASE-007: The system shall trace all components contributing to taxable base.

TAX-BASE-008: The system shall block tax calculation if required charge apportionment is unresolved.

### 7.8 Tax Amount Calculation

TAX-CAL-001: The system shall calculate tax amount for each applicable tax component.

TAX-CAL-002: Tax amount calculation shall use applicable rate and taxable base unless formula overrides are configured.

TAX-CAL-003: The system shall support formula-based tax calculation using the shared Expression Engine.

TAX-CAL-004: The system shall support tax-inclusive and tax-exclusive calculation where configured.

TAX-CAL-005: The system shall support component sequencing.

TAX-CAL-006: The system shall support cess-on-tax or tax-on-tax behavior where configured.

TAX-CAL-007: The system shall support withholding-style deduction calculation where configured.

TAX-CAL-008: The system shall apply configured precision and rounding rules.

TAX-CAL-009: The system shall store raw and rounded tax amounts where required.

TAX-CAL-010: The system shall ensure tax summary equals sum of line tax components subject to configured rounding policy.

TAX-CAL-011: The system shall store tax calculation snapshot on transaction save.

### 7.9 GST India Requirements

TAX-GST-001: The system shall support GST as India-first tax regime.

TAX-GST-002: The system shall support CGST, SGST, IGST, and Cess components.

TAX-GST-003: The system shall resolve CGST+SGST for intra-state transactions where configured.

TAX-GST-004: The system shall resolve IGST for inter-state transactions where configured.

TAX-GST-005: The system shall support HSN/SAC rate mapping.

TAX-GST-006: The system shall support GSTIN and customer/supplier registration status as rule facts.

TAX-GST-007: The system shall support reverse charge treatment where configured.

TAX-GST-008: The system shall support zero-rated/export treatment where configured.

TAX-GST-009: The system shall support exempt/nil-rated treatment where configured.

TAX-GST-010: The system shall support tax treatment for inter-organization transfers where configured.

TAX-GST-011: The system shall allow place-of-supply rules to remain configurable and not embedded in Sale Invoice, Purchase Invoice, STO, or STI modules.

TAX-GST-012: The system shall preserve tax trace adequate for invoice output and audit.

### 7.10 VAT and International Extensibility

TAX-INT-001: The core model shall support VAT-style single-component tax groups.

TAX-INT-002: The core model shall support country/region jurisdiction dimensions.

TAX-INT-003: The core model shall support tax registration status as a rule fact.

TAX-INT-004: The core model shall support reverse charge/import VAT-like treatment where configured.

TAX-INT-005: The core model shall support withholding/retention taxes as deduction-style components.

TAX-INT-006: The core model shall not hardcode India-specific terms in runtime engine internals.

TAX-INT-007: Admin Studio labels may be localized per country without changing rule semantics.

TAX-INT-008: The system shall allow future localization packs.

### 7.11 Runtime Execution

TAX-RUN-001: Tax Engine shall execute after pre-tax charges and taxable base preparation.

TAX-RUN-002: Tax Engine shall execute before post-tax charges and accounting preview.

TAX-RUN-003: Tax Engine shall return tax result and shall not commit transaction records.

TAX-RUN-004: Tax Engine shall not post ledger entries.

TAX-RUN-005: Tax Engine shall not update parent documents.

TAX-RUN-006: Runtime execution shall use only published effective tax rule and rate versions.

TAX-RUN-007: Runtime execution shall support preview and final-save modes.

TAX-RUN-008: Final-save mode shall revalidate rates, tax treatment, and mandatory tax facts.

TAX-RUN-009: Tax Engine shall return blocking errors for missing mandatory tax configuration.

TAX-RUN-010: Tax Engine shall return tax trace ID for every successful calculation.

## 8. Admin Studio Experience

### 8.1 Navigation

Recommended navigation:

```text
Admin Studio
└── Tax Configuration
    ├── Tax Regimes
    ├── Tax Types
    ├── Tax Groups
    ├── Tax Components
    ├── Tax Rates
    ├── Place of Supply Rules
    ├── Tax Decision Rules
    ├── HSN/SAC Mapping
    ├── Tax Simulation
    └── Published Versions
```

### 8.2 Tax Rule Builder

TAX-ADM-001: Admin Studio shall provide a guided tax rule builder.

TAX-ADM-002: The builder shall include Basic Details, Scope, Applicability, Decision Path, Output Tax Treatment, Rate Resolution, Formula, Simulation, and Publish Review.

TAX-ADM-003: The builder shall provide warnings for missing effective rates.

TAX-ADM-004: The builder shall show business-readable tax decision summary.

TAX-ADM-005: Published versions shall open in read-only mode.

### 8.3 Drag-and-Drop Configuration

TAX-DND-001: The system should provide a visual tax rule tree builder for conditional branching where enabled.

TAX-DND-002: Admins should be able to drag condition nodes, decision nodes, tax group output nodes, and fallback nodes onto the rule tree canvas.

TAX-DND-003: The system shall validate that every branch has a terminal output or explicit fallback.

TAX-DND-004: The visual tree shall save both layout metadata and structured executable tax rule metadata.

TAX-DND-005: The structured executable tax rule metadata shall be runtime truth.

TAX-DND-006: Dragging nodes shall not change published runtime behavior until saved, validated, approved, and published as a new version.

## 9. API Requirements

TAX-API-001: The system shall expose an internal API to calculate tax for transaction payloads.

TAX-API-002: The API shall accept tenant, entity, document type, transaction date, source context, party context, line payloads, charge metadata, and execution mode.

TAX-API-003: The API shall return tax treatment, tax group, tax components, tax rates, taxable base, tax amounts, warnings, errors, and trace ID.

TAX-API-004: The API shall support preview and final-save modes.

TAX-API-005: The API shall not commit transaction records.

TAX-API-006: The API shall not call Accounting Engine directly.

TAX-API-007: The API shall be deterministic for same payload, same tax rule version, same rate version, and same execution context.

## 10. Data Model Requirements

TAX-DATA-001: The system shall store tax regime metadata.

TAX-DATA-002: The system shall store tax type metadata.

TAX-DATA-003: The system shall store tax group metadata.

TAX-DATA-004: The system shall store tax component metadata.

TAX-DATA-005: The system shall store tax rate records.

TAX-DATA-006: The system shall store tax rule family and version records.

TAX-DATA-007: The system shall store tax decision tree/decision table metadata.

TAX-DATA-008: The system shall store formula metadata where applicable.

TAX-DATA-009: The system shall store tax transaction snapshot.

TAX-DATA-010: Tax transaction snapshot shall include tax rule version, rate version, taxable base, components, rates, amounts, jurisdiction facts, and trace reference.

## 11. Audit Requirements

TAX-AUD-001: The system shall audit tax regime, tax type, group, component, rate, and rule changes.

TAX-AUD-002: The system shall audit publish, retire, rollback, import, and export.

TAX-AUD-003: Runtime tax trace shall capture matched rule path, input facts, taxable base derivation, rate resolution, formulas, components, and output amount.

TAX-AUD-004: Historical transactions shall remain explainable using saved tax snapshots and version references.

TAX-AUD-005: Tax override, where allowed, shall require permission, reason, and audit.

## 12. Error Handling

TAX-ERR-001: Missing mandatory tax facts shall return blocking error.

TAX-ERR-002: Missing mandatory rate shall return blocking error unless tax treatment explicitly permits no tax.

TAX-ERR-003: Invalid HSN/SAC shall block taxable transaction save.

TAX-ERR-004: Invalid formula shall block publish.

TAX-ERR-005: Runtime formula errors shall return controlled error with trace reference.

TAX-ERR-006: Multiple conflicting tax rules without strategy shall block execution.

TAX-ERR-007: Tax Engine timeout shall return controlled error and shall not partially calculate tax.

## 13. Security Requirements

TAX-SEC-001: Only authorized Tax Admins shall create or edit tax rules.

TAX-SEC-002: Only authorized reviewers shall approve tax rule versions.

TAX-SEC-003: Tax rate import shall require elevated permission.

TAX-SEC-004: Tax trace visibility shall be permission-controlled.

TAX-SEC-005: Tax configuration shall be tenant-isolated.

## 14. Examples

### 14.1 India GST Inter-State Sale Example

Input:

```text
Seller State: Maharashtra
Buyer State: Gujarat
HSN: 8708
Taxable Amount: 100,000
Transaction Type: Sale Invoice
```

Expected:

```text
Supply Type: Inter-State
Tax Group: IGST
IGST Rate: resolved by HSN/date
CGST/SGST: not applied
Tax Trace: stored with rule and rate versions
```

### 14.2 India GST Intra-State Sale Example

Input:

```text
Seller State: Maharashtra
Buyer State: Maharashtra
Taxable Amount: 100,000
```

Expected:

```text
Supply Type: Intra-State
Tax Group: CGST + SGST
CGST and SGST rates resolved separately
Tax summary stores both components
```

### 14.3 Taxable Freight Example

Input:

```text
Base Amount: 100,000
Pre-Tax Freight: 1,500
Freight Taxability: Taxable
```

Expected:

```text
Taxable Base: 101,500
Tax calculated on base plus taxable freight
Trace shows freight contribution
```

### 14.4 Exempt Product Example

Input:

```text
Product Tax Treatment: Exempt
Taxable Base: 25,000
```

Expected:

```text
Tax Group: Exempt
Tax Amount: 0
Reason: Exempt treatment, not missing rate
Trace stores exemption rule
```

### 14.5 Future Middle East VAT Example

Input:

```text
Country: UAE
Tax Regime: VAT
Customer Type: Registered Business
Taxable Amount: 10,000
```

Expected:

```text
Tax Group: VAT Output
Component: VAT
Rate: configured UAE VAT rate by effective date
No GST-specific labels in backend trace
```

## 15. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Place of supply facts missing for GST taxable invoice | Save blocked. |
| HSN missing where mandatory | Save blocked. |
| Rate missing for selected HSN/date | Save blocked unless explicit zero/exempt treatment applies. |
| Two rules return different tax groups with no conflict strategy | Execution blocked. |
| Tax group references inactive component | Publish blocked. |
| Tax formula references deleted field | Publish blocked. |
| Tax-inclusive calculation has invalid base | Controlled error. |
| User manually changes tax amount without permission | Save blocked. |
| Imported rate overlaps existing rate | Import blocked or staged for correction. |
| Rule tree branch has no terminal output | Publish blocked. |

## 16. Acceptance Criteria

TAX-ACC-001: Tax Admin can configure GST tax group and component rates.

TAX-ACC-002: Tax Admin can configure place-of-supply decision rule.

TAX-ACC-003: Runtime can calculate CGST+SGST for intra-state transaction.

TAX-ACC-004: Runtime can calculate IGST for inter-state transaction.

TAX-ACC-005: Runtime can distinguish exempt from missing rate.

TAX-ACC-006: Tax calculation uses pre-tax charges correctly.

TAX-ACC-007: Tax trace shows rule version, rate version, facts, components, and amounts.

TAX-ACC-008: Published tax rules are immutable.

TAX-ACC-009: Tax simulation returns same result as runtime preview for same payload.

TAX-ACC-010: API and UI execution produce same tax result.

## 17. AI Developer Agent Implementation Notes

1. Do not hardcode Indian GST logic inside Sale Invoice, Purchase Invoice, STO, or STI modules.
2. Implement India GST through configuration templates and reusable tax engine logic.
3. Do not let Tax Engine post ledger entries.
4. Do not let Tax Engine commit transactions.
5. Do not treat zero tax as missing tax.
6. Preserve tax snapshots for historical audit.
7. Use shared expression and condition services.
8. The visual tax tree is not runtime truth; structured published metadata is runtime truth.
9. Validate rates and formulas before publish.
10. Design for future VAT/withholding localization without schema rewrite.

