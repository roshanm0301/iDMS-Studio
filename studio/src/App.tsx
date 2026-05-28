import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/shell/AppShell';
import StudioHomePage from './pages/StudioHomePage';
import ArtifactRegistryPage from './pages/ArtifactRegistryPage';
import ArtifactCockpitPage from './pages/ArtifactCockpitPage';
import ReleasesPage from './pages/ReleasesPage';
import ReleaseDetailPage from './pages/ReleaseDetailPage';
import AttributeCatalogPage from './pages/AttributeCatalogPage';

const EntityListPage = lazy(() => import('./pages/EntityListPage'));
const CreateEntityPage = lazy(() => import('./pages/CreateEntityPage'));
const SchemaBuilderPage = lazy(() => import('./pages/SchemaBuilderPage'));
const RelationshipListPage = lazy(() => import('./pages/RelationshipListPage'));
const CreateRelationshipPage = lazy(() => import('./pages/CreateRelationshipPage'));
const RelationshipBuilderPage = lazy(() => import('./pages/RelationshipBuilderPage'));

// UI Studio pages (lazy-loaded)
const UIStudioListPage = lazy(() =>
  import('./pages/ui-studio/UIStudioListPage').then(m => ({ default: m.UIStudioListPage }))
);
const UIStudioNewViewPage = lazy(() =>
  import('./pages/ui-studio/UIStudioNewViewPage').then(m => ({ default: m.UIStudioNewViewPage }))
);
const UIStudioEditorPage = lazy(() =>
  import('./pages/ui-studio/UIStudioEditorPage').then(m => ({ default: m.UIStudioEditorPage }))
);
const UIStudioRuntimePreviewPage = lazy(() =>
  import('./pages/ui-studio/UIStudioRuntimePreviewPage').then(m => ({ default: m.UIStudioRuntimePreviewPage }))
);

// Rule Engine pages (lazy-loaded)
const RuleRegistryPage = lazy(() => import('./pages/rule-engine/RuleRegistryPage'));
const RuleDetailPage = lazy(() => import('./pages/rule-engine/RuleDetailPage'));
const ExpressionEditorPage = lazy(() => import('./pages/rule-engine/ExpressionEditorPage'));
const ValidationRulesPage = lazy(() => import('./pages/rule-engine/ValidationRulesPage'));
const CalculationEnginePage = lazy(() => import('./pages/rule-engine/CalculationEnginePage'));
const ChargeRulesPage = lazy(() => import('./pages/rule-engine/ChargeRulesPage'));
const TaxRulesPage = lazy(() => import('./pages/rule-engine/TaxRulesPage'));
const AccountingRulesPage = lazy(() => import('./pages/rule-engine/AccountingRulesPage'));
const FinancialOrchestrationPage = lazy(() => import('./pages/rule-engine/FinancialOrchestrationPage'));
const WorkflowDesignerPage = lazy(() => import('./pages/rule-engine/WorkflowDesignerPage'));
const ApprovalEnginePage = lazy(() => import('./pages/rule-engine/ApprovalEnginePage'));
const WorkflowSimulationPage = lazy(() => import('./pages/rule-engine/WorkflowSimulationPage'));

// Create/Edit form pages
const CreateValidationRulePage = lazy(() => import('./pages/rule-engine/CreateValidationRulePage'));
const CreateCalculationPage = lazy(() => import('./pages/rule-engine/CreateCalculationPage'));
const CreateChargeRulePage = lazy(() => import('./pages/rule-engine/CreateChargeRulePage'));
const CreateTaxRulePage = lazy(() => import('./pages/rule-engine/CreateTaxRulePage'));
const CreateAccountingRulePage = lazy(() => import('./pages/rule-engine/CreateAccountingRulePage'));
const CreateApprovalPolicyPage = lazy(() => import('./pages/rule-engine/CreateApprovalPolicyPage'));

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } } });

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
    Loading…
  </div>
);

function App() {
  return (
    <QueryClientProvider client={qc}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/studio" replace />} />
          <Route path="/admin/studio" element={<AppShell />}>
            <Route index element={<StudioHomePage />} />
            <Route path="artifacts" element={<ArtifactRegistryPage />} />
            <Route path="artifacts/:artifactKey/*" element={<ArtifactCockpitPage />} />
            <Route path="releases" element={<ReleasesPage />} />
            <Route path="releases/:releaseId" element={<ReleaseDetailPage />} />
            <Route path="attributes" element={<AttributeCatalogPage />} />
            <Route path="entities" element={
              <Suspense fallback={<PageLoader />}><EntityListPage /></Suspense>
            } />
            <Route path="entities/new" element={
              <Suspense fallback={<PageLoader />}><CreateEntityPage /></Suspense>
            } />
            <Route path="entities/:entityType/schema" element={
              <Suspense fallback={<PageLoader />}><SchemaBuilderPage /></Suspense>
            } />
            <Route path="relationships" element={
              <Suspense fallback={<PageLoader />}><RelationshipListPage /></Suspense>
            } />
            <Route path="relationships/new" element={
              <Suspense fallback={<PageLoader />}><CreateRelationshipPage /></Suspense>
            } />
            <Route path="relationships/:relationshipId" element={
              <Suspense fallback={<PageLoader />}><RelationshipBuilderPage /></Suspense>
            } />
            <Route path="settings" element={
              <div className="empty">
                <p className="empty-title">Settings</p>
                <p className="empty-desc">Platform settings coming soon.</p>
              </div>
            } />

            {/* Rule Engine */}
            <Route path="rule-engine" element={
              <Suspense fallback={<PageLoader />}><RuleRegistryPage /></Suspense>
            } />
            <Route path="rule-engine/:familyId" element={
              <Suspense fallback={<PageLoader />}><RuleDetailPage /></Suspense>
            } />
            <Route path="rule-engine/expression/:expressionId" element={
              <Suspense fallback={<PageLoader />}><ExpressionEditorPage /></Suspense>
            } />
            <Route path="rule-engine/expression/new" element={
              <Suspense fallback={<PageLoader />}><ExpressionEditorPage /></Suspense>
            } />
            <Route path="rule-engine/validations" element={
              <Suspense fallback={<PageLoader />}><ValidationRulesPage /></Suspense>
            } />
            <Route path="rule-engine/calculations" element={
              <Suspense fallback={<PageLoader />}><CalculationEnginePage /></Suspense>
            } />
            <Route path="rule-engine/charges" element={
              <Suspense fallback={<PageLoader />}><ChargeRulesPage /></Suspense>
            } />
            <Route path="rule-engine/tax" element={
              <Suspense fallback={<PageLoader />}><TaxRulesPage /></Suspense>
            } />
            <Route path="rule-engine/accounting" element={
              <Suspense fallback={<PageLoader />}><AccountingRulesPage /></Suspense>
            } />
            <Route path="rule-engine/orchestration" element={
              <Suspense fallback={<PageLoader />}><FinancialOrchestrationPage /></Suspense>
            } />
            <Route path="rule-engine/workflows" element={
              <Suspense fallback={<PageLoader />}><WorkflowDesignerPage /></Suspense>
            } />
            <Route path="rule-engine/approvals" element={
              <Suspense fallback={<PageLoader />}><ApprovalEnginePage /></Suspense>
            } />
            <Route path="rule-engine/simulation" element={
              <Suspense fallback={<PageLoader />}><WorkflowSimulationPage /></Suspense>
            } />

            {/* Rule Engine — Create/Edit forms */}
            <Route path="rule-engine/validations/new" element={
              <Suspense fallback={<PageLoader />}><CreateValidationRulePage /></Suspense>
            } />
            <Route path="rule-engine/validations/:ruleId/edit" element={
              <Suspense fallback={<PageLoader />}><CreateValidationRulePage /></Suspense>
            } />
            <Route path="rule-engine/calculations/new" element={
              <Suspense fallback={<PageLoader />}><CreateCalculationPage /></Suspense>
            } />
            <Route path="rule-engine/calculations/:calcId/edit" element={
              <Suspense fallback={<PageLoader />}><CreateCalculationPage /></Suspense>
            } />
            <Route path="rule-engine/charges/new" element={
              <Suspense fallback={<PageLoader />}><CreateChargeRulePage /></Suspense>
            } />
            <Route path="rule-engine/charges/:ruleId/edit" element={
              <Suspense fallback={<PageLoader />}><CreateChargeRulePage /></Suspense>
            } />
            <Route path="rule-engine/tax/new" element={
              <Suspense fallback={<PageLoader />}><CreateTaxRulePage /></Suspense>
            } />
            <Route path="rule-engine/tax/:ruleId/edit" element={
              <Suspense fallback={<PageLoader />}><CreateTaxRulePage /></Suspense>
            } />
            <Route path="rule-engine/accounting/new" element={
              <Suspense fallback={<PageLoader />}><CreateAccountingRulePage /></Suspense>
            } />
            <Route path="rule-engine/accounting/:ruleId/edit" element={
              <Suspense fallback={<PageLoader />}><CreateAccountingRulePage /></Suspense>
            } />
            <Route path="rule-engine/approvals/new" element={
              <Suspense fallback={<PageLoader />}><CreateApprovalPolicyPage /></Suspense>
            } />
            <Route path="rule-engine/approvals/:policyId/edit" element={
              <Suspense fallback={<PageLoader />}><CreateApprovalPolicyPage /></Suspense>
            } />
          </Route>

          {/* UI Studio — separate module at /admin/ui-studio */}
          <Route path="/admin/ui-studio" element={<AppShell />}>
            <Route index element={
              <Suspense fallback={<PageLoader />}><UIStudioListPage /></Suspense>
            } />
            <Route path="new" element={
              <Suspense fallback={<PageLoader />}><UIStudioNewViewPage /></Suspense>
            } />
            <Route path="editor/:viewId" element={
              <Suspense fallback={<PageLoader />}><UIStudioEditorPage /></Suspense>
            } />
            <Route path="preview/:viewId" element={
              <Suspense fallback={<PageLoader />}><UIStudioRuntimePreviewPage /></Suspense>
            } />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
