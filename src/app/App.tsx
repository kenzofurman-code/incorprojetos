import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuthPage } from '../features/auth/AuthPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ApprovalPage } from '../features/approvals/ApprovalPage';
import { DocumentDetailPage } from '../features/documents/DocumentDetailPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { PrintControlPage } from '../features/print-control/PrintControlPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SitePage } from '../features/site/SitePage';
import { SchedulePage } from '../features/schedule/SchedulePage';

const ComparisonPage = lazy(() =>
  import('../features/documents/ComparisonPage').then((module) => ({ default: module.ComparisonPage })),
);

export function App() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Carregando módulo...</p>}>
      <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/documentos" element={<DocumentsPage />} />
          <Route path="/documentos/:documentId" element={<DocumentDetailPage />} />
          <Route path="/documentos/:documentId/comparar" element={<ComparisonPage />} />
          <Route path="/comparacao" element={<ComparisonPage />} />
          <Route path="/aprovacoes" element={<ApprovalPage />} />
          <Route path="/obra" element={<SitePage />} />
          <Route path="/cronograma" element={<SchedulePage />} />
          <Route path="/impressos" element={<PrintControlPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
