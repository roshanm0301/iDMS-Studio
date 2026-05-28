/**
 * Tax Rules — Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  TAX_REGIMES,
  TAX_TREATMENTS,
  SUPPLY_TYPES,
  COMPONENT_NATURES,
  validateTaxRule,
  validateTaxRate,
} from '../../metadata/tax-rules-definition';
import type { TaxRuleDefinition, TaxRate } from '../../metadata/tax-rules-definition';

describe('Tax Rules Definition', () => {
  describe('Constants', () => {
    it('defines all 6 tax regimes', () => {
      expect(TAX_REGIMES).toHaveLength(6);
      expect(TAX_REGIMES).toContain('gst');
      expect(TAX_REGIMES).toContain('vat');
    });

    it('defines 7 tax treatments', () => {
      expect(TAX_TREATMENTS).toHaveLength(7);
      expect(TAX_TREATMENTS).toContain('taxable');
      expect(TAX_TREATMENTS).toContain('exempt');
      expect(TAX_TREATMENTS).toContain('reverse_charge');
    });

    it('defines supply types', () => {
      expect(SUPPLY_TYPES.length).toBeGreaterThanOrEqual(4);
      expect(SUPPLY_TYPES).toContain('intra_state');
      expect(SUPPLY_TYPES).toContain('inter_state');
    });

    it('defines component natures', () => {
      expect(COMPONENT_NATURES.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('validateTaxRule', () => {
    const validRule: TaxRuleDefinition = {
      id: 'tr-1',
      ruleVersionId: 'rv-1',
      familyId: 'rf-1',
      name: 'GST Standard',
      regime: 'gst',
      entityType: 'sale_invoice',
      outputTaxGroupId: 'tg-1',
      outputTreatment: 'taxable',
      priority: 10,
      isDefault: false,
      createdBy: 'admin',
      createdAt: '2026-01-01T00:00:00Z',
    };

    it('accepts a valid rule', () => {
      const result = validateTaxRule(validRule);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('rejects missing id', () => {
      const result = validateTaxRule({ ...validRule, id: '' });
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('ID'))).toBe(true);
    });

    it('rejects missing name', () => {
      const result = validateTaxRule({ ...validRule, name: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing regime', () => {
      const result = validateTaxRule({ ...validRule, regime: '' as any });
      expect(result.valid).toBe(false);
    });

    it('rejects missing entity type', () => {
      const result = validateTaxRule({ ...validRule, entityType: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing output tax group', () => {
      const result = validateTaxRule({ ...validRule, outputTaxGroupId: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing output treatment', () => {
      const result = validateTaxRule({ ...validRule, outputTreatment: '' as any });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTaxRate', () => {
    const validRate: TaxRate = {
      id: 'rate-1',
      componentId: 'comp-1',
      regime: 'GST',
      rate: 9,
      effectiveFrom: '2026-01-01',
      hsnSac: '8703',
      isActive: true,
    };

    it('accepts a valid rate', () => {
      const result = validateTaxRate(validRate);
      expect(result.valid).toBe(true);
    });

    it('rejects missing id', () => {
      const result = validateTaxRate({ ...validRate, id: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects negative rate', () => {
      const result = validateTaxRate({ ...validRate, rate: -5 });
      expect(result.valid).toBe(false);
    });

    it('allows rate above 100 (cess regimes)', () => {
      const result = validateTaxRate({ ...validRate, rate: 150 });
      expect(result.valid).toBe(true);
    });

    it('rejects missing component id', () => {
      const result = validateTaxRate({ ...validRate, componentId: '' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing effective date', () => {
      const result = validateTaxRate({ ...validRate, effectiveFrom: '' });
      expect(result.valid).toBe(false);
    });
  });
});
