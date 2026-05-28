/**
 * Calculation Engine — Mock Data Service
 */
import type { CalculationDefinition, CalculationType } from '../metadata/calculation-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Seed Data — Standard commercial sequence (CALC-SEQ-006)
// ═══════════════════════════════════════════════════════════════
const SEED_CALCULATIONS: CalculationDefinition[] = [
  {
    id: 'calc-001',
    ruleVersionId: 'rv-calc-001',
    familyId: 'rf-calc-001',
    name: 'Base Amount',
    description: 'Line Quantity × Rate = Base Amount',
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: ['quantity', 'rate'],
    outputField: 'base_amount',
    formulaExpression: 'quantity * rate',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    sequenceGroup: 'commercial',
    sequenceOrder: 1,
    dependsOn: [],
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'calc-002',
    ruleVersionId: 'rv-calc-002',
    familyId: 'rf-calc-002',
    name: 'Discount Amount',
    description: 'Base Amount × Discount % / 100',
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: ['base_amount', 'discount_percentage'],
    outputField: 'discount_amount',
    formulaExpression: 'base_amount * discount_percentage / 100',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    sequenceGroup: 'commercial',
    sequenceOrder: 2,
    dependsOn: ['calc-001'],
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'calc-003',
    ruleVersionId: 'rv-calc-003',
    familyId: 'rf-calc-003',
    name: 'Discounted Base',
    description: 'Base Amount - Discount Amount',
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: ['base_amount', 'discount_amount'],
    outputField: 'discounted_base',
    formulaExpression: 'base_amount - discount_amount',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    sequenceGroup: 'commercial',
    sequenceOrder: 3,
    dependsOn: ['calc-001', 'calc-002'],
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'calc-004',
    ruleVersionId: 'rv-calc-004',
    familyId: 'rf-calc-004',
    name: 'Taxable Amount',
    description: 'Discounted Base + Pre-Tax Charges',
    calculationType: 'taxable_base',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: ['discounted_base', 'pre_tax_charges'],
    outputField: 'taxable_amount',
    formulaExpression: 'discounted_base + pre_tax_charges',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    sequenceGroup: 'commercial',
    sequenceOrder: 4,
    dependsOn: ['calc-003'],
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'calc-005',
    ruleVersionId: 'rv-calc-005',
    familyId: 'rf-calc-005',
    name: 'Net Amount',
    description: 'Taxable Amount + Tax Amount + Post-Tax Charges +/- Round-Off',
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_save',
    inputFields: ['taxable_amount', 'tax_amount', 'post_tax_charges', 'round_off'],
    outputField: 'net_amount',
    formulaExpression: 'taxable_amount + tax_amount + post_tax_charges + round_off',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'system_controlled',
    sequenceGroup: 'commercial',
    sequenceOrder: 6,
    dependsOn: ['calc-004'],
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'calc-006',
    ruleVersionId: 'rv-calc-006',
    familyId: 'rf-calc-006',
    name: 'Pending Invoice Qty',
    description: 'Source Order Qty - Already Invoiced Qty',
    calculationType: 'quantity_progress',
    entityType: 'sale_invoice',
    executionPoint: 'on_load',
    inputFields: ['source_order_qty', 'already_invoiced_qty'],
    outputField: 'pending_invoice_qty',
    formulaExpression: 'source_order_qty - already_invoiced_qty',
    precision: 3,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: [],
    createdBy: 'system',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'calc-007',
    ruleVersionId: 'rv-calc-007',
    familyId: 'rf-calc-007',
    name: 'Pending Delivery Qty',
    description: 'Invoice Qty - Already Delivered Qty',
    calculationType: 'quantity_progress',
    entityType: 'delivery',
    executionPoint: 'on_load',
    inputFields: ['invoice_qty', 'already_delivered_qty'],
    outputField: 'pending_delivery_qty',
    formulaExpression: 'invoice_qty - already_delivered_qty',
    precision: 3,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: [],
    createdBy: 'system',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'calc-008',
    ruleVersionId: 'rv-calc-008',
    familyId: 'rf-calc-008',
    name: 'Pending Receipt Qty',
    description: 'Ordered Qty - Already Received Qty',
    calculationType: 'quantity_progress',
    entityType: 'purchase_receipt',
    executionPoint: 'on_load',
    inputFields: ['ordered_qty', 'already_received_qty'],
    outputField: 'pending_receipt_qty',
    formulaExpression: 'ordered_qty - already_received_qty',
    precision: 3,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: [],
    createdBy: 'system',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'calc-009',
    ruleVersionId: 'rv-calc-009',
    familyId: 'rf-calc-009',
    name: 'Line Total (Aggregation)',
    description: 'Sum of line base amounts',
    calculationType: 'aggregation',
    entityType: 'sale_invoice',
    executionPoint: 'on_save',
    inputFields: ['line_base_amounts'],
    outputField: 'header_total_base',
    formulaExpression: 'SUM(line_base_amounts)',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'system_controlled',
    sequenceGroup: 'header_agg',
    sequenceOrder: 1,
    dependsOn: ['calc-001'],
    createdBy: 'system',
    createdAt: '2026-02-15T10:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════
let calculations = [...SEED_CALCULATIONS];
let nextId = 100;

// ═══════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════
export function getCalculations(filters?: {
  entityType?: string;
  calculationType?: CalculationType;
  search?: string;
}): CalculationDefinition[] {
  let results = calculations;
  if (filters?.entityType) {
    results = results.filter(c => c.entityType === filters.entityType);
  }
  if (filters?.calculationType) {
    results = results.filter(c => c.calculationType === filters.calculationType);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      c.outputField.toLowerCase().includes(q),
    );
  }
  return results;
}

export function getCalculationById(id: string): CalculationDefinition | undefined {
  return calculations.find(c => c.id === id);
}

export function saveCalculation(calc: CalculationDefinition): CalculationDefinition {
  const existing = calculations.findIndex(c => c.id === calc.id);
  if (existing >= 0) {
    calculations = calculations.map((c, i) => (i === existing ? calc : c));
  } else {
    const saved = { ...calc, id: calc.id || `calc-${String(nextId++).padStart(3, '0')}` };
    calculations = [...calculations, saved];
    return saved;
  }
  return calc;
}

export function deleteCalculation(id: string): boolean {
  const len = calculations.length;
  calculations = calculations.filter(c => c.id !== id);
  return calculations.length < len;
}

export function getCalculationStats() {
  return {
    total: calculations.length,
    byType: Object.fromEntries(
      (['amount', 'quantity_progress', 'aggregation', 'taxable_base', 'round_off', 'field_formula'] as CalculationType[]).map(
        t => [t, calculations.filter(c => c.calculationType === t).length],
      ),
    ),
    byEntity: {
      sale_invoice: calculations.filter(c => c.entityType === 'sale_invoice').length,
      delivery: calculations.filter(c => c.entityType === 'delivery').length,
      purchase_receipt: calculations.filter(c => c.entityType === 'purchase_receipt').length,
    },
  };
}
