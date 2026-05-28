/**
 * Expression Engine — Mock Data Service
 *
 * Provides CRUD for conditions and formulas.
 * Also provides mock entity schema field catalog.
 */
import type {
  ConditionTree,
  FieldBinding,
  FormulaDefinition,
  ExpressionDataType,
} from '../metadata/expression-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Mock Entity Schema Fields (EXP-FLD-001)
// ═══════════════════════════════════════════════════════════════
export interface SchemaField {
  fieldId: string;
  fieldApiName: string;
  displayLabel: string;
  dataType: ExpressionDataType;
  entityType: string;
  documentType?: string;
  isRequired: boolean;
  isActive: boolean;
  description?: string;
  group?: string;
}

const SALE_INVOICE_FIELDS: SchemaField[] = [
  { fieldId: 'f-si-001', fieldApiName: 'invoice_number', displayLabel: 'Invoice Number', dataType: 'string', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-si-002', fieldApiName: 'invoice_date', displayLabel: 'Invoice Date', dataType: 'date', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-si-003', fieldApiName: 'customer_id', displayLabel: 'Customer', dataType: 'lookup', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-si-004', fieldApiName: 'customer_name', displayLabel: 'Customer Name', dataType: 'string', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Header' },
  { fieldId: 'f-si-005', fieldApiName: 'creation_mode', displayLabel: 'Creation Mode', dataType: 'enum', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Header', description: 'Manual, From Sale Order, From Delivery Note' },
  { fieldId: 'f-si-006', fieldApiName: 'source_order_id', displayLabel: 'Source Sale Order', dataType: 'lookup', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Header' },
  { fieldId: 'f-si-007', fieldApiName: 'source_status', displayLabel: 'Source Order Status', dataType: 'enum', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Header' },
  { fieldId: 'f-si-008', fieldApiName: 'total_amount', displayLabel: 'Total Amount', dataType: 'money', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-009', fieldApiName: 'discount_percentage', displayLabel: 'Discount %', dataType: 'number', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-010', fieldApiName: 'discount_amount', displayLabel: 'Discount Amount', dataType: 'money', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-011', fieldApiName: 'base_amount', displayLabel: 'Base Amount', dataType: 'money', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-012', fieldApiName: 'tax_amount', displayLabel: 'Tax Amount', dataType: 'money', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-013', fieldApiName: 'pre_tax_charges', displayLabel: 'Pre-Tax Charges', dataType: 'money', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-014', fieldApiName: 'net_amount', displayLabel: 'Net Amount', dataType: 'money', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Totals' },
  { fieldId: 'f-si-015', fieldApiName: 'invoice_qty', displayLabel: 'Invoice Quantity', dataType: 'quantity', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Lines' },
  { fieldId: 'f-si-016', fieldApiName: 'pending_invoice_qty', displayLabel: 'Pending Invoice Qty', dataType: 'quantity', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Lines' },
  { fieldId: 'f-si-017', fieldApiName: 'ordered_qty', displayLabel: 'Ordered Quantity', dataType: 'quantity', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Lines' },
  { fieldId: 'f-si-018', fieldApiName: 'already_invoiced_qty', displayLabel: 'Already Invoiced Qty', dataType: 'quantity', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Lines' },
  { fieldId: 'f-si-019', fieldApiName: 'place_of_supply', displayLabel: 'Place of Supply', dataType: 'string', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Tax' },
  { fieldId: 'f-si-020', fieldApiName: 'is_taxable', displayLabel: 'Is Taxable', dataType: 'boolean', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Tax' },
  { fieldId: 'f-si-021', fieldApiName: 'delivery_distance_km', displayLabel: 'Delivery Distance (km)', dataType: 'number', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Logistics' },
  { fieldId: 'f-si-022', fieldApiName: 'weight_kg', displayLabel: 'Weight (kg)', dataType: 'number', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Logistics' },
  { fieldId: 'f-si-023', fieldApiName: 'branch_id', displayLabel: 'Branch', dataType: 'lookup', entityType: 'sale_invoice', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-si-024', fieldApiName: 'due_date', displayLabel: 'Due Date', dataType: 'date', entityType: 'sale_invoice', isRequired: false, isActive: true, group: 'Header' },
];

const PURCHASE_RECEIPT_FIELDS: SchemaField[] = [
  { fieldId: 'f-pr-001', fieldApiName: 'receipt_number', displayLabel: 'Receipt Number', dataType: 'string', entityType: 'purchase_receipt', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-pr-002', fieldApiName: 'receipt_date', displayLabel: 'Receipt Date', dataType: 'date', entityType: 'purchase_receipt', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-pr-003', fieldApiName: 'vendor_id', displayLabel: 'Vendor', dataType: 'lookup', entityType: 'purchase_receipt', isRequired: true, isActive: true, group: 'Header' },
  { fieldId: 'f-pr-004', fieldApiName: 'receipt_qty', displayLabel: 'Receipt Quantity', dataType: 'quantity', entityType: 'purchase_receipt', isRequired: true, isActive: true, group: 'Lines' },
  { fieldId: 'f-pr-005', fieldApiName: 'ordered_qty', displayLabel: 'Ordered Quantity', dataType: 'quantity', entityType: 'purchase_receipt', isRequired: true, isActive: true, group: 'Lines' },
  { fieldId: 'f-pr-006', fieldApiName: 'po_number', displayLabel: 'PO Number', dataType: 'string', entityType: 'purchase_receipt', isRequired: true, isActive: true, group: 'Header' },
];

const ALL_FIELDS: SchemaField[] = [...SALE_INVOICE_FIELDS, ...PURCHASE_RECEIPT_FIELDS];

// ═══════════════════════════════════════════════════════════════
// Field Catalog API — EXP-API-005
// ═══════════════════════════════════════════════════════════════
export function getFieldsForEntity(entityType: string, _documentType?: string): SchemaField[] {
  return ALL_FIELDS.filter(f => f.entityType === entityType && f.isActive);
}

export function getFieldById(fieldId: string): SchemaField | undefined {
  return ALL_FIELDS.find(f => f.fieldId === fieldId);
}

export function fieldToBinding(field: SchemaField): FieldBinding {
  return {
    fieldId: field.fieldId,
    fieldApiName: field.fieldApiName,
    displayLabel: field.displayLabel,
    dataType: field.dataType,
    entityType: field.entityType,
    isRequired: field.isRequired,
    isActive: field.isActive,
  };
}

// ═══════════════════════════════════════════════════════════════
// Condition Storage
// ═══════════════════════════════════════════════════════════════
let conditions: ConditionTree[] = [
  {
    id: 'cond-001',
    entityType: 'sale_invoice',
    description: 'Customer field must be present',
    rootGroup: {
      id: 'grp-001',
      logic: 'AND',
      conditions: [
        {
          id: 'cn-001',
          fieldId: 'f-si-003',
          fieldApiName: 'customer_id',
          fieldLabel: 'Customer',
          dataType: 'lookup',
          operator: 'is_not_blank',
        },
      ],
      groups: [],
    },
  },
  {
    id: 'cond-003',
    entityType: 'sale_invoice',
    description: 'Source order eligibility condition',
    rootGroup: {
      id: 'grp-003',
      logic: 'AND',
      conditions: [
        {
          id: 'cn-003a',
          fieldId: 'f-si-005',
          fieldApiName: 'creation_mode',
          fieldLabel: 'Creation Mode',
          dataType: 'enum',
          operator: 'equals',
          value: 'from_sale_order',
        },
        {
          id: 'cn-003b',
          fieldId: 'f-si-007',
          fieldApiName: 'source_status',
          fieldLabel: 'Source Order Status',
          dataType: 'enum',
          operator: 'equals',
          value: 'approved',
        },
        {
          id: 'cn-003c',
          fieldId: 'f-si-016',
          fieldApiName: 'pending_invoice_qty',
          fieldLabel: 'Pending Invoice Qty',
          dataType: 'quantity',
          operator: 'greater_than',
          value: 0,
        },
      ],
      groups: [],
    },
  },
  {
    id: 'cond-006',
    entityType: 'sale_invoice',
    description: 'Invoice approval required when amount > 100000 OR discount > 5%',
    rootGroup: {
      id: 'grp-006',
      logic: 'OR',
      conditions: [
        {
          id: 'cn-006a',
          fieldId: 'f-si-008',
          fieldApiName: 'total_amount',
          fieldLabel: 'Total Amount',
          dataType: 'money',
          operator: 'greater_than',
          value: 100000,
        },
        {
          id: 'cn-006b',
          fieldId: 'f-si-009',
          fieldApiName: 'discount_percentage',
          fieldLabel: 'Discount %',
          dataType: 'number',
          operator: 'greater_than',
          value: 5,
        },
      ],
      groups: [],
    },
  },
];

let formulas: FormulaDefinition[] = [
  {
    id: 'expr-002',
    expression: 'ordered_qty - already_invoiced_qty',
    tokens: [
      { type: 'field', value: 'ordered_qty', fieldId: 'f-si-017' },
      { type: 'operator', value: '-' },
      { type: 'field', value: 'already_invoiced_qty', fieldId: 'f-si-018' },
    ],
    outputType: 'quantity',
    entityType: 'sale_invoice',
    fieldBindings: [
      { fieldId: 'f-si-017', fieldApiName: 'ordered_qty', displayLabel: 'Ordered Quantity', dataType: 'quantity', entityType: 'sale_invoice', isRequired: true },
      { fieldId: 'f-si-018', fieldApiName: 'already_invoiced_qty', displayLabel: 'Already Invoiced Qty', dataType: 'quantity', entityType: 'sale_invoice', isRequired: true },
    ],
    description: 'Pending Invoice Quantity = Ordered Qty - Already Invoiced Qty',
  },
];

// ═══════════════════════════════════════════════════════════════
// Condition CRUD
// ═══════════════════════════════════════════════════════════════
export function getConditionById(conditionId: string): ConditionTree | undefined {
  return conditions.find(c => c.id === conditionId);
}

export function getConditionsForEntity(entityType: string): ConditionTree[] {
  return conditions.filter(c => c.entityType === entityType);
}

let nextCondId = 10;
export function saveCondition(tree: ConditionTree): ConditionTree {
  const existing = conditions.findIndex(c => c.id === tree.id);
  if (existing >= 0) {
    conditions = conditions.map((c, i) => (i === existing ? tree : c));
  } else {
    const saved = { ...tree, id: tree.id || `cond-${String(nextCondId++).padStart(3, '0')}` };
    conditions = [...conditions, saved];
    return saved;
  }
  return tree;
}

export function deleteCondition(conditionId: string): boolean {
  const len = conditions.length;
  conditions = conditions.filter(c => c.id !== conditionId);
  return conditions.length < len;
}

// ═══════════════════════════════════════════════════════════════
// Formula CRUD
// ═══════════════════════════════════════════════════════════════
export function getFormulaById(formulaId: string): FormulaDefinition | undefined {
  return formulas.find(f => f.id === formulaId);
}

export function getFormulasForEntity(entityType: string): FormulaDefinition[] {
  return formulas.filter(f => f.entityType === entityType);
}

let nextFormulaId = 10;
export function saveFormula(formula: FormulaDefinition): FormulaDefinition {
  const existing = formulas.findIndex(f => f.id === formula.id);
  if (existing >= 0) {
    formulas = formulas.map((f, i) => (i === existing ? formula : f));
  } else {
    const saved = { ...formula, id: formula.id || `expr-${String(nextFormulaId++).padStart(3, '0')}` };
    formulas = [...formulas, saved];
    return saved;
  }
  return formula;
}

export function deleteFormula(formulaId: string): boolean {
  const len = formulas.length;
  formulas = formulas.filter(f => f.id !== formulaId);
  return formulas.length < len;
}
