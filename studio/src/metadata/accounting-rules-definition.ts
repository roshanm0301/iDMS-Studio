/**
 * Accounting Rules — Metadata Types
 *
 * Implements: ACC-RUL-001 through ACC-RUL-010, ACC-EVT-001 through ACC-EVT-007,
 * ACC-TPL-001 through ACC-TPL-010, ACC-LIN-001 through ACC-LIN-010,
 * ACC-GL-001 through ACC-GL-010, ACC-BAL-001 through ACC-BAL-007,
 * ACC-SUB-001 through ACC-SUB-007
 */

// ═══════════════════════════════════════════════════════════════
// Transaction Events — ACC-EVT
// ═══════════════════════════════════════════════════════════════
export const ACCOUNTING_EVENTS = [
  'sale_invoice_created',
  'purchase_invoice_created',
  'sale_return_created',
  'purchase_return_created',
  'delivery_completed',
  'stock_transfer_outward',
  'stock_transfer_inward',
  'payment_received',
  'payment_made',
] as const;
export type AccountingEvent = (typeof ACCOUNTING_EVENTS)[number];

export const ACCOUNTING_EVENT_LABELS: Record<AccountingEvent, string> = {
  sale_invoice_created: 'Sale Invoice Created',
  purchase_invoice_created: 'Purchase Invoice Created',
  sale_return_created: 'Sale Return Created',
  purchase_return_created: 'Purchase Return Created',
  delivery_completed: 'Delivery Completed',
  stock_transfer_outward: 'Stock Transfer Outward',
  stock_transfer_inward: 'Stock Transfer Inward',
  payment_received: 'Payment Received',
  payment_made: 'Payment Made',
};

// ═══════════════════════════════════════════════════════════════
// Entry Types
// ═══════════════════════════════════════════════════════════════
export type EntryType = 'debit' | 'credit';

// ═══════════════════════════════════════════════════════════════
// Sub-Ledger Types — ACC-SUB-002
// ═══════════════════════════════════════════════════════════════
export const SUB_LEDGER_TYPES = [
  'customer', 'supplier', 'bank', 'employee',
  'product', 'branch', 'warehouse', 'cost_center', 'custom',
] as const;
export type SubLedgerType = (typeof SUB_LEDGER_TYPES)[number];

// ═══════════════════════════════════════════════════════════════
// Posting Line — ACC-LIN
// ═══════════════════════════════════════════════════════════════
export interface PostingLine {
  id: string;
  lineRole: string;             // e.g. "sales_revenue", "tax_output", "receivable"
  entryType: EntryType;         // ACC-LIN-002
  glAccountId: string;          // ACC-LIN-004
  glAccountName?: string;
  amountSource: string;         // ACC-AMT-002 — field ref or formula
  subLedgerType?: SubLedgerType; // ACC-LIN-007
  subLedgerRef?: string;
  bankRequired: boolean;        // ACC-LIN-008
  narrationTemplate?: string;   // ACC-LIN-009
  conditionRef?: string;        // ACC-LIN-006
  isMandatory: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Posting Template — ACC-TPL
// ═══════════════════════════════════════════════════════════════
export interface PostingTemplate {
  id: string;
  code: string;
  displayName: string;
  event: AccountingEvent;
  requiresBalancing: boolean;   // ACC-TPL-003
  lines: PostingLine[];
  isActive: boolean;
  tenantId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Accounting Rule — ACC-RUL
// ═══════════════════════════════════════════════════════════════
export interface AccountingRuleDefinition {
  id: string;
  ruleVersionId: string;
  familyId: string;
  name: string;
  description?: string;
  entityType: string;
  documentType?: string;
  event: AccountingEvent;

  // Scope
  organizationId?: string;
  businessUnitId?: string;
  branchId?: string;

  // Template
  postingTemplateId: string;

  // Conditions
  conditionRef?: string;
  displayCondition?: string;

  // Priority & Conflict
  priority: number;

  // Effective dating
  effectiveFrom?: string;
  effectiveTo?: string;

  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Posting Intent (output) — ACC-BAL
// ═══════════════════════════════════════════════════════════════
export interface PostingIntent {
  ruleId: string;
  ruleVersionId: string;
  templateId: string;
  event: AccountingEvent;
  lines: PostingIntentLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;          // ACC-BAL-001
  balanceError?: string;
  traceId: string;
  executedAt: string;
}

export interface PostingIntentLine {
  lineRole: string;
  entryType: EntryType;
  glAccountId: string;
  glAccountName: string;
  amount: number;
  subLedgerType?: SubLedgerType;
  subLedgerRef?: string;
  narration?: string;
}

// ═══════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════
export function validateAccountingRule(rule: AccountingRuleDefinition): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!rule.id) issues.push('Accounting rule ID is required.');
  if (!rule.name || rule.name.trim().length === 0) issues.push('Accounting rule name is required.');
  if (!rule.entityType) issues.push('Entity type is required.');
  if (!rule.event) issues.push('Accounting event is required.');
  if (!rule.postingTemplateId) issues.push('Posting template is required.');
  return { valid: issues.length === 0, issues };
}

export function validatePostingBalance(intent: PostingIntent, precision: number = 2): { balanced: boolean; difference: number } {
  const factor = Math.pow(10, precision);
  const diff = Math.round((intent.totalDebit - intent.totalCredit) * factor) / factor;
  return { balanced: Math.abs(diff) === 0, difference: diff };
}
