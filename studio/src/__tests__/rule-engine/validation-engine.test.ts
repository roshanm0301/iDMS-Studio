/**
 * Validation Engine — Unit Tests
 *
 * Tests for: validation config validation, message template rendering,
 * validation execution, severity handling
 */
import { describe, it, expect } from 'vitest';
import {
  validateValidationRuleConfig,
  renderMessageTemplate,
  executeValidations,
  VALIDATION_CATEGORIES,
  EXECUTION_POINTS,
} from '../../metadata/validation-engine-definition';
import type { ValidationRuleConfig } from '../../metadata/validation-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Config Validation
// ═══════════════════════════════════════════════════════════════
describe('validateValidationRuleConfig', () => {
  const validConfig: ValidationRuleConfig = {
    id: 'vr-test-001',
    ruleVersionId: 'rv-001',
    familyId: 'rf-001',
    category: 'field_mandatory',
    executionPoints: ['on_save'],
    severity: 'block',
    entityType: 'sale_invoice',
    messageTemplate: '{{field_label}} is required.',
    nonOverridable: true,
    allowSeverityDowngrade: false,
    createdBy: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('validates a correct config', () => {
    const result = validateValidationRuleConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects missing ID', () => {
    const result = validateValidationRuleConfig({ ...validConfig, id: '' });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Validation rule ID is required.');
  });

  it('rejects missing execution points', () => {
    const result = validateValidationRuleConfig({ ...validConfig, executionPoints: [] });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('At least one execution point is required.');
  });

  it('rejects missing message template', () => {
    const result = validateValidationRuleConfig({ ...validConfig, messageTemplate: '' });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Message template is required.');
  });

  it('rejects non-overridable with severity downgrade allowed', () => {
    const result = validateValidationRuleConfig({
      ...validConfig,
      nonOverridable: true,
      allowSeverityDowngrade: true,
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Non-overridable validations cannot allow severity downgrade.');
  });

  it('rejects non-overridable with non-block severity', () => {
    const result = validateValidationRuleConfig({
      ...validConfig,
      nonOverridable: true,
      severity: 'warning',
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Non-overridable validations must have "block" severity.');
  });
});

// ═══════════════════════════════════════════════════════════════
// Message Template Rendering
// ═══════════════════════════════════════════════════════════════
describe('renderMessageTemplate', () => {
  it('renders template with context values', () => {
    const result = renderMessageTemplate(
      'Customer {{customer_name}} has exceeded credit limit of {{limit}}.',
      { customer_name: 'Bajaj Auto', limit: 500000 },
    );
    expect(result).toBe('Customer Bajaj Auto has exceeded credit limit of 500000.');
  });

  it('renders placeholder for missing values', () => {
    const result = renderMessageTemplate(
      '{{field_label}} is required.',
      {},
    );
    expect(result).toBe('[field_label] is required.');
  });

  it('handles template with no placeholders', () => {
    const result = renderMessageTemplate('Static message.', { a: 1 });
    expect(result).toBe('Static message.');
  });
});

// ═══════════════════════════════════════════════════════════════
// Validation Execution
// ═══════════════════════════════════════════════════════════════
describe('executeValidations', () => {
  const configs: ValidationRuleConfig[] = [
    {
      id: 'vr-exec-1',
      ruleVersionId: 'rv-1',
      familyId: 'rf-1',
      category: 'field_mandatory',
      executionPoints: ['on_save'],
      severity: 'block',
      entityType: 'sale_invoice',
      conditionRef: 'cond-missing-customer',
      messageTemplate: 'Customer is required.',
      nonOverridable: true,
      allowSeverityDowngrade: false,
      createdBy: 'system',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'vr-exec-2',
      ruleVersionId: 'rv-2',
      familyId: 'rf-2',
      category: 'data_type',
      executionPoints: ['on_change', 'on_save'],
      severity: 'warning',
      entityType: 'sale_invoice',
      conditionRef: 'cond-high-discount',
      messageTemplate: 'Discount {{discount_percentage}}% is unusually high.',
      messageParams: ['discount_percentage'],
      nonOverridable: false,
      allowSeverityDowngrade: true,
      createdBy: 'admin',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'vr-exec-3',
      ruleVersionId: 'rv-3',
      familyId: 'rf-3',
      category: 'lifecycle_status',
      executionPoints: ['on_load'],
      severity: 'block',
      entityType: 'sale_invoice',
      messageTemplate: 'Document is in final status.',
      nonOverridable: true,
      allowSeverityDowngrade: false,
      createdBy: 'system',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockCondEvaluator = (condRef: string, _ctx: Record<string, unknown>): boolean => {
    // Simulate conditions
    if (condRef === 'cond-missing-customer') return true; // violation detected
    if (condRef === 'cond-high-discount') return true;    // violation detected
    return false;
  };

  it('executes only rules for the requested execution point', () => {
    const result = executeValidations(configs, 'on_save', {}, mockCondEvaluator);
    // on_save applies to vr-exec-1 and vr-exec-2 (not vr-exec-3 which is on_load)
    expect(result.results.length).toBe(2);
    expect(result.blockers.length).toBe(1);
    expect(result.warnings.length).toBe(1);
    expect(result.passed).toBe(false); // has blocker
  });

  it('passes when no blockers found', () => {
    const passingEval = () => false; // No violations
    const result = executeValidations(configs, 'on_save', {}, passingEval);
    expect(result.passed).toBe(true);
    expect(result.results.length).toBe(0);
  });

  it('skips rules where condition is not met', () => {
    const partialEval = (condRef: string) => condRef === 'cond-missing-customer';
    const result = executeValidations(configs, 'on_save', {}, partialEval);
    expect(result.results.length).toBe(1);
    expect(result.blockers[0].validationId).toBe('vr-exec-1');
  });

  it('includes rules with no condition (always triggers)', () => {
    // vr-exec-3 has no conditionRef — fires for on_load
    const result = executeValidations(configs, 'on_load', {}, () => false);
    expect(result.results.length).toBe(1);
    expect(result.blockers[0].validationId).toBe('vr-exec-3');
  });

  it('renders message with context values', () => {
    const result = executeValidations(configs, 'on_save', { discount_percentage: 25 }, mockCondEvaluator);
    const warningMsg = result.warnings[0]?.message;
    expect(warningMsg).toContain('25');
  });

  it('classifies results by severity correctly', () => {
    const result = executeValidations(configs, 'on_save', {}, mockCondEvaluator);
    expect(result.blockers.every(r => r.severity === 'block')).toBe(true);
    expect(result.warnings.every(r => r.severity === 'warning')).toBe(true);
    expect(result.infos.every(r => r.severity === 'info')).toBe(true);
  });

  it('fail-fast mode stops after first blocker (VAL-API-004)', () => {
    // Both vr-exec-1 and vr-exec-2 trigger, but failFast should stop at first blocker
    const result = executeValidations(configs, 'on_save', {}, mockCondEvaluator, { failFast: true });
    expect(result.blockers.length).toBe(1);
    expect(result.results.length).toBe(1);
  });

  it('propagates fieldRef/lineRef/sourceRef from config (VAL-RESULT-005/006/007)', () => {
    const configWithRefs: ValidationRuleConfig[] = [{
      id: 'vr-ref-test',
      ruleVersionId: 'rv-1',
      familyId: 'rf-1',
      category: 'field_mandatory',
      executionPoints: ['on_save'],
      severity: 'block',
      entityType: 'sale_invoice',
      messageTemplate: 'Customer is required.',
      nonOverridable: true,
      allowSeverityDowngrade: false,
      createdBy: 'system',
      createdAt: '2026-01-01T00:00:00Z',
      fieldRef: 'customer_id',
      lineRef: 'lines[0]',
      sourceRef: 'SO-2026-001',
    }];
    const result = executeValidations(configWithRefs, 'on_save', {}, () => false);
    expect(result.blockers[0].fieldRef).toBe('customer_id');
    expect(result.blockers[0].lineRef).toBe('lines[0]');
    expect(result.blockers[0].sourceRef).toBe('SO-2026-001');
  });
});

// ═══════════════════════════════════════════════════════════════
// Type Coverage
// ═══════════════════════════════════════════════════════════════
describe('validation type coverage', () => {
  it('has 17 validation categories', () => {
    expect(VALIDATION_CATEGORIES).toHaveLength(17);
  });

  it('has 6 execution points', () => {
    expect(EXECUTION_POINTS).toHaveLength(6);
  });
});
