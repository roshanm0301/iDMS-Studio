/**
 * Charge & Discount Rules — Metadata Types & Runtime
 *
 * Implements: CHG-MST-001 through CHG-MST-007, CHG-RUL-001 through CHG-RUL-010,
 * CHG-CAL-001 through CHG-CAL-015, CHG-SCP-001 through CHG-SCP-006,
 * CHG-TAX-001 through CHG-TAX-010, CHG-APP-001 through CHG-APP-007,
 * CHG-CNF-001 through CHG-CNF-007, CHG-SEQ-001 through CHG-SEQ-009,
 * CHG-DEV-001 through CHG-DEV-008
 */

// ═══════════════════════════════════════════════════════════════
// Charge Categories — CHG-MST-006
// ═══════════════════════════════════════════════════════════════
export const CHARGE_CATEGORIES = [
  'charge', 'discount', 'surcharge', 'fee', 'deduction',
  'freight', 'insurance', 'handling', 'restocking', 'depreciation', 'other',
] as const;
export type ChargeCategory = (typeof CHARGE_CATEGORIES)[number];

export const CHARGE_CATEGORY_LABELS: Record<ChargeCategory, string> = {
  charge: 'Charge',
  discount: 'Discount',
  surcharge: 'Surcharge',
  fee: 'Fee',
  deduction: 'Deduction',
  freight: 'Freight',
  insurance: 'Insurance',
  handling: 'Handling',
  restocking: 'Restocking',
  depreciation: 'Depreciation',
  other: 'Other',
};

// ═══════════════════════════════════════════════════════════════
// Charge Master — CHG-MST-001 through CHG-MST-007
// ═══════════════════════════════════════════════════════════════
export interface ChargeMaster {
  id: string;
  code: string;                           // CHG-MST-002
  displayName: string;
  category: ChargeCategory;
  defaultTaxability: 'taxable' | 'non_taxable';
  defaultScope: ChargeScope;
  isActive: boolean;
  allowedDocumentTypes: string[];
  tenantId?: string;                      // CHG-MST-007
}

// ═══════════════════════════════════════════════════════════════
// Calculation Methods — CHG-CAL-001 through CHG-CAL-015
// ═══════════════════════════════════════════════════════════════
export const CALCULATION_METHODS = [
  'fixed_amount',
  'percentage',
  'formula',
  'slab_tier',
] as const;
export type CalculationMethod = (typeof CALCULATION_METHODS)[number];

export const CALCULATION_METHOD_LABELS: Record<CalculationMethod, string> = {
  fixed_amount: 'Fixed Amount',
  percentage: 'Percentage',
  formula: 'Formula',
  slab_tier: 'Slab / Tier',
};

// ═══════════════════════════════════════════════════════════════
// Charge Scope — CHG-SCP-001 through CHG-SCP-006
// ═══════════════════════════════════════════════════════════════
export type ChargeScope = 'header' | 'line';

// ═══════════════════════════════════════════════════════════════
// Tax Timing — CHG-TAX-001 through CHG-TAX-010
// ═══════════════════════════════════════════════════════════════
export const TAX_TIMINGS = ['pre_tax', 'post_tax', 'non_tax_impacting'] as const;
export type TaxTiming = (typeof TAX_TIMINGS)[number];

export const TAX_TIMING_LABELS: Record<TaxTiming, string> = {
  pre_tax: 'Pre-Tax',
  post_tax: 'Post-Tax',
  non_tax_impacting: 'Non-Tax Impacting',
};

// ═══════════════════════════════════════════════════════════════
// Conflict Strategy — CHG-CNF-001 through CHG-CNF-007
// ═══════════════════════════════════════════════════════════════
export const CONFLICT_STRATEGIES = [
  'first_match',
  'apply_all',
  'highest_priority',
  'lowest_amount',
  'highest_amount',
  'manual_selection',
  'block_as_conflict',
] as const;
export type ConflictStrategy = (typeof CONFLICT_STRATEGIES)[number];

export const CONFLICT_STRATEGY_LABELS: Record<ConflictStrategy, string> = {
  first_match: 'First Match',
  apply_all: 'Apply All',
  highest_priority: 'Highest Priority',
  lowest_amount: 'Lowest Amount',
  highest_amount: 'Highest Amount',
  manual_selection: 'Manual Selection',
  block_as_conflict: 'Block as Conflict',
};

// ═══════════════════════════════════════════════════════════════
// Apportionment Methods — CHG-APP-001 through CHG-APP-007
// ═══════════════════════════════════════════════════════════════
export const APPORTIONMENT_METHODS = [
  'by_line_value',
  'by_quantity',
  'equal_split',
  'manual_allocation',
  'formula_based',
] as const;
export type ApportionmentMethod = (typeof APPORTIONMENT_METHODS)[number];

export const APPORTIONMENT_METHOD_LABELS: Record<ApportionmentMethod, string> = {
  by_line_value: 'By Line Value',
  by_quantity: 'By Quantity',
  equal_split: 'Equal Split',
  manual_allocation: 'Manual Allocation',
  formula_based: 'Formula-Based',
};

// ═══════════════════════════════════════════════════════════════
// Deviation Control — CHG-DEV-001 through CHG-DEV-008
// ═══════════════════════════════════════════════════════════════
export const DEVIATION_TYPES = [
  'none',
  'absolute_amount',
  'percentage',
  'min_max_range',
  'unrestricted_with_permission',
] as const;
export type DeviationType = (typeof DEVIATION_TYPES)[number];

export interface DeviationPolicy {
  editable: boolean;                       // CHG-DEV-001
  deviationType: DeviationType;            // CHG-DEV-002
  maxDeviationValue?: number;              // For absolute or percentage
  minValue?: number;                       // For min_max_range
  maxValue?: number;                       // For min_max_range
  requireReason: boolean;                  // CHG-DEV-005
  triggerApprovalThreshold?: number;       // CHG-DEV-006
}

// ═══════════════════════════════════════════════════════════════
// Slab/Tier — CHG-CAL-004, CHG-CAL-009 through CHG-CAL-011
// ═══════════════════════════════════════════════════════════════
export interface SlabTier {
  fromValue: number;
  toValue: number | null;                  // null = open-ended
  calculationMethod: 'fixed_amount' | 'percentage';
  value: number;
}

// ═══════════════════════════════════════════════════════════════
// Charge Rule Version — CHG-RUL-004
// ═══════════════════════════════════════════════════════════════
export interface ChargeRuleVersion {
  id: string;
  ruleVersionId: string;
  familyId: string;
  chargeMasterId: string;                  // CHG-MST-001

  // Scope
  entityType: string;
  documentType?: string;
  scope: ChargeScope;                      // CHG-SCP

  // Applicability
  conditionRef?: string;                   // CHG-CON-001 — links to ConditionTree
  displayCondition?: string;               // CHG-RUL-010

  // Calculation
  calculationMethod: CalculationMethod;    // CHG-CAL-005
  fixedAmount?: number;                    // CHG-CAL-006
  percentage?: number;                     // CHG-CAL-007
  percentageBase?: string;                 // Field used as base for percentage
  formulaRef?: string;                     // CHG-CAL-008
  formulaExpression?: string;
  slabs?: SlabTier[];                      // CHG-CAL-009

  // Tax interaction
  taxTiming: TaxTiming;                    // CHG-TAX-001
  taxability: 'taxable' | 'non_taxable';   // CHG-TAX-005/008

  // Sequence & Priority
  priority: number;                        // CHG-SEQ-001
  sequence: number;                        // CHG-SEQ-002

  // Conflict handling
  conflictStrategy?: ConflictStrategy;     // CHG-CNF-001

  // Apportionment (header charges)
  apportionmentMethod?: ApportionmentMethod; // CHG-APP-001

  // Deviation
  deviationPolicy: DeviationPolicy;        // CHG-DEV

  // Precision
  precision: number;
  roundingMode: 'round_half_up' | 'round_down' | 'round_up';

  // Effective dating
  effectiveFrom?: string;
  effectiveTo?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Applied Charge Snapshot — CHG-DATA-009/010
// ═══════════════════════════════════════════════════════════════
export interface AppliedChargeSnapshot {
  chargeCode: string;
  ruleVersionId: string;
  chargeMasterId: string;
  sourceAmount: number;                    // Base amount used for calculation
  calculatedAmount: number;                // Raw calculated
  roundedAmount: number;                   // After precision/rounding
  editedAmount?: number;                   // If user edited
  editReason?: string;
  taxTiming: TaxTiming;
  taxability: 'taxable' | 'non_taxable';
  scope: ChargeScope;
  apportionment?: { lineRef: string; amount: number }[];
  traceRef: string;
}

// ═══════════════════════════════════════════════════════════════
// Runtime Execution Result — CHG-RUN-007
// ═══════════════════════════════════════════════════════════════
export interface ChargeExecutionResult {
  appliedCharges: AppliedChargeSnapshot[];
  skippedRules: { ruleId: string; reason: string }[];
  warnings: string[];
  errors: string[];
  conflictDetails: { chargeMasterId: string; matchedRules: string[]; strategy: ConflictStrategy; resolved: string }[];
  traceId: string;
  executedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════

export function validateChargeMaster(master: ChargeMaster): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!master.id) issues.push('Charge Master ID is required.');
  if (!master.code || master.code.trim().length === 0) issues.push('Charge code is required.');
  if (!master.displayName) issues.push('Display name is required.');
  if (!CHARGE_CATEGORIES.includes(master.category)) issues.push('Invalid charge category.');
  return { valid: issues.length === 0, issues };
}

export function validateChargeRuleVersion(rule: ChargeRuleVersion): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!rule.id) issues.push('Charge rule version ID is required.');
  if (!rule.chargeMasterId) issues.push('Charge Master reference is required.');
  if (!rule.entityType) issues.push('Entity type is required.');

  // CHG-CAL-005: calculation method mandatory
  if (!rule.calculationMethod) issues.push('Calculation method is required.');

  // Method-specific validation
  if (rule.calculationMethod === 'fixed_amount' && (rule.fixedAmount === undefined || rule.fixedAmount === null)) {
    issues.push('Fixed amount value is required for fixed amount method (CHG-CAL-006).');
  }
  if (rule.calculationMethod === 'percentage') {
    if (rule.percentage === undefined || rule.percentage === null) {
      issues.push('Percentage value is required (CHG-CAL-007).');
    }
    if (!rule.percentageBase) {
      issues.push('Percentage base field is required (CHG-CAL-007).');
    }
  }
  if (rule.calculationMethod === 'formula' && !rule.formulaExpression && !rule.formulaRef) {
    issues.push('Formula expression or reference is required (CHG-CAL-008).');
  }
  if (rule.calculationMethod === 'slab_tier') {
    if (!rule.slabs || rule.slabs.length === 0) {
      issues.push('At least one slab/tier is required (CHG-CAL-009).');
    } else {
      // CHG-CAL-010: Check for overlapping slabs
      const sorted = [...rule.slabs].sort((a, b) => a.fromValue - b.fromValue);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        if (prev.toValue !== null && sorted[i].fromValue <= prev.toValue) {
          issues.push(`Slab ranges overlap at index ${i} (CHG-CAL-010).`);
          break;
        }
      }
    }
  }

  // CHG-TAX-007: tax-affecting charge must have taxability
  if (rule.taxTiming === 'pre_tax' && !rule.taxability) {
    issues.push('Tax-affecting charge must specify taxability (CHG-TAX-007).');
  }

  // CHG-DEV-007: system-controlled cannot be editable
  if (rule.deviationPolicy.editable && rule.deviationPolicy.deviationType === 'none') {
    issues.push('Editable charge must specify a deviation type.');
  }

  return { valid: issues.length === 0, issues };
}

// ═══════════════════════════════════════════════════════════════
// Slab resolution
// ═══════════════════════════════════════════════════════════════
export function resolveSlabValue(slabs: SlabTier[], inputValue: number): { amount: number; slabIndex: number } | null {
  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];
    const inRange = inputValue >= slab.fromValue && (slab.toValue === null || inputValue <= slab.toValue);
    if (inRange) {
      const amount = slab.calculationMethod === 'fixed_amount'
        ? slab.value
        : inputValue * slab.value / 100;
      return { amount, slabIndex: i };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Deviation Checker — CHG-DEV-003
// ═══════════════════════════════════════════════════════════════
export function checkDeviation(
  policy: DeviationPolicy,
  calculatedAmount: number,
  editedAmount: number,
): { allowed: boolean; requiresApproval: boolean; message?: string } {
  if (!policy.editable) {
    return { allowed: false, requiresApproval: false, message: 'Charge is not editable (CHG-DEV-007).' };
  }
  if (policy.deviationType === 'unrestricted_with_permission') {
    return { allowed: true, requiresApproval: false };
  }

  const diff = Math.abs(editedAmount - calculatedAmount);

  if (policy.deviationType === 'absolute_amount') {
    if (diff > (policy.maxDeviationValue ?? 0)) {
      return { allowed: false, requiresApproval: false, message: `Deviation ${diff} exceeds max allowed ${policy.maxDeviationValue}.` };
    }
  }

  if (policy.deviationType === 'percentage') {
    const pctDiff = calculatedAmount !== 0 ? (diff / Math.abs(calculatedAmount)) * 100 : 0;
    if (pctDiff > (policy.maxDeviationValue ?? 0)) {
      return { allowed: false, requiresApproval: false, message: `Deviation ${pctDiff.toFixed(1)}% exceeds max allowed ${policy.maxDeviationValue}%.` };
    }
  }

  if (policy.deviationType === 'min_max_range') {
    if (editedAmount < (policy.minValue ?? -Infinity) || editedAmount > (policy.maxValue ?? Infinity)) {
      return { allowed: false, requiresApproval: false, message: `Edited amount ${editedAmount} outside allowed range [${policy.minValue}, ${policy.maxValue}].` };
    }
  }

  // Check approval threshold
  const requiresApproval = policy.triggerApprovalThreshold !== undefined &&
    diff > policy.triggerApprovalThreshold;

  return { allowed: true, requiresApproval };
}
