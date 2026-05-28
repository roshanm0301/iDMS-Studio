# 07 - Accounting Rules PRD

## 1. Feature Overview

The Accounting Rules capability resolves accounting posting intent for business transactions. It determines debit/credit posting lines, posting templates, target GL accounts, sub-ledger requirements, bank account dependencies, and accounting handoff payloads based on transaction facts.

The capability is native to iDMS and uses the shared Rule Platform, Expression and Condition Engine, Validation Engine, and Financial Rule Orchestrator.

Accounting Rules shall generate posting preview or accounting handoff outputs. They must not directly post ledgers unless an approved Accounting Posting Service owns the commit.

## 2. Business Objective

Enable finance teams to configure deterministic, auditable, tenant-aware GL account resolution and posting line generation without code changes, while preserving financial control and avoiding accidental ledger mutation.

## 3. Scope

### 3.1 In Scope

- Accounting rule family and version management.
- Entity-bound accounting rules.
- Business unit and organization scoping.
- Posting template selection.
- Debit/credit line resolution.
- GL account mapping.
- Sub-ledger configuration.
- Bank account dependency validation.
- Multi-line posting output.
- Posting preview.
- Accounting handoff payload.
- Rule simulation.
- Runtime trace.
- Versioning, publish, retire, rollback.
- Integration with transaction documents after charge/tax/totals calculation.

### 3.2 Out of Scope

- Direct ledger posting in transaction modules.
- Journal voucher lifecycle.
- Financial period close and reopening.
- Bank reconciliation.
- Payment settlement.
- Tax return filing.
- Inventory valuation accounting in MVP unless explicitly passed by transaction/accounting service.
- Workflow approval of journals except via Approval/Workflow Engine.
- Arbitrary custom code execution.

## 4. Personas

| Persona | Goal |
|---|---|
| Finance Admin | Configure accounting posting rules and GL mappings. |
| Accounts Manager | Review and approve accounting rule versions. |
| Implementation Consultant | Configure tenant-specific account mapping. |
| Auditor | Review posting intent and rule trace. |
| Support Engineer | Diagnose accounting handoff errors. |
| Product Manager / BA | Define accounting boundaries for transaction documents. |
| AI Developer Agent | Implement deterministic posting-rule behavior. |

## 5. Key Concepts

| Concept | Description |
|---|---|
| Accounting Rule | Rule that resolves posting lines for a transaction. |
| Posting Template | Defines expected debit/credit structure for a transaction event. |
| Posting Line | One debit or credit output line. |
| Entry Type | Debit or Credit. |
| GL Account | General Ledger account resolved by the rule. |
| Sub-Ledger | Detailed ledger tracking entity such as customer, supplier, bank, product, branch. |
| Posting Intent | Output describing intended accounting effect before ledger commit. |
| Posting Preview | User-visible preview of accounting output. |
| Accounting Handoff | Structured payload sent to Accounting Posting Service. |
| Balancing | Debit total equals credit total within precision rules. |
| Accounting Trace | Audit record explaining rule match and posting output. |

## 6. Feature Boundaries

| Area | Accounting Rules Own | Accounting Rules Must Not Own |
|---|---|---|
| Account resolution | Which GL account applies | Transaction save |
| Posting line output | Debit/credit intent | Direct ledger commit |
| Sub-ledger selection | Required sub-ledger references | Payment settlement |
| Validation | Missing account/sub-ledger/bank details | Tax calculation |
| Preview | Accounting impact preview | Inventory posting |
| Trace | Matched posting rules | Workflow routing |

## 7. Functional Requirements

### 7.1 Accounting Rule Registry

ACC-RUL-001: The system shall create each accounting rule as a rule family using the shared Rule Platform Foundation.

ACC-RUL-002: Each accounting rule version shall be immutable after publish.

ACC-RUL-003: Editing a published accounting rule shall create a new draft version.

ACC-RUL-004: Each accounting rule version shall store entity, document type, transaction event, business unit scope, organization scope, posting template, conditions, posting lines, effective dates, and lifecycle status.

ACC-RUL-005: The system shall support tenant, organization, branch, business unit, entity, document type, product group, party type, and transaction event scoping.

ACC-RUL-006: The system shall prevent duplicate active accounting rules with same scope, event, and priority unless conflict strategy allows it.

ACC-RUL-007: The system shall support rule priority for account resolution.

ACC-RUL-008: The system shall support display condition for finance readability.

ACC-RUL-009: Published accounting rules shall remain visible for historical audit.

ACC-RUL-010: Retired accounting rules shall not be used for new runtime evaluation.

### 7.2 Transaction Event Binding

ACC-EVT-001: Each accounting rule shall be bound to one or more accounting-relevant transaction events.

ACC-EVT-002: Supported event examples shall include Sale Invoice Created, Purchase Invoice Created, Sale Return Created, Purchase Return Created, Delivery Completed where accounting applies, Stock Transfer Outward Closed where accounting applies, Stock Transfer Inward Closed where accounting applies, and Payment/Settlement events where future modules require.

ACC-EVT-003: The system shall not infer accounting events from document names without configured event mapping.

ACC-EVT-004: Transaction modules shall call accounting preview only for configured events.

ACC-EVT-005: Accounting event mapping shall be versioned and auditable.

ACC-EVT-006: Accounting events shall define whether preview is mandatory, optional, or not applicable.

ACC-EVT-007: Accounting events shall define whether final accounting handoff is synchronous, asynchronous, or external-service-owned where configured.

### 7.3 Posting Template

ACC-TPL-001: The system shall support posting templates.

ACC-TPL-002: A posting template shall define expected posting line roles.

ACC-TPL-003: A posting template shall define balancing requirement.

ACC-TPL-004: A posting template shall define allowed entry types per line role.

ACC-TPL-005: A posting template shall define mandatory and optional posting lines.

ACC-TPL-006: A posting template shall support derived amount references such as taxable amount, tax amount, gross amount, charge amount, discount amount, round-off, inventory amount, and return amount where available.

ACC-TPL-007: The system shall block publish if accounting rule output does not satisfy mandatory posting template lines.

ACC-TPL-008: The system shall allow posting templates to be tenant-specific or inherited from platform templates.

ACC-TPL-009: Posting templates shall be versioned.

ACC-TPL-010: Historical accounting trace shall store posting template version.

### 7.4 Posting Lines

ACC-LIN-001: An accounting rule shall produce one or more posting lines.

ACC-LIN-002: Each posting line shall define entry type Debit or Credit.

ACC-LIN-003: Each posting line shall define posting line role.

ACC-LIN-004: Each posting line shall resolve a target GL account.

ACC-LIN-005: Each posting line shall define amount source or formula.

ACC-LIN-006: Each posting line shall support conditions where line applicability differs from rule applicability.

ACC-LIN-007: Each posting line shall define whether sub-ledger is required.

ACC-LIN-008: Each posting line shall define whether bank details are required.

ACC-LIN-009: Each posting line shall define narration template where configured.

ACC-LIN-010: Each posting line shall store rule version reference in output trace.

### 7.5 GL Account Resolution

ACC-GL-001: The system shall resolve GL accounts based on configured rule output.

ACC-GL-002: GL account references shall be validated before publish.

ACC-GL-003: The system shall block publish if required GL account is inactive.

ACC-GL-004: Historical transactions shall retain GL account snapshot even if account becomes inactive later.

ACC-GL-005: The system shall support static GL account mapping.

ACC-GL-006: The system shall support conditional GL account mapping.

ACC-GL-007: The system shall support dynamic GL resolution through allowed master references where configured.

ACC-GL-008: The system shall block runtime handoff if mandatory GL account cannot be resolved.

ACC-GL-009: The system shall expose clear error when account resolution fails.

ACC-GL-010: The system shall not allow accounting rules to create GL accounts.

### 7.6 Debit/Credit Balancing

ACC-BAL-001: The system shall validate that posting intent balances where posting template requires balancing.

ACC-BAL-002: Debit total shall equal credit total within configured accounting precision.

ACC-BAL-003: Rounding difference shall be handled only through configured round-off posting line where allowed.

ACC-BAL-004: The system shall block accounting handoff when posting is unbalanced.

ACC-BAL-005: Posting preview shall clearly show imbalance errors.

ACC-BAL-006: The system shall not auto-create balancing lines unless configured in posting template.

ACC-BAL-007: The system shall audit any auto-balancing or round-off line generation.

### 7.7 Sub-Ledger Handling

ACC-SUB-001: The system shall support sub-ledger tracking on posting lines.

ACC-SUB-002: Supported sub-ledger types shall include Customer, Supplier, Bank, Employee, Product, Branch, Warehouse, Cost Center, and Custom where configured.

ACC-SUB-003: If a posting line requires sub-ledger, runtime shall validate that sub-ledger reference exists in transaction context.

ACC-SUB-004: The system shall block accounting handoff if mandatory sub-ledger is missing.

ACC-SUB-005: Sub-ledger values shall be stored in posting intent.

ACC-SUB-006: Sub-ledger visibility shall be permission-controlled.

ACC-SUB-007: Historical posting trace shall retain sub-ledger snapshot.

### 7.8 Bank Account Dependency

ACC-BNK-001: The system shall identify GL accounts of bank account type where configured.

ACC-BNK-002: Posting lines targeting bank-type accounts shall require bank detail association where configured.

ACC-BNK-003: The system shall block publish if a static bank-type GL account lacks required bank configuration.

ACC-BNK-004: The system shall block runtime handoff if bank details are mandatory and missing.

ACC-BNK-005: Bank detail validation shall be enforced in UI, API, and import flows.

### 7.9 Amount Sources and Formulas

ACC-AMT-001: Posting line amount source shall be mandatory.

ACC-AMT-002: Amount source may reference transaction total, taxable amount, tax component amount, charge amount, discount amount, round-off, return amount, inventory amount, or formula.

ACC-AMT-003: Formula-based amount shall use shared Expression Engine.

ACC-AMT-004: Formula shall not mutate transaction data.

ACC-AMT-005: The system shall block publish if amount formula references unavailable field.

ACC-AMT-006: Runtime shall return controlled error if amount source is missing.

ACC-AMT-007: Runtime shall apply configured currency and precision policy.

ACC-AMT-008: Accounting preview shall show amount source explanation.

### 7.10 Posting Preview

ACC-PRV-001: The system shall support accounting posting preview before final transaction save where configured.

ACC-PRV-002: Posting preview shall show debit lines, credit lines, GL account, sub-ledger, amount, narration, and balancing status.

ACC-PRV-003: Posting preview shall indicate whether output is final, provisional, or blocked.

ACC-PRV-004: Posting preview shall not post to ledger.

ACC-PRV-005: Posting preview shall use same rule evaluation path as final handoff.

ACC-PRV-006: Posting preview shall show matched accounting rule version.

ACC-PRV-007: Posting preview shall be permission-controlled.

### 7.11 Accounting Handoff

ACC-HND-001: Accounting Rule Engine shall produce structured accounting handoff payload.

ACC-HND-002: Handoff payload shall include transaction identity, event, posting template version, posting rule version, posting lines, amount, currency, sub-ledger, source references, and trace ID.

ACC-HND-003: Accounting Rule Engine shall not directly post ledger entries unless called by approved Accounting Posting Service.

ACC-HND-004: Transaction Service shall decide whether accounting handoff is pre-save validation, post-save synchronous call, post-save event, or manual accounting process based on document configuration.

ACC-HND-005: Failed mandatory accounting handoff shall block or rollback transaction only when document configuration requires synchronous accounting integrity.

ACC-HND-006: Asynchronous handoff shall use idempotent event keys.

ACC-HND-007: Duplicate handoff shall not create duplicate postings.

ACC-HND-008: Handoff status shall be traceable.

### 7.12 Runtime Execution

ACC-RUN-001: Accounting Rule Engine shall execute after charge, tax, and total calculations are available.

ACC-RUN-002: Accounting Rule Engine may execute in preview mode before transaction save.

ACC-RUN-003: Accounting Rule Engine may execute in final-save or post-commit mode based on configuration.

ACC-RUN-004: Runtime execution shall use only published effective accounting rules.

ACC-RUN-005: Runtime execution shall return posting intent and shall not mutate transaction values.

ACC-RUN-006: Runtime execution shall not update parent documents.

ACC-RUN-007: Runtime execution shall not update inventory.

ACC-RUN-008: Runtime execution shall return blocking errors when mandatory accounting output cannot be resolved.

ACC-RUN-009: Runtime execution shall return trace ID.

ACC-RUN-010: Runtime execution shall be deterministic for same payload, same rule version, and same context.

## 8. Admin Studio Experience

### 8.1 Navigation

Recommended navigation:

```text
Admin Studio
└── Accounting Configuration
    ├── Posting Templates
    ├── Posting Rules
    ├── GL Mapping
    ├── Sub-Ledger Rules
    ├── Bank Dependencies
    ├── Posting Simulation
    └── Published Versions
```

### 8.2 Posting Rule Builder

ACC-ADM-001: Admin Studio shall provide a guided accounting rule builder.

ACC-ADM-002: The builder shall include Basic Details, Event Binding, Scope, Conditions, Posting Template, Posting Lines, Sub-Ledger, Bank Dependencies, Simulation, and Publish Review.

ACC-ADM-003: The builder shall show debit/credit balancing status before publish.

ACC-ADM-004: The builder shall show inactive/missing account warnings.

ACC-ADM-005: Published versions shall open in read-only mode.

### 8.3 Drag-and-Drop Configuration

ACC-DND-001: The system may support drag-and-drop ordering of posting lines for display and review.

ACC-DND-002: Drag-and-drop shall not change debit/credit semantics unless line configuration is explicitly edited and saved.

ACC-DND-003: The system should allow drag-and-drop formula token insertion for amount formulas.

ACC-DND-004: The system should not use free-form visual workflow-style canvas for GL mapping in MVP.

ACC-DND-005: Structured grid configuration shall be the primary interaction for posting lines.

## 9. API Requirements

ACC-API-001: The system shall expose an internal API to evaluate accounting rules.

ACC-API-002: The API shall accept transaction context, event, entity, document type, tenant, organization, branch, business unit, currency, payload, charge results, tax results, totals, and execution mode.

ACC-API-003: The API shall return posting intent, posting lines, warnings, blocking errors, balancing status, and trace ID.

ACC-API-004: The API shall support preview and final modes.

ACC-API-005: The API shall not commit ledger entries.

ACC-API-006: The API shall be idempotent for same payload, rule version, and context.

ACC-API-007: The API shall expose trace reference for diagnostics.

## 10. Data Model Requirements

ACC-DATA-001: The system shall store accounting rule family.

ACC-DATA-002: The system shall store accounting rule version.

ACC-DATA-003: The system shall store posting template and version.

ACC-DATA-004: The system shall store posting line configuration.

ACC-DATA-005: The system shall store GL account references.

ACC-DATA-006: The system shall store sub-ledger configuration.

ACC-DATA-007: The system shall store bank dependency configuration.

ACC-DATA-008: The system shall store posting preview and trace where configured.

ACC-DATA-009: The system shall store accounting handoff status where applicable.

ACC-DATA-010: The transaction snapshot shall include posting intent reference if generated during save.

## 11. Audit Requirements

ACC-AUD-001: The system shall audit accounting rule creation, edit, review, approval, publish, retire, rollback, import, and export.

ACC-AUD-002: Runtime accounting trace shall capture transaction event, matched rules, posting template, GL accounts, debit/credit lines, amount sources, sub-ledgers, and balancing result.

ACC-AUD-003: The system shall preserve historical rule and posting template versions.

ACC-AUD-004: Posting preview access shall be auditable where configured.

ACC-AUD-005: Handoff event status shall be auditable.

## 12. Error Handling

ACC-ERR-001: Missing mandatory GL account shall block accounting output.

ACC-ERR-002: Inactive GL account shall block publish or runtime handoff based on detection point.

ACC-ERR-003: Missing mandatory sub-ledger shall block accounting output.

ACC-ERR-004: Unbalanced debit/credit output shall block accounting handoff.

ACC-ERR-005: Missing posting template shall block publish.

ACC-ERR-006: Formula error shall return controlled error.

ACC-ERR-007: Duplicate handoff event shall be ignored or linked to existing handoff, not reposted.

ACC-ERR-008: Accounting service failure shall follow configured synchronous/asynchronous failure policy.

## 13. Security Requirements

ACC-SEC-001: Only authorized Finance Admins shall create or edit accounting rules.

ACC-SEC-002: Only authorized reviewers shall approve accounting rule versions.

ACC-SEC-003: GL account visibility shall respect finance permissions.

ACC-SEC-004: Posting preview shall be permission-controlled.

ACC-SEC-005: Accounting configuration shall be tenant-isolated.

ACC-SEC-006: Sensitive account details shall not be exposed in runtime trace to unauthorized users.

## 14. Examples

### 14.1 Sale Invoice Posting Preview Example

Input:

```text
Event: Sale Invoice Created
Invoice Total: 118,000
Taxable Amount: 100,000
GST Amount: 18,000
Customer: ABC Dealer
```

Expected Posting Intent:

```text
Debit: Customer Receivable 118,000, Sub-ledger = ABC Dealer
Credit: Sales Revenue 100,000
Credit: Output GST 18,000
Balanced: Yes
Ledger Posted: No, unless Accounting Posting Service later commits
```

### 14.2 Purchase Invoice Posting Preview Example

Input:

```text
Event: Purchase Invoice Created
Invoice Total: 59,000
Taxable Amount: 50,000
Input GST: 9,000
Supplier: XYZ OEM
```

Expected Posting Intent:

```text
Debit: Purchase/Inventory/Expense Account 50,000
Debit: Input GST 9,000
Credit: Supplier Payable 59,000, Sub-ledger = XYZ OEM
Balanced: Yes
```

### 14.3 Bank Account Dependency Example

Input:

```text
Posting Line GL Account Type: Bank
Bank Detail: Missing
```

Expected:

```text
Posting output blocked
Error: Bank details required for selected bank GL account
```

### 14.4 Round-Off Posting Example

Input:

```text
Debit Total before round-off: 1000.01
Credit Total before round-off: 1000.00
Rounding Difference: 0.01
Posting Template allows round-off line
```

Expected:

```text
Round-off posting line generated as configured
Trace records auto round-off line
```

## 15. Negative Scenarios

| Scenario | Expected Result |
|---|---|
| Posting rule resolves inactive GL account | Publish/runtime blocked. |
| Debit and credit totals do not balance | Accounting handoff blocked. |
| Mandatory sub-ledger missing | Accounting output blocked. |
| Bank GL selected without bank details | Accounting output blocked. |
| Amount formula references deleted field | Publish blocked. |
| Posting template mandatory line missing | Publish blocked. |
| Duplicate event handoff sent | No duplicate posting. |
| Accounting rule tries to mutate transaction status | Not allowed. |
| Sale Invoice core is configured for accounting preview but no rule exists | Save blocked or warning based on document configuration. |
| Unauthorized user views posting preview | Access denied. |

## 16. Acceptance Criteria

ACC-ACPT-001: Finance Admin can configure posting template with debit and credit lines.

ACC-ACPT-002: Finance Admin can configure Sale Invoice posting rule and simulate it.

ACC-ACPT-003: Runtime generates balanced posting preview for valid Sale Invoice payload.

ACC-ACPT-004: Runtime blocks accounting output when mandatory account is missing.

ACC-ACPT-005: Runtime blocks unbalanced posting unless round-off line is configured.

ACC-ACPT-006: Accounting handoff payload includes rule version and trace ID.

ACC-ACPT-007: Published accounting rule versions are immutable.

ACC-ACPT-008: API and UI simulation produce same result.

ACC-ACPT-009: Accounting Rule Engine does not directly post ledger entries.

ACC-ACPT-010: Historical trace remains available after rule retirement.

## 17. AI Developer Agent Implementation Notes

1. Do not implement direct ledger posting inside Accounting Rule Engine.
2. Generate posting intent, preview, and handoff payload only.
3. Use Accounting Posting Service boundary for actual ledger commit if/when implemented.
4. Do not let transaction modules hardcode GL account mapping.
5. Reuse shared Condition Engine and Expression Engine.
6. Enforce debit/credit balancing where required.
7. Preserve posting rule, template, account, and sub-ledger snapshots.
8. Implement idempotency for accounting handoff events.
9. Keep finance permissions strict.
10. Do not infer undocumented accounting events.

