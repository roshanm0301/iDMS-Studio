/**
 * Charge & Discount Rules — Mock Data Service
 */
import type { ChargeMaster, ChargeRuleVersion, ChargeCategory, CalculationMethod } from '../metadata/charge-discount-definition';

// ═══════════════════════════════════════════════════════════════
// Seed Charge Masters
// ═══════════════════════════════════════════════════════════════
const SEED_CHARGE_MASTERS: ChargeMaster[] = [
  { id: 'cm-001', code: 'FREIGHT', displayName: 'Freight', category: 'freight', defaultTaxability: 'taxable', defaultScope: 'header', isActive: true, allowedDocumentTypes: ['sale_invoice', 'purchase_receipt'] },
  { id: 'cm-002', code: 'INSURANCE', displayName: 'Insurance', category: 'insurance', defaultTaxability: 'taxable', defaultScope: 'header', isActive: true, allowedDocumentTypes: ['sale_invoice'] },
  { id: 'cm-003', code: 'HANDLING', displayName: 'Handling Charge', category: 'handling', defaultTaxability: 'taxable', defaultScope: 'line', isActive: true, allowedDocumentTypes: ['sale_invoice', 'delivery'] },
  { id: 'cm-004', code: 'DEALER_DISCOUNT', displayName: 'Dealer Scheme Discount', category: 'discount', defaultTaxability: 'taxable', defaultScope: 'header', isActive: true, allowedDocumentTypes: ['sale_invoice'] },
  { id: 'cm-005', code: 'RESTOCKING', displayName: 'Restocking Fee', category: 'restocking', defaultTaxability: 'non_taxable', defaultScope: 'line', isActive: true, allowedDocumentTypes: ['sale_return'] },
  { id: 'cm-006', code: 'PACKING', displayName: 'Packing Charge', category: 'charge', defaultTaxability: 'taxable', defaultScope: 'line', isActive: true, allowedDocumentTypes: ['sale_invoice', 'delivery'] },
];

// ═══════════════════════════════════════════════════════════════
// Seed Charge Rules
// ═══════════════════════════════════════════════════════════════
const SEED_CHARGE_RULES: ChargeRuleVersion[] = [
  {
    id: 'chg-001',
    ruleVersionId: 'rv-chg-001',
    familyId: 'rf-chg-001',
    chargeMasterId: 'cm-001',
    entityType: 'sale_invoice',
    scope: 'header',
    displayCondition: 'Delivery Mode = Transporter',
    conditionRef: 'cond-freight',
    calculationMethod: 'fixed_amount',
    fixedAmount: 1500,
    taxTiming: 'pre_tax',
    taxability: 'taxable',
    priority: 10,
    sequence: 30,
    deviationPolicy: { editable: true, deviationType: 'absolute_amount', maxDeviationValue: 500, requireReason: true },
    precision: 2,
    roundingMode: 'round_half_up',
    effectiveFrom: '2026-01-01',
    createdBy: 'commercial_admin',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'chg-002',
    ruleVersionId: 'rv-chg-002',
    familyId: 'rf-chg-002',
    chargeMasterId: 'cm-002',
    entityType: 'sale_invoice',
    scope: 'header',
    displayCondition: 'Invoice Value > 100,000',
    conditionRef: 'cond-insurance',
    calculationMethod: 'slab_tier',
    slabs: [
      { fromValue: 0, toValue: 100000, calculationMethod: 'fixed_amount', value: 500 },
      { fromValue: 100001, toValue: 500000, calculationMethod: 'fixed_amount', value: 1500 },
      { fromValue: 500001, toValue: null, calculationMethod: 'percentage', value: 0.5 },
    ],
    taxTiming: 'pre_tax',
    taxability: 'taxable',
    priority: 10,
    sequence: 40,
    deviationPolicy: { editable: false, deviationType: 'none', requireReason: false },
    precision: 2,
    roundingMode: 'round_half_up',
    effectiveFrom: '2026-01-01',
    createdBy: 'finance_admin',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'chg-003',
    ruleVersionId: 'rv-chg-003',
    familyId: 'rf-chg-003',
    chargeMasterId: 'cm-004',
    entityType: 'sale_invoice',
    scope: 'header',
    displayCondition: 'Customer Type = Dealer AND Base Amount >= 500,000',
    conditionRef: 'cond-dealer-disc',
    calculationMethod: 'percentage',
    percentage: 2,
    percentageBase: 'base_amount',
    taxTiming: 'pre_tax',
    taxability: 'taxable',
    priority: 20,
    sequence: 20,
    conflictStrategy: 'highest_priority',
    apportionmentMethod: 'by_line_value',
    deviationPolicy: { editable: true, deviationType: 'percentage', maxDeviationValue: 10, requireReason: true, triggerApprovalThreshold: 5 },
    precision: 2,
    roundingMode: 'round_half_up',
    effectiveFrom: '2026-01-01',
    createdBy: 'commercial_admin',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'chg-004',
    ruleVersionId: 'rv-chg-004',
    familyId: 'rf-chg-004',
    chargeMasterId: 'cm-005',
    entityType: 'sale_return',
    scope: 'line',
    displayCondition: 'Return Reason = Customer Changed Mind',
    conditionRef: 'cond-restock',
    calculationMethod: 'percentage',
    percentage: 5,
    percentageBase: 'return_line_amount',
    taxTiming: 'post_tax',
    taxability: 'non_taxable',
    priority: 10,
    sequence: 50,
    deviationPolicy: { editable: false, deviationType: 'none', requireReason: false },
    precision: 2,
    roundingMode: 'round_half_up',
    effectiveFrom: '2026-02-01',
    createdBy: 'commercial_admin',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'chg-005',
    ruleVersionId: 'rv-chg-005',
    familyId: 'rf-chg-005',
    chargeMasterId: 'cm-006',
    entityType: 'sale_invoice',
    scope: 'line',
    displayCondition: 'Product Category = Fragile',
    conditionRef: 'cond-packing',
    calculationMethod: 'formula',
    formulaExpression: 'quantity * 25',
    taxTiming: 'pre_tax',
    taxability: 'taxable',
    priority: 10,
    sequence: 35,
    deviationPolicy: { editable: false, deviationType: 'none', requireReason: false },
    precision: 2,
    roundingMode: 'round_half_up',
    effectiveFrom: '2026-01-01',
    createdBy: 'commercial_admin',
    createdAt: '2026-01-20T10:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════
let chargeMasters = [...SEED_CHARGE_MASTERS];
let chargeRules = [...SEED_CHARGE_RULES];
let nextMasterId = 100;
let nextRuleId = 100;

// ═══════════════════════════════════════════════════════════════
// Charge Master Service
// ═══════════════════════════════════════════════════════════════
export function getChargeMasters(filters?: { category?: ChargeCategory; active?: boolean }): ChargeMaster[] {
  let results = chargeMasters;
  if (filters?.category) results = results.filter(m => m.category === filters.category);
  if (filters?.active !== undefined) results = results.filter(m => m.isActive === filters.active);
  return results;
}

export function getChargeMasterById(id: string): ChargeMaster | undefined {
  return chargeMasters.find(m => m.id === id);
}

export function saveChargeMaster(master: ChargeMaster): ChargeMaster {
  const existing = chargeMasters.findIndex(m => m.id === master.id);
  if (existing >= 0) {
    chargeMasters = chargeMasters.map((m, i) => (i === existing ? master : m));
  } else {
    const saved = { ...master, id: master.id || `cm-${String(nextMasterId++).padStart(3, '0')}` };
    chargeMasters = [...chargeMasters, saved];
    return saved;
  }
  return master;
}

// ═══════════════════════════════════════════════════════════════
// Charge Rule Service
// ═══════════════════════════════════════════════════════════════
export function getChargeRules(filters?: {
  entityType?: string;
  calculationMethod?: CalculationMethod;
  category?: ChargeCategory;
  search?: string;
}): ChargeRuleVersion[] {
  let results = chargeRules;
  if (filters?.entityType) results = results.filter(r => r.entityType === filters.entityType);
  if (filters?.calculationMethod) results = results.filter(r => r.calculationMethod === filters.calculationMethod);
  if (filters?.category) {
    const masterIds = chargeMasters.filter(m => m.category === filters.category).map(m => m.id);
    results = results.filter(r => masterIds.includes(r.chargeMasterId));
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(r => {
      const master = chargeMasters.find(m => m.id === r.chargeMasterId);
      return (master?.displayName || '').toLowerCase().includes(q) ||
        (r.displayCondition || '').toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
    });
  }
  return results;
}

export function getChargeRuleById(id: string): ChargeRuleVersion | undefined {
  return chargeRules.find(r => r.id === id);
}

export function saveChargeRule(rule: ChargeRuleVersion): ChargeRuleVersion {
  const existing = chargeRules.findIndex(r => r.id === rule.id);
  if (existing >= 0) {
    chargeRules = chargeRules.map((r, i) => (i === existing ? rule : r));
  } else {
    const saved = { ...rule, id: rule.id || `chg-${String(nextRuleId++).padStart(3, '0')}` };
    chargeRules = [...chargeRules, saved];
    return saved;
  }
  return rule;
}

export function deleteChargeRule(id: string): boolean {
  const len = chargeRules.length;
  chargeRules = chargeRules.filter(r => r.id !== id);
  return chargeRules.length < len;
}

export function getChargeRuleStats() {
  return {
    totalMasters: chargeMasters.length,
    activeMasters: chargeMasters.filter(m => m.isActive).length,
    totalRules: chargeRules.length,
    byMethod: {
      fixed_amount: chargeRules.filter(r => r.calculationMethod === 'fixed_amount').length,
      percentage: chargeRules.filter(r => r.calculationMethod === 'percentage').length,
      formula: chargeRules.filter(r => r.calculationMethod === 'formula').length,
      slab_tier: chargeRules.filter(r => r.calculationMethod === 'slab_tier').length,
    },
    byTiming: {
      pre_tax: chargeRules.filter(r => r.taxTiming === 'pre_tax').length,
      post_tax: chargeRules.filter(r => r.taxTiming === 'post_tax').length,
      non_tax_impacting: chargeRules.filter(r => r.taxTiming === 'non_tax_impacting').length,
    },
  };
}
