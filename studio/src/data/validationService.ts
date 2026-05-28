/**
 * Validation Engine — Mock Data Service
 */
import type {
  ValidationRuleConfig,
  ValidationCategory,
  ExecutionPoint,
  ValidationSeverity,
} from '../metadata/validation-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Seed Data
// ═══════════════════════════════════════════════════════════════
const SEED_VALIDATION_RULES: ValidationRuleConfig[] = [
  {
    id: 'vr-001',
    ruleVersionId: 'rv-001-v1',
    familyId: 'rf-001',
    category: 'field_mandatory',
    executionPoints: ['on_save', 'on_submit'],
    severity: 'block',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    conditionRef: 'cond-001',
    messageTemplate: 'Customer is required on {{document_type}}.',
    messageParams: ['document_type'],
    remediationHint: 'Select a customer from the lookup before saving.',
    nonOverridable: true,
    allowSeverityDowngrade: false,
    createdBy: 'system',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'vr-002',
    ruleVersionId: 'rv-003-v1',
    familyId: 'rf-003',
    category: 'source_eligibility',
    executionPoints: ['on_load', 'on_save'],
    severity: 'block',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    conditionRef: 'cond-003',
    messageTemplate: 'Source Sale Order must be Approved with pending qty > 0.',
    remediationHint: 'Ensure the Sale Order is committed and has pending invoice quantity.',
    nonOverridable: true,
    allowSeverityDowngrade: false,
    createdBy: 'system',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'vr-003',
    ruleVersionId: 'rv-008-v1',
    familyId: 'rf-008',
    category: 'quantity_cap',
    executionPoints: ['on_save'],
    severity: 'block',
    entityType: 'purchase_receipt',
    documentType: 'purchase_receipt',
    conditionRef: 'cond-008',
    messageTemplate: 'Receipt quantity ({{receipt_qty}}) cannot exceed ordered quantity ({{ordered_qty}}).',
    messageParams: ['receipt_qty', 'ordered_qty'],
    nonOverridable: true,
    allowSeverityDowngrade: false,
    createdBy: 'system',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'vr-004',
    ruleVersionId: 'rv-001-v1',
    familyId: 'rf-001',
    category: 'conditional_mandatory',
    executionPoints: ['on_change', 'on_save'],
    severity: 'block',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    messageTemplate: 'Source Sale Order is required when Creation Mode is "From Sale Order".',
    remediationHint: 'Select a valid source Sale Order.',
    nonOverridable: false,
    allowSeverityDowngrade: false,
    createdBy: 'system',
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'vr-005',
    ruleVersionId: 'rv-001-v1',
    familyId: 'rf-001',
    category: 'lifecycle_status',
    executionPoints: ['on_load', 'on_save'],
    severity: 'block',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    messageTemplate: 'Document is in read-only status "{{status}}". Editing is not allowed.',
    messageParams: ['status'],
    nonOverridable: true,
    allowSeverityDowngrade: false,
    createdBy: 'system',
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'vr-006',
    ruleVersionId: 'rv-001-v1',
    familyId: 'rf-001',
    category: 'stale_data',
    executionPoints: ['on_save'],
    severity: 'block',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    messageTemplate: 'Data has been modified by another user since you loaded it. Please reload and retry.',
    remediationHint: 'Reload the document to get the latest data.',
    nonOverridable: true,
    allowSeverityDowngrade: false,
    createdBy: 'system',
    createdAt: '2026-02-12T08:00:00Z',
  },
  {
    id: 'vr-007',
    ruleVersionId: 'rv-001-v1',
    familyId: 'rf-001',
    category: 'data_type',
    executionPoints: ['on_change'],
    severity: 'warning',
    entityType: 'sale_invoice',
    documentType: 'sale_invoice',
    messageTemplate: 'Discount percentage should not exceed 100%.',
    nonOverridable: false,
    allowSeverityDowngrade: true,
    createdBy: 'commercial_admin',
    createdAt: '2026-03-01T10:00:00Z',
  },
];

// ═══════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════
let validationRules = [...SEED_VALIDATION_RULES];
let nextId = 100;

// ═══════════════════════════════════════════════════════════════
// Service API
// ═══════════════════════════════════════════════════════════════
export function getValidationRules(filters?: {
  entityType?: string;
  category?: ValidationCategory;
  executionPoint?: ExecutionPoint;
  severity?: ValidationSeverity;
  search?: string;
}): ValidationRuleConfig[] {
  let results = validationRules;

  if (filters?.entityType) {
    results = results.filter(r => r.entityType === filters.entityType);
  }
  if (filters?.category) {
    results = results.filter(r => r.category === filters.category);
  }
  if (filters?.executionPoint) {
    results = results.filter(r => r.executionPoints.includes(filters.executionPoint!));
  }
  if (filters?.severity) {
    results = results.filter(r => r.severity === filters.severity);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(r =>
      r.messageTemplate.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q),
    );
  }

  return results;
}

export function getValidationRuleById(id: string): ValidationRuleConfig | undefined {
  return validationRules.find(r => r.id === id);
}

export function saveValidationRule(config: ValidationRuleConfig): ValidationRuleConfig {
  const existing = validationRules.findIndex(r => r.id === config.id);
  if (existing >= 0) {
    validationRules = validationRules.map((r, i) => (i === existing ? config : r));
  } else {
    const saved = { ...config, id: config.id || `vr-${String(nextId++).padStart(3, '0')}` };
    validationRules = [...validationRules, saved];
    return saved;
  }
  return config;
}

export function deleteValidationRule(id: string): boolean {
  const len = validationRules.length;
  validationRules = validationRules.filter(r => r.id !== id);
  return validationRules.length < len;
}

export function getValidationStats() {
  return {
    total: validationRules.length,
    byCategory: Object.fromEntries(
      (['field_mandatory', 'conditional_mandatory', 'source_eligibility', 'quantity_cap', 'lifecycle_status', 'stale_data', 'data_type'] as ValidationCategory[]).map(
        cat => [cat, validationRules.filter(r => r.category === cat).length],
      ),
    ),
    bySeverity: {
      block: validationRules.filter(r => r.severity === 'block').length,
      warning: validationRules.filter(r => r.severity === 'warning').length,
      info: validationRules.filter(r => r.severity === 'info').length,
    },
    nonOverridable: validationRules.filter(r => r.nonOverridable).length,
  };
}
