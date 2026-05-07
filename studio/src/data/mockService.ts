// ============================================================
// iDMS Admin Studio — Mock Data Service
// Loads seed JSON + provides typed accessor functions
// ============================================================
import seedData from './seed.json';
import type {
  ArtifactRegistryItem, EntitySchema, OverlayDelta, LayerStack,
  RuleDefinition, WorkflowDefinition, PermissionRule, SimulationCase,
  ReleasePackage, ImpactFinding, CatalogAttribute, Tenant, Node, Role,
  Layer, ExplainTrace, ScopeContext
} from '../types';
import {
  MOCK_ENTITIES, ENTITY_TEMPLATES, ADVANCED_ATTRIBUTE_CATALOG,
  MOCK_FIELD_DEPENDENCIES, MOCK_SCHEMA_DIFF, MOCK_COMPILE_READINESS,
  MOCK_DOCUMENT_CODE_SETTINGS, MOCK_MASTER_CODE_SETTINGS,
} from './entityDesignerData';
import type {
  EntityDefinition, EntityTemplate, AdvancedCatalogAttribute,
  FieldDependency, SchemaDiff, CompileReadiness,
  DocumentCodeSetting, MasterCodeSetting,
} from '../types/entityDesigner';

// ===== Raw seed =====
const seed = seedData as any;

// ===== Tenant & Org =====
export const getTenant = (): Tenant => seed.tenant;
export const getNodes = (): Node[] => seed.nodes;
export const getRoles = (): Role[] => seed.roles;
export const getLayers = (): Layer[] => seed.layers;
export const getEnvironments = (): string[] => seed.environments;

// ===== Artifact Registry =====
export const getArtifacts = (): ArtifactRegistryItem[] => seed.artifact_registry;

export const getArtifact = (key: string): ArtifactRegistryItem | undefined =>
  seed.artifact_registry.find((a: ArtifactRegistryItem) => a.artifact_key === key);

// ===== Entity Schemas =====
export const getEntitySchemas = (): EntitySchema[] => seed.entity_schemas;

export const getEntitySchema = (key: string): EntitySchema | undefined =>
  seed.entity_schemas.find((e: EntitySchema) => e.artifact_key === key);

// ===== Rules =====
export const getRules = (entityType?: string): RuleDefinition[] => {
  if (!entityType) return seed.rules;
  return seed.rules.filter((r: RuleDefinition) => r.entity_type === entityType);
};

export const getRule = (ruleId: string): RuleDefinition | undefined =>
  seed.rules.find((r: RuleDefinition) => r.rule_id === ruleId);

// ===== Workflows =====
export const getWorkflows = (): WorkflowDefinition[] => seed.workflows;

export const getWorkflow = (key: string): WorkflowDefinition | undefined =>
  seed.workflows.find((w: WorkflowDefinition) => w.artifact_key === key);

// ===== Overlay Deltas =====
export const getOverlayDeltas = (artifactKey?: string): OverlayDelta[] => {
  if (!artifactKey) return seed.overlay_deltas;
  return seed.overlay_deltas.filter((d: OverlayDelta) => d.artifact_key === artifactKey);
};

export const getLayerStack = (artifactKey: string): LayerStack[] => {
  const deltas: OverlayDelta[] = getOverlayDeltas(artifactKey);
  const layers = getLayers();
  return layers.map(layer => ({
    layer: layer.code,
    label: layer.label,
    scope: getScopeLabel(layer.code),
    delta_count: deltas.filter(d => d.layer === layer.code).length,
    last_changed: deltas.filter(d => d.layer === layer.code)[0]?.created_at,
    status: deltas.filter(d => d.layer === layer.code)[0]?.status ?? 'active',
    author: deltas.filter(d => d.layer === layer.code)[0]?.author,
    deltas: deltas.filter(d => d.layer === layer.code),
  }));
};

function getScopeLabel(layer: string): string {
  const map: Record<string, string> = {
    platform: 'iDMS Platform',
    vertical: 'Automotive DMS',
    tenant: 'Bajaj Auto Demo',
    node: 'Pune Central Branch',
    role: 'SALES_EXECUTIVE',
  };
  return map[layer] ?? layer;
}

// ===== Explain Trace =====
export const getExplainTrace = (artifactKey: string): ExplainTrace[] => {
  const schema = getEntitySchema(artifactKey);
  if (!schema) return [];
  return schema.fields.map(field => {
    const deltas = getOverlayDeltas(artifactKey).filter(d => d.target_path.includes(field.field_id));
    return {
      field_path: `fields.${field.field_id}`,
      layers: [
        { layer: 'platform' as const, note: field.source_layer === 'platform' ? 'Defined here' : 'Not present' },
        { layer: 'vertical' as const, note: field.source_layer === 'vertical' ? 'Added at this layer' : deltas.find(d => d.layer === 'vertical') ? deltas.find(d => d.layer === 'vertical')!.operation : 'No change' },
        { layer: 'tenant' as const, note: field.source_layer === 'tenant' ? 'Added at this layer' : deltas.find(d => d.layer === 'tenant') ? `${deltas.find(d => d.layer === 'tenant')!.operation}: ${JSON.stringify(deltas.find(d => d.layer === 'tenant')!.value)}` : 'No change' },
        { layer: 'node' as const, note: deltas.find(d => d.layer === 'node') ? `${deltas.find(d => d.layer === 'node')!.operation}: ${JSON.stringify(deltas.find(d => d.layer === 'node')!.value)}` : 'No change' },
        { layer: 'role' as const, note: field.visibility_by_role?.['SALES_EXECUTIVE'] === 'hidden' ? 'Hidden for SALES_EXECUTIVE' : 'Visible' },
      ],
      result: field.visibility === 'hidden'
        ? `Hidden for selected role`
        : `${field.required ? 'Required' : 'Optional'} — ${field.field_type}`,
    };
  });
};

// ===== Permissions =====
export const getPermissionRules = (artifactKey?: string): PermissionRule[] => {
  if (!artifactKey) return seed.permission_rules;
  const resource = artifactKey.replace('entity.', '').replace('permission.', '');
  return seed.permission_rules.filter((p: PermissionRule) =>
    p.resource_ref?.includes(resource)
  );
};

// ===== Simulation =====
export const getSimulationCases = (entityType?: string): SimulationCase[] => {
  if (!entityType) return seed.simulation_cases;
  return seed.simulation_cases.filter((s: SimulationCase) => s.entity_type === entityType);
};

// ===== Impact =====
export const getImpactFindings = (artifactKey?: string): ImpactFinding[] =>
  seed.impact_findings;

// ===== Release Packages =====
export const getReleasePackages = (): ReleasePackage[] => seed.release_packages;
export const getReleasePackage = (id: string): ReleasePackage | undefined =>
  seed.release_packages.find((r: ReleasePackage) => r.release_id === id);

// ===== Attribute Catalog =====
export const getAttributeCatalog = (): CatalogAttribute[] => seed.attribute_catalog;

// ===== Studio Home =====
export const getStudioHome = () => seed.studio_home;

// ===== Entity Designer =====
export const getEntityDefinitions = (
  savedEntities: Record<string, EntityDefinition> = {}
): EntityDefinition[] => {
  const saved = Object.values(savedEntities);
  const savedTypes = new Set(saved.map(e => e.entityType));
  const fromMock = MOCK_ENTITIES.filter(e => !savedTypes.has(e.entityType));
  return [...saved, ...fromMock];
};

export const getEntityDefinition = (
  entityType: string,
  savedEntities: Record<string, EntityDefinition> = {}
): EntityDefinition | undefined =>
  savedEntities[entityType] ?? MOCK_ENTITIES.find(e => e.entityType === entityType);

export const getEntityTemplates = (): EntityTemplate[] => ENTITY_TEMPLATES;

export const getAdvancedAttributeCatalog = (): AdvancedCatalogAttribute[] =>
  ADVANCED_ATTRIBUTE_CATALOG;

export const getFieldDependencies = (
  entityType: string,
  fieldId: string
): FieldDependency[] =>
  MOCK_FIELD_DEPENDENCIES[entityType]?.[fieldId] ?? [];

export const getSchemaDiff = (entityType: string): SchemaDiff | undefined =>
  MOCK_SCHEMA_DIFF[entityType];

export const getCompileReadiness = (entityType: string): CompileReadiness | undefined =>
  MOCK_COMPILE_READINESS[entityType];

// ===== Code Settings (for auto_number fields) =====
export const getDocumentCodeSettings = (): DocumentCodeSetting[] => MOCK_DOCUMENT_CODE_SETTINGS;
export const getMasterCodeSettings = (): MasterCodeSetting[] => MOCK_MASTER_CODE_SETTINGS;
export const getCodeSettingById = (type: 'document' | 'master', id: string): DocumentCodeSetting | MasterCodeSetting | null => {
  const list = type === 'document' ? MOCK_DOCUMENT_CODE_SETTINGS : MOCK_MASTER_CODE_SETTINGS;
  return list.find(s => s.id === id) ?? null;
};

// ===== Compiled Preview =====
export const getCompiledPreview = (artifactKey: string) =>
  seed.compiled_previews?.find((c: any) => c.artifact_key === artifactKey);

// ===== Default scope context =====
export const getDefaultScope = (): ScopeContext => ({
  environment: 'DEV',
  tenant_id: 'ten_bajaj_demo',
  tenant_name: 'Bajaj Auto Demo',
  node_id: 'node_pune_central',
  node_label: 'Pune Central Branch',
  role_code: 'OEM_ADMIN',
  role_name: 'OEM Administrator',
  layer: 'tenant',
  mode: 'draft',
});

// ===== Rule evaluator (in-memory simulation) =====
const OPS: Record<string, (a: unknown, b: unknown) => boolean> = {
  '==':         (a, b) => String(a) === String(b),
  '!=':         (a, b) => String(a) !== String(b),
  '>':          (a, b) => Number(a) > Number(b),
  '>=':         (a, b) => Number(a) >= Number(b),
  '<':          (a, b) => Number(a) < Number(b),
  '<=':         (a, b) => Number(a) <= Number(b),
  'EQ':         (a, b) => String(a) === String(b),
  'NEQ':        (a, b) => String(a) !== String(b),
  'GT':         (a, b) => Number(a) > Number(b),
  'GTE':        (a, b) => Number(a) >= Number(b),
  'LT':         (a, b) => Number(a) < Number(b),
  'LTE':        (a, b) => Number(a) <= Number(b),
  'IS_NULL':    (a) => a == null || a === '',
  'IS_NOT_NULL':(a) => a != null && a !== '',
  'AND':        () => true,
  'OR':         () => true,
  'contains':   (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
  'startsWith': (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase()),
  'in':         (a, b) => (Array.isArray(b) ? b : String(b).split(',')).map(s => String(s).trim()).includes(String(a)),
};

function getNestedVal(obj: any, path: string): unknown {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function evaluateRule(rule: RuleDefinition, payload: Record<string, unknown>) {
  const results = rule.conditions.map(c => {
    const lhs = getNestedVal(payload, c.field);
    const op = OPS[c.op];
    const pass = op ? op(lhs, c.value) : false;
    return { condition: c, lhs, pass };
  });
  const matched = rule.combinator === 'OR'
    ? results.some(r => r.pass)
    : results.every(r => r.pass);
  return { matched, results, rule };
}
