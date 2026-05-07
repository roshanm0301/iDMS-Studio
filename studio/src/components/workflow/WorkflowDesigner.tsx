// ============================================================
// iDMS Admin Studio — Workflow Designer
// Visual React Flow canvas for artifact lifecycle workflows
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { Node, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  CheckCircle,
  XCircle,
  Info,
  Shield,
  Play,
  AlertTriangle,
  ArrowRight,
  Layers,
  CheckSquare,
  Zap,
} from 'lucide-react';
import { getWorkflow, getLayerStack, getWorkflows } from '../../data/mockService';
import { useStudioStore } from '../../hooks/useStudioStore';
import type { WorkflowDefinition, WorkflowState, WorkflowTransition, LayerCode } from '../../types';

// ─── Seed-shape adapters ──────────────────────────────────────
// The seed JSON uses slightly different field names than the TS types.
// These helpers normalise both shapes transparently.

function normaliseState(raw: any): WorkflowState {
  return {
    state_id:     raw.state_id    ?? raw.state    ?? raw.id    ?? '',
    label:        raw.label       ?? raw.state    ?? '',
    state_type:   raw.state_type  ?? raw.type     ?? 'normal',
    source_layer: raw.source_layer ?? 'platform',
    description:  raw.description,
  };
}

function normaliseTransition(raw: any): WorkflowTransition {
  return {
    transition_id: raw.transition_id ?? raw.id             ?? '',
    from_state:    raw.from_state    ?? raw.from           ?? '',
    to_state:      raw.to_state      ?? raw.to             ?? '',
    command:       raw.command       ?? '',
    label:         raw.label         ?? raw.command        ?? '',
    allowed_roles: raw.allowed_roles ?? raw.actor_roles    ?? [],
    guard_rules:   raw.guard_rules   ?? [],
    before_hooks:  raw.before_hooks  ?? (raw.before_trigger ? [raw.before_trigger] : []),
    after_hooks:   raw.after_hooks   ?? (raw.after_trigger  ? [raw.after_trigger]  : []),
    source_layer:  raw.source_layer  ?? 'platform',
    protected:     raw.protected     ?? false,
    description:   raw.description,
  };
}

function normaliseWorkflow(raw: WorkflowDefinition | any): WorkflowDefinition {
  return {
    artifact_key: raw.artifact_key,
    label:        raw.label ?? raw.name ?? raw.artifact_key,
    entity_type:  raw.entity_type ?? '',
    states:       (raw.states      ?? []).map(normaliseState),
    transitions:  (raw.transitions ?? []).map(normaliseTransition),
  };
}

// ─── Layout helpers ───────────────────────────────────────────
const NODE_W = 160;
const NODE_H = 80;
const COL_GAP = 220;
const ROW_NORMAL    = 160;
const ROW_INITIAL   = 0;
const ROW_EXCEPTION = 320;
const ROW_TERMINAL  = 160;

function computeLayout(states: WorkflowState[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  const initial   = states.filter(s => s.state_type === 'initial');
  const normal    = states.filter(s => s.state_type === 'normal');
  const terminal  = states.filter(s => s.state_type === 'terminal');
  const exception = states.filter(s => s.state_type === 'exception');

  // When there is no explicit initial type, use the first state as initial
  const allNormal = [...initial, ...normal];
  const isException = (s: WorkflowState) =>
    s.state_type === 'exception' ||
    s.state_id === 'CANCELLED' ||
    s.label?.toLowerCase().includes('cancel');

  // Separate terminals vs exceptions (some seeds mark CANCELLED as terminal)
  const happyTerminals  = terminal.filter(s => !isException(s));
  const exceptionStates = [...exception, ...terminal.filter(isException)];

  // Lay out main flow left-to-right
  allNormal.forEach((s, i) => {
    const y = i === 0 && initial.length === 0 ? ROW_INITIAL : ROW_NORMAL;
    positions[s.state_id] = { x: i * COL_GAP, y };
  });

  const mainCols = allNormal.length;

  // Happy terminals to the right of main flow
  happyTerminals.forEach((s, i) => {
    positions[s.state_id] = { x: (mainCols + i) * COL_GAP, y: ROW_TERMINAL };
  });

  // Exception / cancelled states below
  exceptionStates.forEach((s, i) => {
    positions[s.state_id] = { x: i * COL_GAP, y: ROW_EXCEPTION };
  });

  return positions;
}

// ─── Edge colour helper ───────────────────────────────────────
function edgeColor(transition: WorkflowTransition): string {
  const to  = transition.to_state?.toUpperCase();
  const cmd = transition.command?.toUpperCase();
  if (to === 'APPROVED' || to === 'DELIVERED' || cmd === 'APPROVE' || cmd === 'MARK_DELIVERED') {
    return '#22c55e'; // green
  }
  if (to === 'REJECTED' || cmd === 'REJECT') {
    return '#ef4444'; // red
  }
  return 'var(--border-strong, #9ca3af)';
}

// ─── StateNode custom node ────────────────────────────────────
interface StateNodeData {
  state: WorkflowState;
  hasWarning?: boolean;
  selected?: boolean;
}

const STATE_TYPE_STYLE: Record<string, { bg: string; border: string; badge: string; badgeBg: string }> = {
  initial:   { bg: 'var(--blue-soft,#eff6ff)',   border: 'var(--blue,#3b82f6)',   badge: 'INITIAL',   badgeBg: 'var(--blue-soft,#eff6ff)' },
  normal:    { bg: 'var(--bg-elev,#f9fafb)',      border: 'var(--border-strong,#d1d5db)', badge: 'NORMAL', badgeBg: 'var(--bg-sunken,#f3f4f6)' },
  terminal:  { bg: 'var(--green-soft,#f0fdf4)',   border: 'var(--green,#22c55e)', badge: 'TERMINAL',  badgeBg: 'var(--green-soft,#f0fdf4)' },
  exception: { bg: 'var(--red-soft,#fef2f2)',     border: 'var(--red,#ef4444)',   badge: 'EXCEPTION', badgeBg: 'var(--red-soft,#fef2f2)' },
};

function StateNode({ data }: NodeProps<StateNodeData>) {
  const { state, hasWarning } = data;
  const styleSet = STATE_TYPE_STYLE[state.state_type] ?? STATE_TYPE_STYLE.normal;

  return (
    <div
      className="react-flow__node-state"
      style={{
        background:   styleSet.bg,
        border:       `1.5px solid ${styleSet.border}`,
        borderRadius: 10,
        padding:      '10px 14px',
        minWidth:     NODE_W,
        textAlign:    'center',
        position:     'relative',
        userSelect:   'none',
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ background: styleSet.border, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: styleSet.border, width: 8, height: 8 }} />

      {/* Warning dot */}
      {hasWarning && (
        <span
          title="Validation issues"
          style={{
            position:        'absolute',
            top:             6,
            right:           6,
            width:           8,
            height:          8,
            borderRadius:    '50%',
            background:      'var(--amber,#f59e0b)',
            display:         'inline-block',
          }}
        />
      )}

      {/* State code */}
      <div
        className="mono"
        style={{
          fontSize:    13,
          fontWeight:  700,
          color:       'var(--text)',
          lineHeight:  1.2,
          marginBottom: 6,
          letterSpacing: '-0.01em',
        }}
      >
        {state.state_id}
      </div>

      {/* State label */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
        {state.label}
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
        {/* Type badge */}
        <span
          style={{
            fontSize:    9,
            fontWeight:  600,
            padding:     '1px 5px',
            borderRadius: 999,
            background:  styleSet.badgeBg,
            color:       styleSet.border,
            border:      `1px solid ${styleSet.border}`,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {state.state_type}
        </span>

        {/* Layer badge */}
        <span className={`layer-badge ${state.source_layer}`} style={{ fontSize: 9, padding: '1px 5px' }}>
          {state.source_layer}
        </span>
      </div>
    </div>
  );
}

// Register the node type outside the component to avoid recreation on each render
const NODE_TYPES = { state: StateNode };

// ─── Layer badge inline ───────────────────────────────────────
function LayerBadge({ layer, small }: { layer: LayerCode; small?: boolean }) {
  const LABELS: Record<string, string> = {
    platform: 'Platform', vertical: 'Vertical', tenant: 'Tenant', node: 'Node', role: 'Role',
  };
  return (
    <span className={`layer-badge ${layer}`} style={small ? { fontSize: 10, padding: '1px 6px' } : {}}>
      {LABELS[layer] ?? layer}
    </span>
  );
}

// ─── Simulation mini-panel ────────────────────────────────────
interface SimResult {
  permPass:     boolean;
  hiddenFields: string[];
  guardResults: { rule: string; pass: boolean }[];
  allowed:      boolean;
}

function runSimulation(transition: WorkflowTransition, scopeRole: string): SimResult {
  const roles = transition.allowed_roles ?? [];
  const permPass = roles.length === 0 || roles.includes(scopeRole);

  // Simulate hidden fields (demo — in real system these come from field masks)
  const hiddenFields: string[] = permPass ? [] : ['internal_margin', 'dealer_cost'];

  // Simulate guard rules — treat them all as PASS in the demo
  const guardResults = (transition.guard_rules ?? []).map(rule => ({
    rule,
    pass: !rule.includes('warning'), // warning rules show as "warn / soft block"
  }));

  const allowed = permPass && guardResults.every(g => g.pass);

  return { permPass, hiddenFields, guardResults, allowed };
}

interface SimPanelProps {
  transition: WorkflowTransition;
  scopeRole:  string;
}

function SimPanel({ transition, scopeRole }: SimPanelProps) {
  const result = useMemo(() => runSimulation(transition, scopeRole), [transition, scopeRole]);

  const StepIcon = ({ status }: { status: 'pass' | 'fail' | 'info' }) => (
    <div className={`sim-step-icon ${status}`}>
      {status === 'pass' && <CheckCircle size={13} />}
      {status === 'fail' && <XCircle    size={13} />}
      {status === 'info' && <Info       size={13} />}
    </div>
  );

  return (
    <div
      style={{
        marginTop:    12,
        border:       '1px solid var(--border)',
        borderRadius: 8,
        overflow:     'hidden',
        background:   'var(--bg-sunken)',
      }}
    >
      <div
        style={{
          padding:       '8px 12px',
          borderBottom:  '1px solid var(--border)',
          fontSize:       11,
          fontWeight:    600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color:         'var(--text-muted)',
          display:       'flex',
          alignItems:    'center',
          gap:           6,
        }}
      >
        <Zap size={12} /> Simulation Result
      </div>

      {/* Step 1: Permission */}
      <div className="sim-step">
        <StepIcon status={result.permPass ? 'pass' : 'fail'} />
        <div>
          <div className="sim-step-label">Permission check</div>
          <div className="sim-step-detail">
            {result.permPass
              ? `ALLOW — role ${scopeRole} is in [${(transition.allowed_roles ?? []).join(', ') || 'any'}]`
              : `DENY — role ${scopeRole} not in [${(transition.allowed_roles ?? []).join(', ')}]`}
          </div>
        </div>
      </div>

      {/* Step 2: Field mask */}
      <div className="sim-step">
        <StepIcon status="info" />
        <div>
          <div className="sim-step-label">Field mask applied</div>
          <div className="sim-step-detail">
            {result.hiddenFields.length > 0
              ? `Hidden: ${result.hiddenFields.join(', ')}`
              : 'No fields hidden for this role'}
          </div>
        </div>
      </div>

      {/* Step 3: Guard rules */}
      <div className="sim-step">
        <StepIcon status={result.guardResults.every(g => g.pass) ? 'pass' : 'fail'} />
        <div>
          <div className="sim-step-label">Guard rules evaluated</div>
          {result.guardResults.length === 0 && (
            <div className="sim-step-detail">No guard rules configured</div>
          )}
          {result.guardResults.map(g => (
            <div key={g.rule} className="sim-step-detail" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {g.pass
                ? <CheckCircle size={10} style={{ color: 'var(--green)' }} />
                : <AlertTriangle size={10} style={{ color: 'var(--amber)' }} />}
              <span className="mono" style={{ fontSize: 10 }}>{g.rule}</span>
              <span style={{ color: g.pass ? 'var(--green)' : 'var(--amber)' }}>{g.pass ? 'PASS' : 'SOFT-BLOCK'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: Final */}
      <div className="sim-step" style={{ borderBottom: 'none' }}>
        <StepIcon status={result.allowed ? 'pass' : 'fail'} />
        <div>
          <div className="sim-step-label">Transition allowed</div>
          <div className="sim-step-detail" style={{ fontWeight: 600, color: result.allowed ? 'var(--green)' : 'var(--red)' }}>
            {result.allowed ? 'YES — transition may proceed' : 'NO — blocked by permission or guard'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transition inspector panel ───────────────────────────────
interface TransitionInspectorProps {
  transition:  WorkflowTransition | null;
  workflow:    WorkflowDefinition;
  scopeRole:   string;
}

function TransitionInspector({ transition, workflow, scopeRole }: TransitionInspectorProps) {
  const [showSim, setShowSim] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [draftDesc, setDraftDesc] = useState('');
  const { showToast, savedRules } = useStudioStore();

  // Reset when transition changes
  React.useEffect(() => {
    setShowSim(false);
    setEditing(false);
    setDraftRoles(transition?.allowed_roles ?? []);
    setDraftDesc(transition?.description ?? '');
  }, [transition?.transition_id]);

  function handleSave() {
    showToast(`Transition "${transition?.command}" saved as draft`, 'success');
    setEditing(false);
  }

  if (!transition) {
    return (
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          justifyContent:'center',
          height:        '100%',
          gap:           10,
          color:         'var(--text-muted)',
          padding:       32,
          textAlign:     'center',
        }}
      >
        <ArrowRight size={32} style={{ color: 'var(--text-subtle)', marginBottom: 4 }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Select a transition</div>
        <div style={{ fontSize: 13 }}>Click any edge on the canvas to inspect its details</div>
      </div>
    );
  }

  // Overlay trace: which layer added this transition
  const overlayTrace: { layer: LayerCode; note: string }[] = [
    { layer: 'platform', note: transition.source_layer === 'platform' ? 'Defined here' : 'Not present' },
    { layer: 'vertical', note: transition.source_layer === 'vertical' ? 'Added at this layer' : 'No change' },
    { layer: 'tenant',   note: transition.source_layer === 'tenant'   ? 'Added at this layer' : 'No change' },
    { layer: 'node',     note: transition.source_layer === 'node'     ? 'Added at this layer' : 'No change' },
    { layer: 'role',     note: transition.source_layer === 'role'     ? 'Added at this layer' : 'No change' },
  ];

  const fromState = workflow.states.find(s => s.state_id === transition.from_state);
  const toState   = workflow.states.find(s => s.state_id === transition.to_state);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          padding:      '14px 16px',
          borderBottom: '1px solid var(--border)',
          background:   'var(--bg-elev)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          gap:          8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          Transition Inspector
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {transition.protected && (
            <span className="chip protected" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Shield size={10} /> Protected
            </span>
          )}
          {!transition.protected && !editing && (
            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          {editing && (
            <>
              <button className="btn btn-sm btn-secondary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-sm btn-primary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={handleSave}>Save</button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* From → To */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 8 }}>
            State transition
          </div>
          <div
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           10,
              padding:       '10px 14px',
              background:    'var(--bg-elev)',
              border:        '1px solid var(--border)',
              borderRadius:  8,
            }}
          >
            <div className="col" style={{ gap: 2, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                {fromState?.state_id ?? transition.from_state}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fromState?.label}</span>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
            <div className="col" style={{ gap: 2, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
                {toState?.state_id ?? transition.to_state}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{toState?.label}</span>
            </div>
          </div>
        </div>

        {/* Command */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Command
          </div>
          <span className="chip draft mono" style={{ fontSize: 12 }}>{transition.command}</span>
        </div>

        {/* Allowed roles */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Allowed roles
          </div>
          {editing ? (
            <textarea
              className="value-input mono"
              style={{ width: '100%', fontSize: 12, resize: 'vertical', minHeight: 52 }}
              value={draftRoles.join('\n')}
              onChange={e => setDraftRoles(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              placeholder="One role per line, e.g. SALES_MANAGER"
            />
          ) : (draftRoles.length === 0 ? (
            <span className="muted" style={{ fontSize: 12 }}>Any role</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {draftRoles.map(role => (
                <span
                  key={role}
                  className="chip inherited mono"
                  style={{
                    fontSize:   11,
                    background: scopeRole === role ? 'var(--green-soft)' : undefined,
                    color:      scopeRole === role ? 'var(--green)'      : undefined,
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Guard rules */}
        {(transition.guard_rules ?? []).length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Guard rules
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {transition.guard_rules.map(rule => (
                <button
                  key={rule}
                  className="chip overridden mono"
                  style={{ fontSize: 10, textAlign: 'left', cursor: 'pointer' }}
                  title={`Rule: ${rule}`}
                >
                  {rule}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Before / After hooks */}
        {((transition.before_hooks ?? []).length > 0 || (transition.after_hooks ?? []).length > 0) && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
              Hooks
            </div>
            {(transition.before_hooks ?? []).length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Before: </span>
                {transition.before_hooks.map(h => (
                  <span key={h} className="chip inherited mono" style={{ fontSize: 10, marginLeft: 4 }}>{h}</span>
                ))}
              </div>
            )}
            {(transition.after_hooks ?? []).length > 0 && (
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>After: </span>
                {transition.after_hooks.map(h => (
                  <span key={h} className="chip inherited mono" style={{ fontSize: 10, marginLeft: 4 }}>{h}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source layer */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
            Source layer
          </div>
          <LayerBadge layer={transition.source_layer} />
        </div>

        {/* Overlay trace */}
        <div>
          <div
            style={{
              fontSize:      11,
              fontWeight:    600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color:         'var(--text-muted)',
              marginBottom:  8,
              display:       'flex',
              alignItems:    'center',
              gap:           6,
            }}
          >
            <Layers size={11} /> Overlay trace
          </div>
          <div
            style={{
              border:       '1px solid var(--border)',
              borderRadius: 8,
              overflow:     'hidden',
            }}
          >
            {overlayTrace.map((entry, i) => (
              <div
                key={entry.layer}
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           10,
                  padding:       '7px 12px',
                  borderBottom:  i < overlayTrace.length - 1 ? '1px solid var(--border)' : 'none',
                  background:    entry.layer === transition.source_layer ? 'var(--accent-soft, var(--bg-sunken))' : undefined,
                }}
              >
                <LayerBadge layer={entry.layer} small />
                <span style={{ fontSize: 11, color: entry.layer === transition.source_layer ? 'var(--accent)' : 'var(--text-muted)', flex: 1 }}>
                  {entry.note}
                </span>
                {entry.layer === transition.source_layer && (
                  <CheckSquare size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {transition.description && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 4 }}>
              Description
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{transition.description}</p>
          </div>
        )}

        {/* Simulate button */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <button
            className="btn btn-sm btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowSim(s => !s)}
          >
            <Play size={13} />
            {showSim ? 'Hide simulation' : 'Simulate this transition'}
          </button>

          {showSim && (
            <SimPanel transition={transition} scopeRole={scopeRole} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Build React Flow nodes & edges ──────────────────────────
function buildNodesAndEdges(
  workflow:       WorkflowDefinition,
  layerFilter:    LayerCode | 'all',
  selectedEdgeId: string | null,
) {
  const layout = computeLayout(workflow.states);

  const nodes: Node<StateNodeData>[] = workflow.states.map(state => {
    const pos = layout[state.state_id] ?? { x: 0, y: 0 };
    return {
      id:       state.state_id,
      type:     'state',
      position: pos,
      data:     { state, hasWarning: false },
    };
  });

  const transitions = layerFilter === 'all'
    ? workflow.transitions
    : workflow.transitions.filter(t => t.source_layer === layerFilter);

  const edges: Edge[] = transitions.map(tr => {
    const color    = edgeColor(tr);
    const selected = tr.transition_id === selectedEdgeId;
    return {
      id:           tr.transition_id,
      source:       tr.from_state,
      target:       tr.to_state,
      animated:     true,
      label:        tr.command,
      labelStyle:   { fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono,monospace)', fill: 'var(--text)' },
      labelBgStyle: { fill: 'var(--bg-elev,#fff)', fillOpacity: 0.9, rx: 4 },
      style:        { stroke: selected ? 'var(--accent,#6366f1)' : color, strokeWidth: selected ? 2.5 : 1.5 },
      markerEnd:    { type: MarkerType.ArrowClosed, color: selected ? 'var(--accent,#6366f1)' : color, width: 16, height: 16 },
      data:         { transition: tr },
    };
  });

  return { nodes, edges };
}

// ─── Main WorkflowDesigner component ─────────────────────────
interface Props {
  artifactKey: string;
}

export default function WorkflowDesigner({ artifactKey }: Props) {
  const { scope, showToast } = useStudioStore();
  const scopeRole = scope.role_code ?? 'OEM_ADMIN';

  // ── Data ──────────────────────────────────────────────────
  const rawWorkflow = useMemo(() => {
    // Direct match first
    let wf = getWorkflow(artifactKey);
    if (!wf) {
      // Try related: entity.vehicle_order → workflow.vehicle_order
      const guessed = artifactKey.replace('entity.', 'workflow.');
      wf = getWorkflow(guessed);
    }
    if (!wf) {
      // Fall back to first available workflow
      const all = getWorkflows();
      wf = all[0] ?? undefined;
    }
    return wf;
  }, [artifactKey]);

  const workflow = useMemo(
    () => (rawWorkflow ? normaliseWorkflow(rawWorkflow) : null),
    [rawWorkflow],
  );

  const layerStack = useMemo(() => getLayerStack(artifactKey), [artifactKey]);
  const availableLayers: LayerCode[] = useMemo(
    () => [...new Set(workflow?.transitions.map(t => t.source_layer) ?? [])] as LayerCode[],
    [workflow],
  );

  // ── UI state ──────────────────────────────────────────────
  const [layerFilter,       setLayerFilter]       = useState<LayerCode | 'all'>('all');
  const [selectedEdgeId,    setSelectedEdgeId]    = useState<string | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);

  // ── React Flow state ─────────────────────────────────────
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => workflow
      ? buildNodesAndEdges(workflow, layerFilter, selectedEdgeId)
      : { nodes: [], edges: [] },
    [workflow, layerFilter, selectedEdgeId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when filter / selected edge changes
  React.useEffect(() => {
    if (!workflow) return;
    const { nodes: n, edges: e } = buildNodesAndEdges(workflow, layerFilter, selectedEdgeId);
    setNodes(n);
    setEdges(e);
  }, [workflow, layerFilter, selectedEdgeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edge click ────────────────────────────────────────────
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const tr = (edge.data as { transition: WorkflowTransition })?.transition ?? null;
    setSelectedEdgeId(edge.id);
    setSelectedTransition(tr);
  }, []);

  // Click on canvas background deselects
  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null);
    setSelectedTransition(null);
  }, []);

  // ── Actions ───────────────────────────────────────────────
  const handleValidate = useCallback(() => {
    showToast('Validation complete — 0 errors', 'success');
  }, [showToast]);

  const handleSimulateCommand = useCallback(() => {
    if (!selectedTransition) {
      showToast('Select a transition edge first', 'info');
    } else {
      showToast(`Simulating command: ${selectedTransition.command}`, 'info');
    }
  }, [selectedTransition, showToast]);

  // ── Not found ─────────────────────────────────────────────
  if (!workflow) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center', margin: 32 }}>
        <AlertTriangle size={32} style={{ color: 'var(--text-subtle)', marginBottom: 12 }} />
        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No workflow found</p>
        <p className="muted" style={{ fontSize: 13 }}>
          No workflow definition is registered for{' '}
          <span className="mono">{artifactKey}</span>.
        </p>
      </div>
    );
  }

  const LAYER_OPTIONS: { value: LayerCode | 'all'; label: string }[] = [
    { value: 'all', label: 'All layers' },
    ...availableLayers.map(l => ({
      value: l,
      label: l.charAt(0).toUpperCase() + l.slice(1),
    })),
  ];

  return (
    <div
      className="workflow-container"
      style={{
        display:       'flex',
        height:        '100%',
        overflow:      'hidden',
        background:    'var(--bg)',
      }}
    >
      {/* ── Left: Canvas (60%) ── */}
      <div
        style={{
          flex:          '0 0 60%',
          display:       'flex',
          flexDirection: 'column',
          borderRight:   '1px solid var(--border)',
          overflow:      'hidden',
          position:      'relative',
        }}
      >
        {/* Canvas toolbar */}
        <div
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           8,
            padding:       '8px 16px',
            borderBottom:  '1px solid var(--border)',
            background:    'var(--bg-elev)',
            flexShrink:    0,
          }}
        >
          {/* Workflow title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {workflow.label || workflow.artifact_key}
            </span>
            <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>
              {workflow.states.length} states · {workflow.transitions.length} transitions
            </span>
          </div>

          {/* Layer filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 130 }}
            value={layerFilter}
            onChange={e => setLayerFilter(e.target.value as LayerCode | 'all')}
            title="Filter transitions by source layer"
          >
            {LAYER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Simulate command */}
          <button className="btn btn-sm btn-ghost" onClick={handleSimulateCommand}>
            <Play size={13} /> Simulate Command
          </button>

          {/* Validate */}
          <button className="btn btn-sm btn-primary" onClick={handleValidate}>
            <CheckCircle size={13} /> Validate
          </button>
        </div>

        {/* React Flow canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-right"
            defaultEdgeOptions={{ animated: true }}
          >
            <Background color="var(--border, #e5e7eb)" gap={20} size={1} />
            <Controls
              style={{
                background:   'var(--bg-elev)',
                border:       '1px solid var(--border)',
                borderRadius: 8,
                boxShadow:    'var(--shadow-sm)',
              }}
            />
            <MiniMap
              style={{
                background:   'var(--bg-elev)',
                border:       '1px solid var(--border)',
                borderRadius: 8,
              }}
              nodeColor={(n) => {
                const state = (n.data as StateNodeData)?.state;
                if (!state) return 'var(--border-strong)';
                const st = state.state_type;
                if (st === 'initial')   return '#3b82f6';
                if (st === 'terminal')  return '#22c55e';
                if (st === 'exception') return '#ef4444';
                return 'var(--text-subtle)';
              }}
            />
          </ReactFlow>
        </div>

        {/* Layer stack summary at bottom */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '6px 16px',
            borderTop:    '1px solid var(--border)',
            background:   'var(--bg-elev)',
            flexShrink:   0,
            overflowX:    'auto',
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
            Layer stack:
          </span>
          {layerStack.map(ls => (
            ls.delta_count > 0 ? (
              <span key={ls.layer} title={`${ls.delta_count} delta(s) at ${ls.label}`}>
                <LayerBadge layer={ls.layer} small />
              </span>
            ) : null
          ))}
          {layerStack.every(ls => ls.delta_count === 0) && (
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>No overlays</span>
          )}
        </div>
      </div>

      {/* ── Right: Inspector (40%) ── */}
      <div
        style={{
          flex:          '0 0 40%',
          display:       'flex',
          flexDirection: 'column',
          overflow:      'hidden',
          background:    'var(--bg-elev)',
        }}
      >
        <div
          className="panel-header"
          style={{
            padding:      '12px 16px',
            borderBottom: '1px solid var(--border)',
            flexShrink:   0,
          }}
        >
          <span className="panel-title">Transition Inspector</span>
          {selectedTransition && (
            <span className="chip inherited mono" style={{ fontSize: 10 }}>
              {selectedTransition.transition_id}
            </span>
          )}
        </div>

        <div className="panel-body" style={{ flex: 1, overflowY: 'auto' }}>
          <TransitionInspector
            transition={selectedTransition}
            workflow={workflow}
            scopeRole={scopeRole}
          />
        </div>
      </div>
    </div>
  );
}
