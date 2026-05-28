/**
 * Accounting Rules — Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  ACCOUNTING_EVENTS,
  SUB_LEDGER_TYPES,
  validateAccountingRule,
  validatePostingBalance,
} from '../../metadata/accounting-rules-definition';
import type { AccountingRuleDefinition, PostingIntent } from '../../metadata/accounting-rules-definition';

describe('Accounting Rules Definition', () => {
  describe('Constants', () => {
    it('defines accounting events', () => {
      expect(ACCOUNTING_EVENTS.length).toBeGreaterThanOrEqual(9);
      expect(ACCOUNTING_EVENTS).toContain('sale_invoice_created');
      expect(ACCOUNTING_EVENTS).toContain('purchase_invoice_created');
    });

    it('defines sub-ledger types', () => {
      expect(SUB_LEDGER_TYPES).toContain('customer');
      expect(SUB_LEDGER_TYPES).toContain('supplier');
      expect(SUB_LEDGER_TYPES).toContain('bank');
    });
  });

  describe('validateAccountingRule', () => {
    const validRule: AccountingRuleDefinition = {
      id: 'acr-1',
      ruleVersionId: 'rv-1',
      familyId: 'rf-1',
      name: 'Sale Invoice Posting',
      entityType: 'sale_invoice',
      event: 'sale_invoice_created',
      postingTemplateId: 'tpl-si',
      priority: 10,
      createdBy: 'admin',
      createdAt: '2026-01-01T00:00:00Z',
    };

    it('accepts a valid rule', () => {
      const result = validateAccountingRule(validRule);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('rejects missing id', () => {
      const result = validateAccountingRule({ ...validRule, id: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing name', () => {
      const result = validateAccountingRule({ ...validRule, name: '  ' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing entity type', () => {
      const result = validateAccountingRule({ ...validRule, entityType: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing event', () => {
      const result = validateAccountingRule({ ...validRule, event: '' as any });
      expect(result.valid).toBe(false);
    });

    it('rejects missing posting template', () => {
      const result = validateAccountingRule({ ...validRule, postingTemplateId: '' });
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePostingBalance', () => {
    it('detects balanced posting', () => {
      const intent: PostingIntent = {
        ruleId: 'r1', ruleVersionId: 'rv1', templateId: 'tpl1',
        event: 'sale_invoice_created',
        lines: [],
        totalDebit: 1000, totalCredit: 1000,
        isBalanced: true, traceId: 't1', executedAt: '2026-01-01',
      };
      const result = validatePostingBalance(intent);
      expect(result.balanced).toBe(true);
      expect(result.difference).toBe(0);
    });

    it('detects unbalanced posting', () => {
      const intent: PostingIntent = {
        ruleId: 'r1', ruleVersionId: 'rv1', templateId: 'tpl1',
        event: 'sale_invoice_created',
        lines: [],
        totalDebit: 1000.50, totalCredit: 999.49,
        isBalanced: false, traceId: 't1', executedAt: '2026-01-01',
      };
      const result = validatePostingBalance(intent);
      expect(result.balanced).toBe(false);
      expect(result.difference).toBe(1.01);
    });

    it('handles precision correctly', () => {
      const intent: PostingIntent = {
        ruleId: 'r1', ruleVersionId: 'rv1', templateId: 'tpl1',
        event: 'sale_invoice_created',
        lines: [],
        totalDebit: 100.005, totalCredit: 100.004,
        isBalanced: true, traceId: 't1', executedAt: '2026-01-01',
      };
      // With precision 2, both round to 100.00 - 100.00 = 0
      const result = validatePostingBalance(intent, 2);
      expect(result.balanced).toBe(true);
    });
  });
});
