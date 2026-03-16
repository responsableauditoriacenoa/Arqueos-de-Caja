import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout       from './components/layout/AppLayout';
import { ToastProvider } from './components/common/Toast';
import Dashboard       from './pages/Dashboard';
import NewAudit        from './pages/NewAudit';
import AuditDetail     from './pages/AuditDetail';
import AuditEvaluation from './pages/AuditEvaluation';
import AuditFindings   from './pages/AuditFindings';
import AuditSignatures from './pages/AuditSignatures';
import AuditReport     from './pages/AuditReport';
import History         from './pages/History';
import Settings        from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/nueva"     element={<NewAudit />} />
            <Route path="/auditoria/:id" element={<AuditDetail />}>
              <Route index                   element={<Navigate to="evaluacion" replace />} />
              <Route path="evaluacion"       element={<AuditEvaluation />} />
              <Route path="hallazgos"        element={<AuditFindings />} />
              <Route path="firmas"           element={<AuditSignatures />} />
              <Route path="informe"          element={<AuditReport />} />
            </Route>
            <Route path="/historial" element={<History />} />
            <Route path="/config"    element={<Settings />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

