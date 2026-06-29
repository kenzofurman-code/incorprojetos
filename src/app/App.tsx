import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuthPage } from '../features/auth/AuthPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ApprovalPage } from '../features/approvals/ApprovalPage';
import { DocumentDetailPage } from '../features/documents/DocumentDetailPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { PrintControlPage } from '../features/print-control/PrintControlPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { SitePage } from '../features/site/SitePage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/documentos" element={<DocumentsPage />} />
        <Route path="/documentos/:documentId" element={<DocumentDetailPage />} />
        <Route path="/aprovacoes" element={<ApprovalPage />} />
        <Route path="/obra" element={<SitePage />} />
        <Route path="/impressos" element={<PrintControlPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
