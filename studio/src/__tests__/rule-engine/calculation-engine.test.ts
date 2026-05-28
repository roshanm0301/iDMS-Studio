/**
 * Calculation Engine — Unit Tests
 *
 * Tests for: dependency graph, cycle detection, precision/rounding,
 * calculation executor, validator
 */
import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  applyRounding,
  executeCalculations,
  validateCalculationDefinition,
  getAffectedCalculations,
  CALCULATION_TYPES,
  ROUNDING_MODES,
} from '../../metadata/calculation-engine-definition';
import type { CalculationDefinition } from '../../metadata/calculation-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Dependency Graph
// ═══════════════════════════════════════════════════════════════
describe('buildDependencyGraph', () => {
  const makeCalc = (id: string, deps: string[]): CalculationDefinition => ({
    id,
    ruleVersionId: `rv-${id}`,
    familyId: `rf-${id}`,
    name: `Calc ${id}`,
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: ['x'],
    outputField: `out_${id}`,
    formulaExpression: 'x',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: deps,
    createdBy: 'test',
    createdAt: '2026-01-01T00:00:00Z',
  });

  it('builds a simple linear graph (A → B → C)', () => {
    const calcs = [makeCalc('C', ['B']), makeCalc('B', ['A']), makeCalc('A', [])];
    const graph = buildDependencyGraph(calcs);
    expect(graph.hasCycle).toBe(false);
    expect(graph.executionOrder).toEqual(['A', 'B', 'C']);
  });

  it('handles multiple roots (parallel start)', () => {
    const calcs = [makeCalc('C', ['A', 'B']), makeCalc('A', []), makeCalc('B', [])];
    const graph = buildDependencyGraph(calcs);
    expect(graph.hasCycle).toBe(false);
    expect(graph.executionOrder.indexOf('C')).toBeGreaterThan(graph.executionOrder.indexOf('A'));
    expect(graph.executionOrder.indexOf('C')).toBeGreaterThan(graph.executionOrder.indexOf('B'));
  });

  it('detects simple cycle (A → B → A)', () => {
    const calcs = [makeCalc('A', ['B']), makeCalc('B', ['A'])];
    const graph = buildDependencyGraph(calcs);
    expect(graph.hasCycle).toBe(true);
    expect(graph.cycleParticipants.sort()).toEqual(['A', 'B']);
  });

  it('detects cycle in larger graph (only cycle nodes affected)', () => {
    const calcs = [
      makeCalc('A', []),
      makeCalc('B', ['A']),
      makeCalc('C', ['D']), // C → D → C is a cycle
      makeCalc('D', ['C']),
    ];
    const graph = buildDependencyGraph(calcs);
    expect(graph.hasCycle).toBe(true);
    expect(graph.cycleParticipants.sort()).toEqual(['C', 'D']);
    expect(graph.executionOrder).toContain('A');
    expect(graph.executionOrder).toContain('B');
  });

  it('assigns levels correctly', () => {
    const calcs = [makeCalc('A', []), makeCalc('B', ['A']), makeCalc('C', ['B'])];
    const graph = buildDependencyGraph(calcs);
    const nodeA = graph.nodes.find(n => n.calcId === 'A')!;
    const nodeB = graph.nodes.find(n => n.calcId === 'B')!;
    const nodeC = graph.nodes.find(n => n.calcId === 'C')!;
    expect(nodeA.level).toBe(0);
    expect(nodeB.level).toBe(1);
    expect(nodeC.level).toBe(2);
  });

  it('ignores unknown dependencies', () => {
    const calcs = [makeCalc('A', ['unknown_id'])];
    const graph = buildDependencyGraph(calcs);
    expect(graph.hasCycle).toBe(false);
    expect(graph.executionOrder).toEqual(['A']);
  });
});

// ═══════════════════════════════════════════════════════════════
// Precision & Rounding
// ═══════════════════════════════════════════════════════════════
describe('applyRounding', () => {
  it('round_half_up: 9.555 at 2dp → 9.56', () => {
    expect(applyRounding(9.555, 2, 'round_half_up')).toBe(9.56);
  });

  it('round_down: 9.559 at 2dp → 9.55', () => {
    expect(applyRounding(9.559, 2, 'round_down')).toBe(9.55);
  });

  it('round_up: 9.551 at 2dp → 9.56', () => {
    expect(applyRounding(9.551, 2, 'round_up')).toBe(9.56);
  });

  it('no_rounding: returns value unchanged', () => {
    expect(applyRounding(9.5555, 2, 'no_rounding')).toBe(9.5555);
  });

  it('precision 0: rounds to integer', () => {
    expect(applyRounding(9.7, 0, 'round_half_up')).toBe(10);
  });

  it('handles negative values', () => {
    expect(applyRounding(-9.555, 2, 'round_half_up')).toBe(-9.55);
  });
});

// ═══════════════════════════════════════════════════════════════
// Calculation Executor
// ═══════════════════════════════════════════════════════════════
describe('executeCalculations', () => {
  const makeCalc = (id: string, deps: string[], output: string, formula: string, inputs: string[]): CalculationDefinition => ({
    id,
    ruleVersionId: `rv-${id}`,
    familyId: `rf-${id}`,
    name: id,
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: inputs,
    outputField: output,
    formulaExpression: formula,
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: deps,
    createdBy: 'test',
    createdAt: '2026-01-01T00:00:00Z',
  });

  // Simple arithmetic evaluator for tests
  const evalFormula = (expr: string, ctx: Record<string, unknown>): number | null => {
    try {
      let resolved = expr;
      for (const [key, val] of Object.entries(ctx)) {
        if (typeof val === 'number') {
          resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
        }
      }
      // Only allow safe arithmetic
      if (/^[\d\s+\-*/().]+$/.test(resolved)) {
        return Function(`"use strict"; return (${resolved})`)() as number;
      }
      return null;
    } catch {
      return null;
    }
  };

  it('executes chained calculations (base_amount → discount → discounted_base)', () => {
    const calcs = [
      makeCalc('base', [], 'base_amount', 'quantity * rate', ['quantity', 'rate']),
      makeCalc('disc', ['base'], 'discount_amount', 'base_amount * discount_pct / 100', ['base_amount', 'discount_pct']),
      makeCalc('net', ['base', 'disc'], 'discounted_base', 'base_amount - discount_amount', ['base_amount', 'discount_amount']),
    ];
    const context = { quantity: 10, rate: 1000, discount_pct: 5 };
    const result = executeCalculations(calcs, context, evalFormula);

    expect(result.success).toBe(true);
    expect(result.results.length).toBe(3);
    expect(result.results[0].roundedValue).toBe(10000);
    expect(result.results[1].roundedValue).toBe(500);
    expect(result.results[2].roundedValue).toBe(9500);
  });

  it('fails on circular dependency', () => {
    const calcs = [
      makeCalc('A', ['B'], 'out_a', 'x', ['x']),
      makeCalc('B', ['A'], 'out_b', 'x', ['x']),
    ];
    const result = executeCalculations(calcs, { x: 1 }, evalFormula);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].error).toContain('Circular');
  });

  it('reports error when formula evaluates to null', () => {
    const calcs = [
      makeCalc('bad', [], 'out', 'SUM(invalid)', ['x']),
    ];
    const result = executeCalculations(calcs, { x: 1 }, evalFormula);
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('null');
  });

  it('reports error when no formula expression', () => {
    const calcs: CalculationDefinition[] = [{
      id: 'empty',
      ruleVersionId: 'rv-x',
      familyId: 'rf-x',
      name: 'Empty',
      calculationType: 'amount',
      entityType: 'sale_invoice',
      executionPoint: 'on_change',
      inputFields: ['x'],
      outputField: 'out',
      formulaExpression: '',
      precision: 2,
      roundingMode: 'round_half_up',
      outputEditMode: 'read_only',
      dependsOn: [],
      createdBy: 'test',
      createdAt: '2026-01-01T00:00:00Z',
    }];
    const result = executeCalculations(calcs, {}, evalFormula);
    expect(result.success).toBe(false);
    expect(result.errors[0].error).toContain('No formula');
  });

  it('stores raw and rounded values (CALC-PRC-008)', () => {
    const calcs = [
      makeCalc('div', [], 'out', '10 / 3', ['x']),
    ];
    const result = executeCalculations(calcs, { x: 0 }, evalFormula);
    expect(result.results[0].rawValue).toBeCloseTo(3.3333, 3);
    expect(result.results[0].roundedValue).toBe(3.33);
  });
});

// ═══════════════════════════════════════════════════════════════
// Validator
// ═══════════════════════════════════════════════════════════════
describe('validateCalculationDefinition', () => {
  const validCalc: CalculationDefinition = {
    id: 'calc-test',
    ruleVersionId: 'rv-test',
    familyId: 'rf-test',
    name: 'Base Amount',
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: ['quantity', 'rate'],
    outputField: 'base_amount',
    formulaExpression: 'quantity * rate',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: [],
    createdBy: 'test',
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('validates correct config', () => {
    expect(validateCalculationDefinition(validCalc).valid).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateCalculationDefinition({ ...validCalc, name: '' });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Calculation name is required.');
  });

  it('rejects missing output field', () => {
    const result = validateCalculationDefinition({ ...validCalc, outputField: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects missing input fields', () => {
    const result = validateCalculationDefinition({ ...validCalc, inputFields: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects missing formula', () => {
    const result = validateCalculationDefinition({ ...validCalc, formulaExpression: '', formulaRef: undefined });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Formula expression or formula reference is required.');
  });

  it('rejects self-referencing output field', () => {
    const result = validateCalculationDefinition({ ...validCalc, inputFields: ['base_amount'], outputField: 'base_amount' });
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Output field must not be listed as an input field (self-reference).');
  });

  it('rejects precision out of range', () => {
    expect(validateCalculationDefinition({ ...validCalc, precision: -1 }).valid).toBe(false);
    expect(validateCalculationDefinition({ ...validCalc, precision: 11 }).valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// Type Coverage
// ═══════════════════════════════════════════════════════════════
describe('calculation type coverage', () => {
  it('has 10 calculation types', () => {
    expect(CALCULATION_TYPES).toHaveLength(10);
  });

  it('has 4 rounding modes', () => {
    expect(ROUNDING_MODES).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════
// Recalculation Triggers — CALC-RECALC-001
// ═══════════════════════════════════════════════════════════════
describe('getAffectedCalculations', () => {
  const makeCalc = (id: string, deps: string[], output: string, inputs: string[]): CalculationDefinition => ({
    id,
    ruleVersionId: `rv-${id}`,
    familyId: `rf-${id}`,
    name: id,
    calculationType: 'amount',
    entityType: 'sale_invoice',
    executionPoint: 'on_change',
    inputFields: inputs,
    outputField: output,
    formulaExpression: 'x',
    precision: 2,
    roundingMode: 'round_half_up',
    outputEditMode: 'read_only',
    dependsOn: deps,
    createdBy: 'test',
    createdAt: '2026-01-01T00:00:00Z',
  });

  it('finds directly affected calc', () => {
    const calcs = [makeCalc('A', [], 'base', ['qty', 'rate'])];
    const affected = getAffectedCalculations(calcs, 'qty');
    expect(affected).toContain('A');
  });

  it('walks downstream dependencies', () => {
    const calcs = [
      makeCalc('A', [], 'base', ['qty', 'rate']),
      makeCalc('B', ['A'], 'disc', ['base', 'pct']),
      makeCalc('C', ['B'], 'net', ['disc']),
    ];
    const affected = getAffectedCalculations(calcs, 'qty');
    expect(affected).toContain('A');
    expect(affected).toContain('B');
    expect(affected).toContain('C');
  });

  it('returns empty for unrelated field', () => {
    const calcs = [makeCalc('A', [], 'base', ['qty', 'rate'])];
    const affected = getAffectedCalculations(calcs, 'unrelated');
    expect(affected).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Sequence Group Ordering — CALC-SEQ-005
// ═══════════════════════════════════════════════════════════════
describe('sequence group ordering', () => {
  it('sorts same-level nodes by sequenceOrder within same group', () => {
    const calcs: CalculationDefinition[] = [
      {
        id: 'B', ruleVersionId: 'rv', familyId: 'rf', name: 'B', calculationType: 'amount',
        entityType: 'x', executionPoint: 'on_change', inputFields: ['x'], outputField: 'ob',
        formulaExpression: 'x', precision: 2, roundingMode: 'round_half_up', outputEditMode: 'read_only',
        sequenceGroup: 'comm', sequenceOrder: 2, dependsOn: [], createdBy: 't', createdAt: '',
      },
      {
        id: 'A', ruleVersionId: 'rv', familyId: 'rf', name: 'A', calculationType: 'amount',
        entityType: 'x', executionPoint: 'on_change', inputFields: ['x'], outputField: 'oa',
        formulaExpression: 'x', precision: 2, roundingMode: 'round_half_up', outputEditMode: 'read_only',
        sequenceGroup: 'comm', sequenceOrder: 1, dependsOn: [], createdBy: 't', createdAt: '',
      },
    ];
    const graph = buildDependencyGraph(calcs);
    expect(graph.executionOrder[0]).toBe('A');
    expect(graph.executionOrder[1]).toBe('B');
  });
});
