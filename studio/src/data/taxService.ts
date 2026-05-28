/**
 * Tax Rules — Mock Data Service
 */
import type { TaxComponent, TaxGroup, TaxRate, TaxRuleDefinition, TaxRegime } from '../metadata/tax-rules-definition';

// ═══════════════════════════════════════════════════════════════
// Seed Tax Components (India GST)
// ═══════════════════════════════════════════════════════════════
const SEED_COMPONENTS: TaxComponent[] = [
  { id: 'tc-cgst', code: 'CGST', displayName: 'Central GST', regime: 'gst', calculationOrder: 1, nature: 'payable', isActive: true },
  { id: 'tc-sgst', code: 'SGST', displayName: 'State GST', regime: 'gst', calculationOrder: 2, nature: 'payable', isActive: true },
  { id: 'tc-igst', code: 'IGST', displayName: 'Integrated GST', regime: 'gst', calculationOrder: 1, nature: 'payable', isActive: true },
  { id: 'tc-cess', code: 'CESS', displayName: 'GST Cess', regime: 'gst', calculationOrder: 3, nature: 'payable', isActive: true },
  { id: 'tc-vat', code: 'VAT', displayName: 'Value Added Tax', regime: 'vat', calculationOrder: 1, nature: 'payable', isActive: true },
  { id: 'tc-tds', code: 'TDS', displayName: 'Tax Deducted at Source', regime: 'tds', calculationOrder: 1, nature: 'withholding', isActive: true },
];

// ═══════════════════════════════════════════════════════════════
// Seed Tax Groups
// ═══════════════════════════════════════════════════════════════
const SEED_GROUPS: TaxGroup[] = [
  { id: 'tg-gst-intra', code: 'GST_INTRA', displayName: 'CGST + SGST (Intra-State)', regime: 'gst', components: ['tc-cgst', 'tc-sgst'], taxIncludedInPrice: false, isActive: true },
  { id: 'tg-gst-inter', code: 'GST_INTER', displayName: 'IGST (Inter-State)', regime: 'gst', components: ['tc-igst'], taxIncludedInPrice: false, isActive: true },
  { id: 'tg-gst-exempt', code: 'GST_EXEMPT', displayName: 'GST Exempt', regime: 'gst', components: [], taxIncludedInPrice: false, isActive: true },
  { id: 'tg-gst-zero', code: 'GST_ZERO', displayName: 'Zero Rated (Export)', regime: 'gst', components: ['tc-igst'], taxIncludedInPrice: false, isActive: true },
  { id: 'tg-vat-standard', code: 'VAT_STD', displayName: 'Standard VAT', regime: 'vat', components: ['tc-vat'], taxIncludedInPrice: false, isActive: true },
];

// ═══════════════════════════════════════════════════════════════
// Seed Tax Rates
// ═══════════════════════════════════════════════════════════════
const SEED_RATES: TaxRate[] = [
  { id: 'tr-cgst-9', componentId: 'tc-cgst', regime: 'gst', rate: 9, effectiveFrom: '2017-07-01', hsnSac: '8703', isActive: true },
  { id: 'tr-sgst-9', componentId: 'tc-sgst', regime: 'gst', rate: 9, effectiveFrom: '2017-07-01', hsnSac: '8703', isActive: true },
  { id: 'tr-igst-18', componentId: 'tc-igst', regime: 'gst', rate: 18, effectiveFrom: '2017-07-01', hsnSac: '8703', isActive: true },
  { id: 'tr-cgst-6', componentId: 'tc-cgst', regime: 'gst', rate: 6, effectiveFrom: '2017-07-01', hsnSac: '8711', isActive: true },
  { id: 'tr-sgst-6', componentId: 'tc-sgst', regime: 'gst', rate: 6, effectiveFrom: '2017-07-01', hsnSac: '8711', isActive: true },
  { id: 'tr-igst-12', componentId: 'tc-igst', regime: 'gst', rate: 12, effectiveFrom: '2017-07-01', hsnSac: '8711', isActive: true },
  { id: 'tr-vat-5', componentId: 'tc-vat', regime: 'vat', rate: 5, effectiveFrom: '2020-01-01', isActive: true },
];

// ═══════════════════════════════════════════════════════════════
// Seed Tax Rules
// ═══════════════════════════════════════════════════════════════
const SEED_TAX_RULES: TaxRuleDefinition[] = [
  {
    id: 'txr-001', ruleVersionId: 'rv-txr-001', familyId: 'rf-txr-001',
    name: 'GST Intra-State (Seller = Buyer State)',
    regime: 'gst', entityType: 'sale_invoice',
    conditionRef: 'cond-intra-state',
    displayCondition: 'Seller State = Buyer State',
    outputTaxGroupId: 'tg-gst-intra', outputTreatment: 'taxable',
    priority: 10, isDefault: false, supplyType: 'intra_state',
    effectiveFrom: '2017-07-01', createdBy: 'tax_admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'txr-002', ruleVersionId: 'rv-txr-002', familyId: 'rf-txr-002',
    name: 'GST Inter-State (Seller ≠ Buyer State)',
    regime: 'gst', entityType: 'sale_invoice',
    conditionRef: 'cond-inter-state',
    displayCondition: 'Seller State ≠ Buyer State',
    outputTaxGroupId: 'tg-gst-inter', outputTreatment: 'taxable',
    priority: 10, isDefault: false, supplyType: 'inter_state',
    effectiveFrom: '2017-07-01', createdBy: 'tax_admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'txr-003', ruleVersionId: 'rv-txr-003', familyId: 'rf-txr-003',
    name: 'GST Exempt',
    regime: 'gst', entityType: 'sale_invoice',
    conditionRef: 'cond-exempt',
    displayCondition: 'Product Category = Exempt',
    outputTaxGroupId: 'tg-gst-exempt', outputTreatment: 'exempt',
    priority: 20, isDefault: false,
    effectiveFrom: '2017-07-01', createdBy: 'tax_admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'txr-004', ruleVersionId: 'rv-txr-004', familyId: 'rf-txr-004',
    name: 'GST Zero Rated (Export)',
    regime: 'gst', entityType: 'sale_invoice',
    conditionRef: 'cond-export',
    displayCondition: 'Supply Type = Export',
    outputTaxGroupId: 'tg-gst-zero', outputTreatment: 'zero_rated',
    priority: 30, isDefault: false, supplyType: 'export',
    effectiveFrom: '2017-07-01', createdBy: 'tax_admin', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'txr-005', ruleVersionId: 'rv-txr-005', familyId: 'rf-txr-005',
    name: 'Standard VAT 5%',
    regime: 'vat', entityType: 'sale_invoice',
    displayCondition: 'Default VAT rule',
    outputTaxGroupId: 'tg-vat-standard', outputTreatment: 'taxable',
    priority: 10, isDefault: true,
    effectiveFrom: '2020-01-01', createdBy: 'tax_admin', createdAt: '2026-01-01T00:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════
// In-memory stores
// ═══════════════════════════════════════════════════════════════
let components = [...SEED_COMPONENTS];
let groups = [...SEED_GROUPS];
let rates = [...SEED_RATES];
let taxRules = [...SEED_TAX_RULES];

// ═══════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════
export function getTaxComponents(regime?: TaxRegime): TaxComponent[] {
  return regime ? components.filter(c => c.regime === regime) : components;
}

export function getTaxGroups(regime?: TaxRegime): TaxGroup[] {
  return regime ? groups.filter(g => g.regime === regime) : groups;
}

export function getTaxRates(filters?: { componentId?: string; regime?: TaxRegime; hsnSac?: string }): TaxRate[] {
  let results = rates;
  if (filters?.componentId) results = results.filter(r => r.componentId === filters.componentId);
  if (filters?.regime) results = results.filter(r => r.regime === filters.regime);
  if (filters?.hsnSac) results = results.filter(r => r.hsnSac === filters.hsnSac);
  return results;
}

export function getTaxRules(filters?: { regime?: TaxRegime; entityType?: string; search?: string }): TaxRuleDefinition[] {
  let results = taxRules;
  if (filters?.regime) results = results.filter(r => r.regime === filters.regime);
  if (filters?.entityType) results = results.filter(r => r.entityType === filters.entityType);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(r => r.name.toLowerCase().includes(q) || (r.displayCondition || '').toLowerCase().includes(q));
  }
  return results;
}

export function getTaxRuleById(id: string): TaxRuleDefinition | undefined {
  return taxRules.find(r => r.id === id);
}

export function saveTaxRule(rule: TaxRuleDefinition): TaxRuleDefinition {
  const idx = taxRules.findIndex(r => r.id === rule.id);
  if (idx >= 0) {
    taxRules = taxRules.map((r, i) => i === idx ? rule : r);
  } else {
    const saved = { ...rule, id: rule.id || `tr-${Date.now()}` };
    taxRules = [...taxRules, saved];
    return saved;
  }
  return rule;
}

export function getTaxGroupById(id: string): TaxGroup | undefined {
  return groups.find(g => g.id === id);
}

export function getTaxStats() {
  return {
    totalComponents: components.length,
    totalGroups: groups.length,
    totalRates: rates.length,
    totalRules: taxRules.length,
    byRegime: {
      gst: taxRules.filter(r => r.regime === 'gst').length,
      vat: taxRules.filter(r => r.regime === 'vat').length,
      tds: taxRules.filter(r => r.regime === 'tds').length,
    },
    byTreatment: {
      taxable: taxRules.filter(r => r.outputTreatment === 'taxable').length,
      exempt: taxRules.filter(r => r.outputTreatment === 'exempt').length,
      zero_rated: taxRules.filter(r => r.outputTreatment === 'zero_rated').length,
    },
  };
}
