import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } } });

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
    Loading…
  </div>
);

function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
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
            <Route path="settings" element={
              <div className="empty">
                <p className="empty-title">Settings</p>
                <p className="empty-desc">Platform settings coming soon.</p>
              </div>
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
