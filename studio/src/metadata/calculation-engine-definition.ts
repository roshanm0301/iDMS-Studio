/**
 * Calculation Engine — Metadata Types & Runtime
 *
 * Implements: CALC-TYPE-001 through CALC-TYPE-010, CALC-DEF-001 through CALC-DEF-010,
 * CALC-SEQ-001 through CALC-SEQ-009, QTY-CALC-001 through QTY-CALC-008,
 * AMT-CALC-001 through AMT-CALC-010, CALC-PRC-001 through CALC-PRC-009,
 * CALC-RECALC-001 through CALC-RECALC-007
 */

// ═══════════════════════════════════════════════════════════════
// Calculation Types — CALC-TYPE-001 through CALC-TYPE-010
// ═══════════════════════════════════════════════════════════════
export const CALCULATION_TYPES = [
  'field_formula',
  'line_level',
  'header_level',
  'aggregation',
  'quantity_progress',
  'amount',
  'taxable_base',
  'round_off',
  'status_indicator',
  'prior_engine_output',
] as const;
export type CalculationType = (typeof CALCULATION_TYPES)[number];

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  field_formula: 'Field Formula',
  line_level: 'Line-Level',
  header_level: 'Header-Level',
  aggregation: 'Aggregation',
  quantity_progress: 'Quantity Progress',
  amount: 'Amount',
  taxable_base: 'Taxable Base',
  round_off: 'Round-Off',
  status_indicator: 'Status Indicator',
  prior_engine_output: 'Prior Engine Output',
};

// ═══════════════════════════════════════════════════════════════
// Rounding Modes — CALC-PRC-005
// ═══════════════════════════════════════════════════════════════
export const ROUNDING_MODES = [
  'round_half_up',
  'round_down',
  'round_up',
  'no_rounding',
] as const;
export type RoundingMode = (typeof ROUNDING_MODES)[number];

export const ROUNDING_MODE_LABELS: Record<RoundingMode, string> = {
  round_half_up: 'Round Half Up',
  round_down: 'Round Down (Truncate)',
  round_up: 'Round Up',
  no_rounding: 'No Rounding',
};

// ═══════════════════════════════════════════════════════════════
// Output Editability — CALC-DEF-008
// ═══════════════════════════════════════════════════════════════
export const OUTPUT_EDIT_MODES = ['editable', 'read_only', 'system_controlled'] as const;
export type OutputEditMode = (typeof OUTPUT_EDIT_MODES)[number];

// ═══════════════════════════════════════════════════════════════
// Calculation Execution Points
// ═══════════════════════════════════════════════════════════════
export const CALC_EXECUTION_POINTS = [
  'on_load',
  'on_change',
  'on_calculate',
  'on_save',
] as const;
export type CalcExecutionPoint = (typeof CALC_EXECUTION_POINTS)[number];

// ═══════════════════════════════════════════════════════════════
// Calculation Definition — CALC-DEF-001 through CALC-DEF-010
// ═══════════════════════════════════════════════════════════════
export interface CalculationDefinition {
  id: string;                                  // CALC-DEF-001
  ruleVersionId: string;
  familyId: string;
  name: string;
  description?: string;
  calculationType: CalculationType;
  entityType: string;                          // CALC-DEF-002
  documentType?: string;                       // CALC-DEF-002
  executionPoint: CalcExecutionPoint;          // CALC-DEF-003
  inputFields: string[];                       // CALC-DEF-004 — field API names
  outputField: string;                         // CALC-DEF-005
  formulaRef?: string;                         // CALC-DEF-006 — links to FormulaDefinition
  formulaExpression?: string;                  // Inline formula for simple cases
  precision: number;                           // CALC-DEF-007
  roundingMode: RoundingMode;                  // CALC-DEF-007
  outputEditMode: OutputEditMode;              // CALC-DEF-008
  sequenceGroup?: string;                      // CALC-SEQ-005
  sequenceOrder?: number;                      // Within sequence group
  dependsOn: string[];                         // CALC-SEQ-001 — other calc IDs
  createdBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Dependency Graph — CALC-SEQ-001 through CALC-SEQ-009
// ═══════════════════════════════════════════════════════════════
export interface DependencyNode {
  calcId: string;
  name: string;
  dependsOn: string[];
  dependedBy: string[];
  level: number;                               // topological depth (0 = no dependencies)
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  executionOrder: string[];                    // Topologically sorted calc IDs
  hasCycle: boolean;                           // CALC-SEQ-002
  cycleParticipants: string[];                 // CALC-SEQ-003
}

/**
 * Builds a dependency graph from calculation definitions.
 * Detects cycles (CALC-SEQ-002/003) and produces execution order (CALC-SEQ-004).
 */
export function buildDependencyGraph(calcs: CalculationDefinition[]): DependencyGraph {
  const idMap = new Map(calcs.map(c => [c.id, c]));
  const nodes: DependencyNode[] = calcs.map(c => ({
    calcId: c.id,
    name: c.name,
    dependsOn: c.dependsOn.filter(d => idMap.has(d)),
    dependedBy: [],
    level: 0,
  }));

  // Build reverse edges
  const nodeMap = new Map(nodes.map(n => [n.calcId, n]));
  for (const node of nodes) {
    for (const dep of node.dependsOn) {
      nodeMap.get(dep)?.dependedBy.push(node.calcId);
    }
  }

  // Topological sort using Kahn's algorithm
  const inDegree = new Map(nodes.map(n => [n.calcId, n.dependsOn.length]));
  const queue: string[] = [];
  const executionOrder: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  // CALC-SEQ-005: sort same-level nodes by sequenceOrder within sequenceGroup
  const sortBySequence = (ids: string[]) =>
    ids.sort((a, b) => {
      const ca = idMap.get(a)!;
      const cb = idMap.get(b)!;
      if (ca.sequenceGroup && cb.sequenceGroup && ca.sequenceGroup === cb.sequenceGroup) {
        return (ca.sequenceOrder ?? 0) - (cb.sequenceOrder ?? 0);
      }
      return 0;
    });

  let level = 0;
  sortBySequence(queue);
  while (queue.length > 0) {
    const nextQueue: string[] = [];
    for (const id of queue) {
      executionOrder.push(id);
      const node = nodeMap.get(id)!;
      node.level = level;
      for (const downstream of node.dependedBy) {
        const deg = inDegree.get(downstream)! - 1;
        inDegree.set(downstream, deg);
        if (deg === 0) nextQueue.push(downstream);
      }
    }
    queue.length = 0;
    sortBySequence(nextQueue);
    queue.push(...nextQueue);
    level++;
  }

  const hasCycle = executionOrder.length < calcs.length;
  const cycleParticipants = hasCycle
    ? calcs.filter(c => !executionOrder.includes(c.id)).map(c => c.id)
    : [];

  return { nodes, executionOrder, hasCycle, cycleParticipants };
}

// ═══════════════════════════════════════════════════════════════
// Precision & Rounding — CALC-PRC-001 through CALC-PRC-009
// ═══════════════════════════════════════════════════════════════
export function applyRounding(value: number, precision: number, mode: RoundingMode): number {
  if (mode === 'no_rounding') return value;
  const factor = Math.pow(10, precision);
  switch (mode) {
    case 'round_half_up':
      return Math.round(value * factor) / factor;
    case 'round_down':
      return Math.trunc(value * factor) / factor;
    case 'round_up':
      return Math.ceil(value * factor) / factor;
    default:
      return value;
  }
}

// ═══════════════════════════════════════════════════════════════
// Calculation Result
// ═══════════════════════════════════════════════════════════════
export interface CalculationResult {
  calcId: string;
  outputField: string;
  rawValue: number;                            // CALC-PRC-008
  roundedValue: number;                        // CALC-PRC-008
  precision: number;
  roundingMode: RoundingMode;
  inputsUsed: Record<string, unknown>;
  error?: string;
}

export interface CalculationRunResult {
  success: boolean;
  results: CalculationResult[];
  executionOrder: string[];
  errors: { calcId: string; error: string }[];
  executedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Calculation Executor
// ═══════════════════════════════════════════════════════════════

/**
 * Executes calculations in dependency order.
 * Uses formulaEvaluator to compute each formula's result.
 */
export function executeCalculations(
  calcs: CalculationDefinition[],
  context: Record<string, unknown>,
  formulaEvaluator: (expression: string, ctx: Record<string, unknown>) => number | null,
): CalculationRunResult {
  const graph = buildDependencyGraph(calcs);
  if (graph.hasCycle) {
    return {
      success: false,
      results: [],
      executionOrder: [],
      errors: graph.cycleParticipants.map(id => ({ calcId: id, error: 'Circular dependency detected.' })),
      executedAt: new Date().toISOString(),
    };
  }

  const results: CalculationResult[] = [];
  const errors: { calcId: string; error: string }[] = [];
  const liveContext = { ...context };

  for (const calcId of graph.executionOrder) {
    const calc = calcs.find(c => c.id === calcId)!;
    const expression = calc.formulaExpression || '';

    if (!expression) {
      errors.push({ calcId, error: 'No formula expression defined.' });
      continue;
    }

    // Collect inputs
    const inputsUsed: Record<string, unknown> = {};
    for (const field of calc.inputFields) {
      inputsUsed[field] = liveContext[field] ?? null;
    }

    const rawValue = formulaEvaluator(expression, liveContext);
    if (rawValue === null) {
      errors.push({ calcId, error: 'Formula evaluation returned null.' });
      continue;
    }

    const roundedValue = applyRounding(rawValue, calc.precision, calc.roundingMode);

    // Write output to live context for downstream calculations
    liveContext[calc.outputField] = roundedValue;

    results.push({
      calcId,
      outputField: calc.outputField,
      rawValue,
      roundedValue,
      precision: calc.precision,
      roundingMode: calc.roundingMode,
      inputsUsed,
    });
  }

  return {
    success: errors.length === 0,
    results,
    executionOrder: graph.executionOrder,
    errors,
    executedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Validator
// ═══════════════════════════════════════════════════════════════
export function validateCalculationDefinition(calc: CalculationDefinition): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!calc.id) issues.push('Calculation ID is required.');
  if (!calc.name || calc.name.trim().length === 0) issues.push('Calculation name is required.');
  if (!calc.outputField) issues.push('Output field is required.');
  if (!calc.inputFields || calc.inputFields.length === 0) issues.push('At least one input field is required.');
  if (!calc.formulaExpression && !calc.formulaRef) issues.push('Formula expression or formula reference is required.');
  if (calc.precision < 0 || calc.precision > 10) issues.push('Precision must be between 0 and 10.');
  if (!ROUNDING_MODES.includes(calc.roundingMode)) issues.push('Invalid rounding mode.');

  // Check output field is not also an input (self-reference)
  if (calc.inputFields.includes(calc.outputField)) {
    issues.push('Output field must not be listed as an input field (self-reference).');
  }

  return { valid: issues.length === 0, issues };
}

// ═══════════════════════════════════════════════════════════════
// Recalculation trigger — CALC-RECALC-001
// ═══════════════════════════════════════════════════════════════

/**
 * Given a changed field, returns the calculation IDs that need recalculation.
 * Walks the dependency graph downstream from any calc that uses `changedField` as input.
 */
export function getAffectedCalculations(
  calcs: CalculationDefinition[],
  changedField: string,
): string[] {
  // Find calcs that directly consume the changed field
  const directlyAffected = calcs.filter(c => c.inputFields.includes(changedField));
  const affected = new Set<string>();
  const queue = [...directlyAffected.map(c => c.id)];
  const outputToCalcId = new Map(calcs.map(c => [c.outputField, c.id]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (affected.has(id)) continue;
    affected.add(id);

    // Find calcs that depend on this calc's output
    const calc = calcs.find(c => c.id === id);
    if (!calc) continue;
    const downstream = calcs.filter(c => c.dependsOn.includes(id) || c.inputFields.includes(calc.outputField));
    for (const d of downstream) {
      if (!affected.has(d.id)) queue.push(d.id);
    }
  }

  return [...affected];
}
