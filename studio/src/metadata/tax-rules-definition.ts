/**
 * Tax Rules — Metadata Types
 *
 * Implements: TAX-REG-001 through TAX-REG-010, TAX-GRP-001 through TAX-GRP-010,
 * TAX-RATE-001 through TAX-RATE-010, TAX-RUL-001 through TAX-RUL-015,
 * TAX-GST-001 through TAX-GST-012, TAX-INT-001 through TAX-INT-008
 */

// ═══════════════════════════════════════════════════════════════
// Tax Regimes — TAX-REG
// ═══════════════════════════════════════════════════════════════
export const TAX_REGIMES = ['gst', 'vat', 'tds', 'tcs', 'withholding', 'custom'] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  gst: 'GST (India)',
  vat: 'VAT',
  tds: 'TDS',
  tcs: 'TCS',
  withholding: 'Withholding Tax',
  custom: 'Custom Duty',
};

// ═══════════════════════════════════════════════════════════════
// Tax Treatments — TAX-RUL-014
// ═══════════════════════════════════════════════════════════════
export const TAX_TREATMENTS = [
  'taxable', 'exempt', 'nil_rated', 'zero_rated',
  'reverse_charge', 'non_taxable', 'out_of_scope',
] as const;
export type TaxTreatment = (typeof TAX_TREATMENTS)[number];

export const TAX_TREATMENT_LABELS: Record<TaxTreatment, string> = {
  taxable: 'Taxable',
  exempt: 'Exempt',
  nil_rated: 'Nil Rated',
  zero_rated: 'Zero Rated',
  reverse_charge: 'Reverse Charge',
  non_taxable: 'Non-Taxable',
  out_of_scope: 'Out of Scope',
};

// ═══════════════════════════════════════════════════════════════
// Supply Types — TAX-POS
// ═══════════════════════════════════════════════════════════════
export const SUPPLY_TYPES = [
  'intra_state', 'inter_state', 'import', 'export',
  'local', 'cross_border',
] as const;
export type SupplyType = (typeof SUPPLY_TYPES)[number];

// ═══════════════════════════════════════════════════════════════
// Tax Component Types — TAX-GRP-009
// ═══════════════════════════════════════════════════════════════
export const COMPONENT_NATURES = [
  'payable', 'receivable', 'withholding', 'recoverable',
  'non_recoverable', 'reporting_only', 'reference',
] as const;
export type ComponentNature = (typeof COMPONENT_NATURES)[number];

// ═══════════════════════════════════════════════════════════════
// Tax Component — TAX-GRP-004
// ═══════════════════════════════════════════════════════════════
export interface TaxComponent {
  id: string;
  code: string;
  displayName: string;
  regime: TaxRegime;
  calculationOrder: number;
  nature: ComponentNature;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Tax Group — TAX-GRP-001 through TAX-GRP-010
// ═══════════════════════════════════════════════════════════════
export interface TaxGroup {
  id: string;
  code: string;
  displayName: string;
  regime: TaxRegime;
  components: string[];         // component IDs
  taxIncludedInPrice: boolean;  // TAX-GRP-008
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Tax Rate — TAX-RATE-001 through TAX-RATE-010
// ═══════════════════════════════════════════════════════════════
export interface TaxRate {
  id: string;
  componentId: string;
  regime: TaxRegime;
  rate: number;                 // Percentage
  effectiveFrom: string;
  effectiveTo?: string;
  hsnSac?: string;
  productCategory?: string;
  region?: string;
  country?: string;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Tax Rule — TAX-RUL-001 through TAX-RUL-015
// ═══════════════════════════════════════════════════════════════
export interface TaxRuleDefinition {
  id: string;
  ruleVersionId: string;
  familyId: string;
  name: string;
  description?: string;
  regime: TaxRegime;
  entityType: string;
  documentType?: string;

  // Condition — TAX-RUL-003
  conditionRef?: string;
  displayCondition?: string;    // TAX-RUL-015

  // Output — TAX-RUL-004
  outputTaxGroupId: string;
  outputTreatment: TaxTreatment;

  // Priority & Conflict — TAX-RUL-009/010
  priority: number;
  conflictStrategy?: 'highest_priority' | 'block_as_conflict';
  isDefault: boolean;           // TAX-RUL-011

  // Place of supply
  supplyType?: SupplyType;

  // Effective dating
  effectiveFrom?: string;
  effectiveTo?: string;

  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Tax Calculation Result
// ═══════════════════════════════════════════════════════════════
export interface TaxComponentResult {
  componentId: string;
  componentCode: string;
  rate: number;
  taxableBase: number;
  rawAmount: number;
  roundedAmount: number;
}

export interface TaxCalculationResult {
  ruleId: string;
  ruleVersionId: string;
  taxGroupId: string;
  treatment: TaxTreatment;
  supplyType?: SupplyType;
  components: TaxComponentResult[];
  totalTaxAmount: number;
  taxableBase: number;
  traceId: string;
  executedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════
export function validateTaxRule(rule: TaxRuleDefinition): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!rule.id) issues.push('Tax rule ID is required.');
  if (!rule.name || rule.name.trim().length === 0) issues.push('Tax rule name is required.');
  if (!rule.regime) issues.push('Tax regime is required.');
  if (!rule.entityType) issues.push('Entity type is required.');
  if (!rule.outputTaxGroupId) issues.push('Output tax group is required (TAX-RUL-008).');
  if (!rule.outputTreatment) issues.push('Output tax treatment is required (TAX-RUL-008).');
  if (!TAX_TREATMENTS.includes(rule.outputTreatment)) issues.push('Invalid tax treatment.');
  return { valid: issues.length === 0, issues };
}

export function validateTaxRate(rate: TaxRate): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!rate.id) issues.push('Tax rate ID is required.');
  if (!rate.componentId) issues.push('Component ID is required.');
  if (rate.rate < 0) issues.push('Tax rate cannot be negative.');
  if (!rate.effectiveFrom) issues.push('Effective-from date is required.');
  // TAX-RATE-004: check overlap would require full list — done at service level
  return { valid: issues.length === 0, issues };
}
