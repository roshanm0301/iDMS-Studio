/**
 * Financial Orchestration — Metadata Types
 *
 * Implements: FIN-SEQ-001 through FIN-SEQ-007, FIN-MOD-001 through FIN-MOD-022
 */

// ═══════════════════════════════════════════════════════════════
// Standard Financial Execution Sequence — FIN-SEQ-002
// ═══════════════════════════════════════════════════════════════
export const FINANCIAL_EXECUTION_STEPS = [
  { step: 1, id: 'auth_validation', name: 'Authorization & Access Validation', engine: 'validation' },
  { step: 2, id: 'config_validation', name: 'Document Configuration Validation', engine: 'validation' },
  { step: 3, id: 'source_eligibility', name: 'Source Eligibility & Freshness', engine: 'validation' },
  { step: 4, id: 'field_validation', name: 'Mandatory Field & Lookup Validation', engine: 'validation' },
  { step: 5, id: 'qty_lifecycle', name: 'Quantity / Status / Lifecycle Validation', engine: 'validation' },
  { step: 6, id: 'base_pricing', name: 'Base Pricing & Amount Calculation', engine: 'calculation' },
  { step: 7, id: 'pre_tax_charges', name: 'Discount & Pre-Tax Charges', engine: 'charge' },
  { step: 8, id: 'taxable_base', name: 'Taxable Base Calculation', engine: 'calculation' },
  { step: 9, id: 'tax_execution', name: 'Tax Rule Execution', engine: 'tax' },
  { step: 10, id: 'post_tax_charges', name: 'Post-Tax Charges', engine: 'charge' },
  { step: 11, id: 'totals_roundoff', name: 'Totals, Round-Off & Net Amount', engine: 'calculation' },
  { step: 12, id: 'approval_decision', name: 'Approval Requirement Decision', engine: 'approval' },
  { step: 13, id: 'accounting_preview', name: 'Accounting Rule Preview', engine: 'accounting' },
  { step: 14, id: 'final_revalidation', name: 'Final Save-Time Revalidation', engine: 'validation' },
  { step: 15, id: 'transaction_commit', name: 'Transaction Atomic Commit', engine: 'transaction_service' },
  { step: 16, id: 'post_commit', name: 'Post-Commit Events', engine: 'workflow' },
  { step: 17, id: 'audit_trace', name: 'Audit & Trace Finalization', engine: 'audit' },
] as const;

export type ExecutionStepId = (typeof FINANCIAL_EXECUTION_STEPS)[number]['id'];

// ═══════════════════════════════════════════════════════════════
// Execution Modes — FIN-MOD
// ═══════════════════════════════════════════════════════════════
export const EXECUTION_MODES = ['preview', 'final_save', 'post_commit'] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const EXECUTION_MODE_LABELS: Record<ExecutionMode, string> = {
  preview: 'Preview Mode',
  final_save: 'Final-Save Mode',
  post_commit: 'Post-Commit Mode',
};

// ═══════════════════════════════════════════════════════════════
// Orchestration Result
// ═══════════════════════════════════════════════════════════════
export interface OrchestrationStepResult {
  stepId: ExecutionStepId;
  engine: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  durationMs: number;
  outputs?: Record<string, unknown>;
  errors?: string[];
  warnings?: string[];
}

export interface OrchestrationRunResult {
  mode: ExecutionMode;
  traceCorrelationId: string;  // Shared across all engines
  steps: OrchestrationStepResult[];
  overallStatus: 'success' | 'blocked' | 'warning';
  blockingErrors: string[];
  executedAt: string;
  entityType: string;
  documentType?: string;
}
