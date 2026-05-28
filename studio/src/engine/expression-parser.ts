/**
 * Safe Expression Parser & Evaluator
 *
 * Implements: AIDEV-EXP-001 (safe parsing), EXP-SEC-001 through EXP-SEC-007,
 * EXP-RUN-001 through EXP-RUN-012
 *
 * This module provides:
 * - Tokenization of formula strings into FormulaToken[]
 * - Condition evaluation against a payload
 * - Formula evaluation against a payload (sandboxed, no eval)
 */
import type {
  ConditionGroup,
  ConditionNode,
  ConditionOperator,
  EvaluationTrace,
  ExpressionDataType,
  ExpressionResult,
  FormulaDefinition,
  FormulaToken,
} from '../metadata/expression-engine-definition';
import { APPROVED_FUNCTIONS } from '../metadata/expression-engine-definition';

// ═══════════════════════════════════════════════════════════════
// Formula Tokenizer — FORM-BLD-011
// ═══════════════════════════════════════════════════════════════
const OPERATORS_REGEX = /^[+\-*/%]/;
const NUMBER_REGEX = /^[0-9]+(\.[0-9]+)?/;
const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_.]*/;
const STRING_REGEX = /^"([^"\\]|\\.)*"/;

export function tokenizeFormula(expression: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let pos = 0;
  const input = expression.trim();

  while (pos < input.length) {
    // Skip whitespace
    if (/\s/.test(input[pos])) {
      pos++;
      continue;
    }

    const remaining = input.slice(pos);

    // Parentheses
    if (remaining[0] === '(') {
      tokens.push({ type: 'open_paren', value: '(' });
      pos++;
      continue;
    }
    if (remaining[0] === ')') {
      tokens.push({ type: 'close_paren', value: ')' });
      pos++;
      continue;
    }

    // Comma (function argument separator)
    if (remaining[0] === ',') {
      tokens.push({ type: 'comma', value: ',' });
      pos++;
      continue;
    }

    // String literal
    const strMatch = remaining.match(STRING_REGEX);
    if (strMatch) {
      tokens.push({ type: 'string', value: strMatch[0].slice(1, -1) });
      pos += strMatch[0].length;
      continue;
    }

    // Number
    const numMatch = remaining.match(NUMBER_REGEX);
    if (numMatch && (tokens.length === 0 || ['operator', 'open_paren', 'comma'].includes(tokens[tokens.length - 1].type))) {
      tokens.push({ type: 'number', value: numMatch[0] });
      pos += numMatch[0].length;
      continue;
    }

    // Operators
    const opMatch = remaining.match(OPERATORS_REGEX);
    if (opMatch) {
      // Check if this is a negative sign before a number
      if (opMatch[0] === '-' && (tokens.length === 0 || ['operator', 'open_paren', 'comma'].includes(tokens[tokens.length - 1].type))) {
        const afterMinus = remaining.slice(1).match(NUMBER_REGEX);
        if (afterMinus) {
          tokens.push({ type: 'number', value: '-' + afterMinus[0] });
          pos += 1 + afterMinus[0].length;
          continue;
        }
      }
      tokens.push({ type: 'operator', value: opMatch[0] });
      pos += opMatch[0].length;
      continue;
    }

    // Number (after operator check for cases like "2 * 3")
    if (numMatch) {
      tokens.push({ type: 'number', value: numMatch[0] });
      pos += numMatch[0].length;
      continue;
    }

    // Identifier (field or function)
    const idMatch = remaining.match(IDENTIFIER_REGEX);
    if (idMatch) {
      const name = idMatch[0];
      // Check if followed by '(' → function
      const afterId = input.slice(pos + name.length).trimStart();
      if (afterId.startsWith('(')) {
        tokens.push({ type: 'function', value: name, functionName: name });
      } else {
        tokens.push({ type: 'field', value: name, fieldId: name });
      }
      pos += name.length;
      continue;
    }

    // Unknown character — skip
    pos++;
  }

  return tokens;
}

// ═══════════════════════════════════════════════════════════════
// Condition Evaluation — EXP-RUN-001
// ═══════════════════════════════════════════════════════════════
export type EvaluationContext = Record<string, unknown>;

export function evaluateConditionGroup(
  group: ConditionGroup,
  context: EvaluationContext,
  strict: boolean = true,
): ExpressionResult {
  const trace: EvaluationTrace[] = [];

  const results: boolean[] = [];

  for (const cond of group.conditions) {
    const fieldValue = resolveFieldValue(cond.fieldApiName, context);
    trace.push({ fieldId: cond.fieldId, fieldApiName: cond.fieldApiName, resolvedValue: fieldValue });

    if (strict && fieldValue === undefined) {
      return {
        success: false,
        value: false,
        error: { code: 'FIELD_NOT_FOUND', message: `Field "${cond.fieldApiName}" not found in context.`, fieldRef: cond.fieldApiName },
        trace,
      };
    }

    const condResult = evaluateCondition(cond, fieldValue);
    results.push(condResult);
  }

  // Evaluate nested groups
  for (const nested of group.groups) {
    const nestedResult = evaluateConditionGroup(nested, context, strict);
    trace.push(...nestedResult.trace);
    if (!nestedResult.success) return { ...nestedResult, trace };
    results.push(nestedResult.value as boolean);
  }

  const finalValue = group.logic === 'AND'
    ? results.every(r => r === true)
    : results.some(r => r === true);

  return { success: true, value: finalValue, outputType: 'boolean', trace };
}

function resolveFieldValue(fieldApiName: string, context: EvaluationContext): unknown {
  // Support dotted paths like "customer.name"
  const parts = fieldApiName.split('.');
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function evaluateCondition(cond: ConditionNode, fieldValue: unknown): boolean {
  return applyOperator(cond.operator, fieldValue, cond.value, cond.valueTo, cond.valueList);
}

function applyOperator(
  operator: ConditionOperator,
  fieldValue: unknown,
  value?: unknown,
  valueTo?: unknown,
  valueList?: unknown[],
): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'is_blank':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'is_not_blank':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    case 'in_list':
      return Array.isArray(valueList) && valueList.includes(fieldValue);
    case 'not_in_list':
      return !Array.isArray(valueList) || !valueList.includes(fieldValue);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(value);
    case 'between':
      return Number(fieldValue) >= Number(value) && Number(fieldValue) <= Number(valueTo);
    case 'not_between':
      return Number(fieldValue) < Number(value) || Number(fieldValue) > Number(valueTo);
    case 'contains':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value);
    case 'does_not_contain':
      return typeof fieldValue === 'string' && typeof value === 'string' && !fieldValue.includes(value);
    case 'starts_with':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.startsWith(value);
    case 'ends_with':
      return typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.endsWith(value);
    case 'before':
      return new Date(fieldValue as string) < new Date(value as string);
    case 'after':
      return new Date(fieldValue as string) > new Date(value as string);
    case 'on':
      return new Date(fieldValue as string).toDateString() === new Date(value as string).toDateString();
    case 'on_or_before':
      return new Date(fieldValue as string) <= new Date(value as string);
    case 'on_or_after':
      return new Date(fieldValue as string) >= new Date(value as string);
    case 'within_range':
      return new Date(fieldValue as string) >= new Date(value as string) && new Date(fieldValue as string) <= new Date(valueTo as string);
    case 'lookup_id_equals':
      return (fieldValue as { id?: string })?.id === value;
    case 'lookup_code_equals':
      return (fieldValue as { code?: string })?.code === value;
    case 'lookup_attribute_equals':
      return false; // Requires dynamic attribute resolution — deferred
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Formula Evaluation — Safe, no eval — EXP-SEC-001, EXP-SEC-002
// ═══════════════════════════════════════════════════════════════
export function evaluateFormula(
  formula: FormulaDefinition,
  context: EvaluationContext,
  strict: boolean = true,
): ExpressionResult {
  const trace: EvaluationTrace[] = [];

  // Resolve all field bindings to concrete values
  // Key by fieldApiName (matches what tokenizer sets as fieldId on tokens)
  const resolvedFields: Record<string, number> = {};
  for (const binding of formula.fieldBindings) {
    const val = resolveFieldValue(binding.fieldApiName, context);
    trace.push({ fieldId: binding.fieldId, fieldApiName: binding.fieldApiName, resolvedValue: val });

    if (val === undefined || val === null) {
      if (strict && binding.isRequired) {
        return {
          success: false,
          value: null,
          error: { code: 'FIELD_NOT_FOUND', message: `Required field "${binding.fieldApiName}" not found.`, fieldRef: binding.fieldApiName },
          trace,
        };
      }
      resolvedFields[binding.fieldApiName] = 0;
      resolvedFields[binding.fieldId] = 0;
    } else {
      resolvedFields[binding.fieldApiName] = Number(val);
      resolvedFields[binding.fieldId] = Number(val);
    }
  }

  try {
    const result = evaluateTokens(formula.tokens, resolvedFields);
    return { success: true, value: result, outputType: formula.outputType, trace };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown evaluation error';
    return {
      success: false,
      value: null,
      error: { code: 'EVALUATION_ERROR', message },
      trace,
    };
  }
}

/**
 * Recursive descent evaluator for formula tokens.
 * Supports: +, -, *, /, %, parentheses, functions.
 * FORM-BLD-008: Division by zero returns error.
 */
function evaluateTokens(tokens: FormulaToken[], fields: Record<string, number>): number {
  let pos = 0;

  function parseExpression(): number {
    let left = parseTerm();
    while (pos < tokens.length && tokens[pos].type === 'operator' && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
      const op = tokens[pos].value;
      pos++;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (pos < tokens.length && tokens[pos].type === 'operator' && (tokens[pos].value === '*' || tokens[pos].value === '/' || tokens[pos].value === '%')) {
      const op = tokens[pos].value;
      pos++;
      const right = parseFactor();
      if ((op === '/' || op === '%') && right === 0) {
        throw new Error('Division by zero.');
      }
      if (op === '*') left = left * right;
      else if (op === '/') left = left / right;
      else left = left % right;
    }
    return left;
  }

  function parseFactor(): number {
    const token = tokens[pos];
    if (!token) throw new Error('Unexpected end of expression.');

    if (token.type === 'number') {
      pos++;
      return parseFloat(token.value);
    }

    if (token.type === 'field') {
      pos++;
      const fieldId = token.fieldId ?? token.value;
      if (!(fieldId in fields)) {
        throw new Error(`Unresolved field: "${token.value}".`);
      }
      return fields[fieldId];
    }

    if (token.type === 'function') {
      return parseFunction();
    }

    if (token.type === 'open_paren') {
      pos++; // consume '('
      const value = parseExpression();
      if (pos < tokens.length && tokens[pos].type === 'close_paren') {
        pos++; // consume ')'
      }
      return value;
    }

    throw new Error(`Unexpected token: "${token.value}" (${token.type}).`);
  }

  function parseFunction(): number {
    const funcToken = tokens[pos];
    const funcName = funcToken.functionName ?? funcToken.value;
    pos++; // consume function name

    // Expect '('
    if (pos >= tokens.length || tokens[pos].type !== 'open_paren') {
      throw new Error(`Expected '(' after function "${funcName}".`);
    }
    pos++; // consume '('

    const args: number[] = [];
    while (pos < tokens.length && tokens[pos].type !== 'close_paren') {
      if (tokens[pos].type === 'comma') {
        pos++;
        continue;
      }
      args.push(parseExpression());
    }

    if (pos < tokens.length && tokens[pos].type === 'close_paren') {
      pos++; // consume ')'
    }

    return executeFunction(funcName, args);
  }

  return parseExpression();
}

/**
 * Built-in function implementation — EXP-FUNC-003 through EXP-FUNC-012
 */
function executeFunction(name: string, args: number[]): number {
  const func = APPROVED_FUNCTIONS.find(f => f.name === name);
  if (!func) {
    throw new Error(`Unknown function: "${name}".`);
  }
  if (args.length < func.minArgs) {
    throw new Error(`Function "${name}" requires at least ${func.minArgs} argument(s).`);
  }
  if (func.maxArgs !== Infinity && args.length > func.maxArgs) {
    throw new Error(`Function "${name}" accepts at most ${func.maxArgs} argument(s).`);
  }

  switch (name) {
    case 'round':
      return args.length === 2
        ? Math.round(args[0] * Math.pow(10, args[1])) / Math.pow(10, args[1])
        : Math.round(args[0]);
    case 'abs':
      return Math.abs(args[0]);
    case 'min':
      return Math.min(...args);
    case 'max':
      return Math.max(...args);
    case 'sum':
      return args.reduce((a, b) => a + b, 0);
    case 'coalesce':
      return args.find(a => a !== null && a !== undefined && !isNaN(a)) ?? 0;
    case 'if':
      return args[0] ? args[1] : args[2];
    case 'dateDiff':
      // Simplified: treat args as days difference (actual impl would use dates)
      return args[0] - args[1];
    case 'percentage':
      return (args[0] * args[1]) / 100;
    case 'clamp':
      return Math.min(Math.max(args[0], args[1]), args[2]);
    default:
      throw new Error(`Function "${name}" not implemented.`);
  }
}
