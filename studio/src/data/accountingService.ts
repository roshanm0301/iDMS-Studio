/**
 * Accounting Rules — Mock Data Service
 */
import type { AccountingRuleDefinition, PostingTemplate, AccountingEvent } from '../metadata/accounting-rules-definition';

// ═══════════════════════════════════════════════════════════════
// Seed Posting Templates
// ═══════════════════════════════════════════════════════════════
const SEED_TEMPLATES: PostingTemplate[] = [
  {
    id: 'tpl-si', code: 'SI_POST', displayName: 'Sale Invoice Posting', event: 'sale_invoice_created',
    requiresBalancing: true, isActive: true,
    lines: [
      { id: 'pl-1', lineRole: 'receivable', entryType: 'debit', glAccountId: 'gl-1100', glAccountName: 'Trade Receivable', amountSource: 'net_amount', subLedgerType: 'customer', bankRequired: false, isMandatory: true },
      { id: 'pl-2', lineRole: 'sales_revenue', entryType: 'credit', glAccountId: 'gl-4000', glAccountName: 'Sales Revenue', amountSource: 'taxable_amount', bankRequired: false, isMandatory: true },
      { id: 'pl-3', lineRole: 'tax_output', entryType: 'credit', glAccountId: 'gl-2100', glAccountName: 'Tax Output Payable', amountSource: 'total_tax', bankRequired: false, isMandatory: true },
    ],
  },
  {
    id: 'tpl-pi', code: 'PI_POST', displayName: 'Purchase Invoice Posting', event: 'purchase_invoice_created',
    requiresBalancing: true, isActive: true,
    lines: [
      { id: 'pl-4', lineRole: 'purchase_expense', entryType: 'debit', glAccountId: 'gl-5000', glAccountName: 'Purchase Expense', amountSource: 'taxable_amount', bankRequired: false, isMandatory: true },
      { id: 'pl-5', lineRole: 'tax_input', entryType: 'debit', glAccountId: 'gl-1200', glAccountName: 'Tax Input Credit', amountSource: 'total_tax', bankRequired: false, isMandatory: true },
      { id: 'pl-6', lineRole: 'payable', entryType: 'credit', glAccountId: 'gl-2000', glAccountName: 'Trade Payable', amountSource: 'net_amount', subLedgerType: 'supplier', bankRequired: false, isMandatory: true },
    ],
  },
  {
    id: 'tpl-sr', code: 'SR_POST', displayName: 'Sale Return Posting', event: 'sale_return_created',
    requiresBalancing: true, isActive: true,
    lines: [
      { id: 'pl-7', lineRole: 'sales_return', entryType: 'debit', glAccountId: 'gl-4010', glAccountName: 'Sales Returns', amountSource: 'net_amount', bankRequired: false, isMandatory: true },
      { id: 'pl-8', lineRole: 'receivable', entryType: 'credit', glAccountId: 'gl-1100', glAccountName: 'Trade Receivable', amountSource: 'net_amount', subLedgerType: 'customer', bankRequired: false, isMandatory: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// Seed Accounting Rules
// ═══════════════════════════════════════════════════════════════
const SEED_RULES: AccountingRuleDefinition[] = [
  {
    id: 'acr-001', ruleVersionId: 'rv-acr-001', familyId: 'rf-acr-001',
    name: 'Sale Invoice Standard Posting',
    entityType: 'sale_invoice', event: 'sale_invoice_created',
    postingTemplateId: 'tpl-si', displayCondition: 'Default sale invoice posting',
    priority: 10, effectiveFrom: '2026-01-01',
    createdBy: 'finance_admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acr-002', ruleVersionId: 'rv-acr-002', familyId: 'rf-acr-002',
    name: 'Purchase Invoice Standard Posting',
    entityType: 'purchase_invoice', event: 'purchase_invoice_created',
    postingTemplateId: 'tpl-pi', displayCondition: 'Default purchase invoice posting',
    priority: 10, effectiveFrom: '2026-01-01',
    createdBy: 'finance_admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acr-003', ruleVersionId: 'rv-acr-003', familyId: 'rf-acr-003',
    name: 'Sale Return Standard Posting',
    entityType: 'sale_return', event: 'sale_return_created',
    postingTemplateId: 'tpl-sr', displayCondition: 'Default sale return posting',
    priority: 10, effectiveFrom: '2026-01-01',
    createdBy: 'finance_admin', createdAt: '2026-01-01T00:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════
let templates = [...SEED_TEMPLATES];
let rules = [...SEED_RULES];

// ═══════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════
export function getPostingTemplates(): PostingTemplate[] {
  return templates;
}

export function getPostingTemplateById(id: string): PostingTemplate | undefined {
  return templates.find(t => t.id === id);
}

export function getAccountingRules(filters?: { entityType?: string; event?: AccountingEvent; search?: string }): AccountingRuleDefinition[] {
  let results = rules;
  if (filters?.entityType) results = results.filter(r => r.entityType === filters.entityType);
  if (filters?.event) results = results.filter(r => r.event === filters.event);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(r => r.name.toLowerCase().includes(q) || (r.displayCondition || '').toLowerCase().includes(q));
  }
  return results;
}

export function getAccountingRuleById(id: string): AccountingRuleDefinition | undefined {
  return rules.find(r => r.id === id);
}

export function saveAccountingRule(rule: AccountingRuleDefinition): AccountingRuleDefinition {
  const idx = rules.findIndex(r => r.id === rule.id);
  if (idx >= 0) {
    rules = rules.map((r, i) => i === idx ? rule : r);
  } else {
    const saved = { ...rule, id: rule.id || `acr-${Date.now()}` };
    rules = [...rules, saved];
    return saved;
  }
  return rule;
}

export function getAccountingStats() {
  return {
    totalTemplates: templates.length,
    totalRules: rules.length,
    byEvent: Object.fromEntries(
      rules.reduce((acc, r) => {
        acc.set(r.event, (acc.get(r.event) || 0) + 1);
        return acc;
      }, new Map<string, number>()),
    ),
  };
}
