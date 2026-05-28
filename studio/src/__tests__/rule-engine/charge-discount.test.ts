/**
 * Charge & Discount Rules — Unit Tests
 *
 * Tests for: charge master validation, charge rule validation, slab resolution,
 * deviation checking
 */
import { describe, it, expect } from 'vitest';
import {
  validateChargeMaster,
  validateChargeRuleVersion,
  resolveSlabValue,
  checkDeviation,
  CHARGE_CATEGORIES,
  CALCULATION_METHODS,
  TAX_TIMINGS,
  CONFLICT_STRATEGIES,
  APPORTIONMENT_METHODS,
} from '../../metadata/charge-discount-definition';
import type { ChargeMaster, ChargeRuleVersion, SlabTier, DeviationPolicy } from '../../metadata/charge-discount-definition';

// ═══════════════════════════════════════════════════════════════
// Charge Master Validation
// ═══════════════════════════════════════════════════════════════
describe('validateChargeMaster', () => {
  const valid: ChargeMaster = {
    id: 'cm-test',
    code: 'FREIGHT',
    displayName: 'Freight',
    category: 'freight',
    defaultTaxability: 'taxable',
    defaultScope: 'header',
    isActive: true,
    allowedDocumentTypes: ['sale_invoice'],
  };

  it('validates correct master', () => {
    expect(validateChargeMaster(valid).valid).toBe(true);
  });

  it('rejects missing code', () => {
    const result = validateChargeMaster({ ...valid, code: '' });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Charge code is required.');
  });

  it('rejects missing display name', () => {
    const result = validateChargeMaster({ ...valid, displayName: '' });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Charge Rule Validation
// ═══════════════════════════════════════════════════════════════
describe('validateChargeRuleVersion', () => {
  const validRule: ChargeRuleVersion = {
    id: 'chg-test',
    ruleVersionId: 'rv-test',
    familyId: 'rf-test',
    chargeMasterId: 'cm-001',
    entityType: 'sale_invoice',
    scope: 'header',
    calculationMethod: 'fixed_amount',
    fixedAmount: 1500,
    taxTiming: 'pre_tax',
    taxability: 'taxable',
    priority: 10,
    sequence: 30,
    deviationPolicy: { editable: false, deviationType: 'none', requireReason: false },
    precision: 2,
    roundingMode: 'round_half_up',
    createdBy: 'test',
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('validates correct rule', () => {
    expect(validateChargeRuleVersion(validRule).valid).toBe(true);
  });

  it('rejects missing charge master', () => {
    const result = validateChargeRuleVersion({ ...validRule, chargeMasterId: '' });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Charge Master reference is required.');
  });

  it('rejects fixed_amount without value (CHG-CAL-006)', () => {
    const result = validateChargeRuleVersion({ ...validRule, fixedAmount: undefined });
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('CHG-CAL-006');
  });

  it('rejects percentage without base (CHG-CAL-007)', () => {
    const result = validateChargeRuleVersion({
      ...validRule,
      calculationMethod: 'percentage',
      percentage: 5,
      percentageBase: '',
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('CHG-CAL-007'))).toBe(true);
  });

  it('rejects formula without expression (CHG-CAL-008)', () => {
    const result = validateChargeRuleVersion({
      ...validRule,
      calculationMethod: 'formula',
      formulaExpression: '',
      formulaRef: undefined,
    });
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toContain('CHG-CAL-008');
  });

  it('rejects overlapping slabs (CHG-CAL-010)', () => {
    const result = validateChargeRuleVersion({
      ...validRule,
      calculationMethod: 'slab_tier',
      slabs: [
        { fromValue: 0, toValue: 100, calculationMethod: 'fixed_amount', value: 500 },
        { fromValue: 50, toValue: 200, calculationMethod: 'fixed_amount', value: 1000 }, // overlaps
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('CHG-CAL-010'))).toBe(true);
  });

  it('rejects editable with deviationType none', () => {
    const result = validateChargeRuleVersion({
      ...validRule,
      deviationPolicy: { editable: true, deviationType: 'none', requireReason: false },
    });
    expect(result.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Slab Resolution
// ═══════════════════════════════════════════════════════════════
describe('resolveSlabValue', () => {
  const slabs: SlabTier[] = [
    { fromValue: 0, toValue: 100000, calculationMethod: 'fixed_amount', value: 500 },
    { fromValue: 100001, toValue: 500000, calculationMethod: 'fixed_amount', value: 1500 },
    { fromValue: 500001, toValue: null, calculationMethod: 'percentage', value: 0.5 },
  ];

  it('resolves first slab (fixed amount)', () => {
    const result = resolveSlabValue(slabs, 50000);
    expect(result).toEqual({ amount: 500, slabIndex: 0 });
  });

  it('resolves middle slab', () => {
    const result = resolveSlabValue(slabs, 200000);
    expect(result).toEqual({ amount: 1500, slabIndex: 1 });
  });

  it('resolves open-ended slab (percentage)', () => {
    const result = resolveSlabValue(slabs, 600000);
    expect(result).toEqual({ amount: 3000, slabIndex: 2 });
  });

  it('resolves boundary value (exact toValue)', () => {
    const result = resolveSlabValue(slabs, 100000);
    expect(result).toEqual({ amount: 500, slabIndex: 0 });
  });

  it('returns null when no slab matches', () => {
    const gapSlabs: SlabTier[] = [
      { fromValue: 100, toValue: 200, calculationMethod: 'fixed_amount', value: 10 },
    ];
    expect(resolveSlabValue(gapSlabs, 50)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// Deviation Control — CHG-DEV-001 through CHG-DEV-008
// ═══════════════════════════════════════════════════════════════
describe('checkDeviation', () => {
  it('blocks non-editable charge (CHG-DEV-007)', () => {
    const policy: DeviationPolicy = { editable: false, deviationType: 'none', requireReason: false };
    const result = checkDeviation(policy, 1000, 1100);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('not editable');
  });

  it('allows within absolute limit', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'absolute_amount', maxDeviationValue: 200, requireReason: true };
    const result = checkDeviation(policy, 1000, 1100);
    expect(result.allowed).toBe(true);
  });

  it('blocks beyond absolute limit (CHG-DEV-003)', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'absolute_amount', maxDeviationValue: 50, requireReason: true };
    const result = checkDeviation(policy, 1000, 1100);
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('exceeds max');
  });

  it('allows within percentage limit', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'percentage', maxDeviationValue: 15, requireReason: false };
    const result = checkDeviation(policy, 1000, 1100); // 10% deviation
    expect(result.allowed).toBe(true);
  });

  it('blocks beyond percentage limit', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'percentage', maxDeviationValue: 5, requireReason: false };
    const result = checkDeviation(policy, 1000, 1100); // 10% deviation
    expect(result.allowed).toBe(false);
  });

  it('allows within min_max_range', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'min_max_range', minValue: 900, maxValue: 1200, requireReason: false };
    const result = checkDeviation(policy, 1000, 1100);
    expect(result.allowed).toBe(true);
  });

  it('blocks outside min_max_range', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'min_max_range', minValue: 900, maxValue: 1050, requireReason: false };
    const result = checkDeviation(policy, 1000, 1100);
    expect(result.allowed).toBe(false);
  });

  it('allows unrestricted_with_permission', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'unrestricted_with_permission', requireReason: false };
    const result = checkDeviation(policy, 1000, 5000);
    expect(result.allowed).toBe(true);
  });

  it('triggers approval when exceeds threshold (CHG-DEV-006)', () => {
    const policy: DeviationPolicy = { editable: true, deviationType: 'absolute_amount', maxDeviationValue: 500, requireReason: true, triggerApprovalThreshold: 100 };
    const result = checkDeviation(policy, 1000, 1200); // diff=200 > threshold 100
    expect(result.allowed).toBe(true);
    expect(result.requiresApproval).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Type Coverage
// ═══════════════════════════════════════════════════════════════
describe('charge type coverage', () => {
  it('has 11 charge categories', () => {
    expect(CHARGE_CATEGORIES).toHaveLength(11);
  });

  it('has 4 calculation methods', () => {
    expect(CALCULATION_METHODS).toHaveLength(4);
  });

  it('has 3 tax timings', () => {
    expect(TAX_TIMINGS).toHaveLength(3);
  });

  it('has 7 conflict strategies', () => {
    expect(CONFLICT_STRATEGIES).toHaveLength(7);
  });

  it('has 5 apportionment methods', () => {
    expect(APPORTIONMENT_METHODS).toHaveLength(5);
  });
});
