# Rule Engine Browser Test Report

**Date**: 2025-05-28  
**Environment**: http://localhost:5177 (Vite dev server)  
**Total Rules Created**: 21 (3 per form type × 7 form types)

---

## Summary

| Form Type | Rules Created | Status | Issues |
|-----------|:---:|:---:|:---:|
| Validation Rules | 3/3 | ✅ Pass | 1 UX issue |
| Calculation Rules | 3/3 | ✅ Pass | None |
| Charge/Discount Rules | 3/3 | ✅ Pass | None |
| Tax Rules | 3/3 | ✅ Pass | None |
| Accounting Rules | 3/3 | ✅ Pass | None |
| Approval Policies | 3/3 | ✅ Pass | None |
| Workflow Designer | 1 created + nodes added | ✅ Pass | 2 issues |

---

## Issues Found

### Issue #1: Premature Execution Points Validation (Validation Form)
- **Severity**: Medium (UX)
- **Location**: `CreateValidationRulePage.tsx` — Execution Points section
- **Behavior**: When the user interacts with any other field first (e.g., selecting category), the "Select at least one execution point" error message appears immediately — before the user has touched the execution points section.
- **Expected**: Error should only appear after the user attempts to submit or after they interact with the execution points section and leave it empty.
- **Root Cause**: The form validation `validate` function runs on every render/interaction and the execution points array starts as empty `[]`.
- **Impact**: Confusing for users; the Create Rule button becomes disabled prematurely.

### Issue #2: Save Version Button — No User Feedback (Workflow Designer)
- **Severity**: Medium (UX)
- **Location**: `WorkflowDesignerPage.tsx` — Save Version button
- **Behavior**: Clicking "Save Version" does nothing visible — no success toast, no error message, no loading state.
- **Expected**: Should show "Version saved!" toast (like all other forms show success messages) or an error if save fails.
- **Impact**: User has no way to confirm whether their workflow changes were actually persisted.

### Issue #3: ReactFlow nodeTypes/edgeTypes Not Memoized (Workflow Designer)
- **Severity**: Low (Performance Warning)
- **Location**: `WorkflowDesignerPage.tsx`
- **Behavior**: Console warnings: `[React Flow]: It looks like you've created a new nodeTypes or edgeTypes object.`
- **Expected**: `nodeTypes` and `edgeTypes` objects should be defined outside the component or wrapped in `useMemo`.
- **Impact**: Unnecessary re-renders on every state change. No user-visible issue but degrades performance.

---

## Detailed Test Cases

### Validation Rules (3 created)
1. **Field Mandatory / Block / On Save** — Entity: sale_invoice, Field: customer_name
2. **Range / Warning / On Submit** — Entity: purchase_order, Field: quantity, Message: "Quantity must be between 1 and 10000"
3. **Lifecycle/Status / Info / On Field Change** — Entity: service_order, Field: status, Non-overridable checked

### Calculation Rules (3 created)
1. **Line Net Amount** — Line-Level, On Change, Formula: `qty * unit_price - discount`, 3 input fields, depends on Base Amount
2. **Invoice Total Aggregation** — Aggregation, On Save, Formula: `SUM(lines.line_net_amount)`, depends on Line Net Amount
3. **Taxable Base Derivation** — Taxable Base, On Calculate, Precision: 4, Rounding: Round Down, Edit: system controlled, depends on Line Net Amount + Discount Amount

### Charge/Discount Rules (3 created)
1. **Standard Freight 5%** — Freight, Percentage (5%), Line scope, Pre-Tax, Effective 2025-01-01 to 2025-12-31
2. **Insurance Premium Flat** — Insurance, Fixed Amount (500), Header scope, Post-Tax, Apply All
3. **Dealer Volume Discount** — Dealer Scheme Discount, Slab/Tier (3 tiers: 0-100K@2%, 100K-500K@5%, 500K+@Fixed 10000), Header, Non-Tax Impacting, Highest Priority

### Tax Rules (3 created)
1. **GST Standard Intra-State** — GST, CGST+SGST, Taxable, Condition: customer.state == supplier.state
2. **IGST Inter-State** — GST, IGST, Taxable, Priority 20, Condition: customer.state != supplier.state
3. **TDS Default Reverse Charge** — TDS, GST Exempt, Reverse Charge, Priority 100, Default rule checked

### Accounting Rules (3 created)
1. **Sale Invoice Revenue Posting** — Sale Invoice Created, Sale Invoice Posting template, Effective 2024-04-01
2. **Purchase Invoice COGS Posting** — Purchase Invoice Created, Purchase Invoice Posting template, Priority 5
3. **Payment Receipt AR Clearing** — Payment Received, Sale Return Posting template, Effective 2025-01-01

### Approval Policies (3 created)
1. **PO_BASIC_APPROVAL** — Single Approver, procurement/purchase_order, Reporting Manager, SLA 24h, Escalate on breach
2. **SI_AMT_SEQUENTIAL** — Sequential 2-step (Branch Manager 8h → Finance Approver 48h), Maker-Checker off
3. **CAPEX_COMMITTEE** — Committee 3-step, finance/capex_request, Department Head 72h, Trigger: on_amount_exceeds

### Workflow Designer
1. **New Workflow Created**: "Delivery Fulfilment Process" — Operational Task Process, logistics module, on manual start trigger
2. **Nodes Added**: Human Task, Decision Gateway, Notification, Timer
3. **Search & Filter**: Category filtering ✅, text search ✅
4. **Existing Workflows**: Correctly displays 4 seed + 1 new workflow with proper canvas visualization

---

## Positive Observations

1. **Conditional Rendering Works**: Charge form correctly switches between Percentage/Fixed Amount/Formula/Slab fields based on calculation method selection
2. **Dynamic Slab Table**: Adding/removing slab rows works with proper From/To/Value/Type columns
3. **Tax Group Filtering by Regime**: When TDS regime was selected, additional options appeared in the Tax Group dropdown
4. **Multi-step Approval Builder**: Dynamic addition of approval steps with independent resolver/SLA/escalation/action configuration
5. **Dependency Chips Updated Live**: Newly created calculations appear immediately in the "Depends On" chip list for subsequent calculations
6. **Workflow List Stats Update**: Counter updates from "4 workflows" to "5 workflows" after creation
7. **All Success Toasts Work**: Every form except Workflow Save Version shows clear "Rule/Calculation/Policy saved!" confirmation
8. **Form Reset After Navigation**: Fresh form appears on each re-navigation (no stale data)
9. **Default Values Sensible**: Precision defaults to 2, Priority to 10, Rounding to Round Half Up
10. **All 7 form types compile and render without errors**: No runtime crashes during testing
