import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { ContentManagerPage } from "./pages/ContentManagerPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DoubtQueuePage } from "./pages/DoubtQueuePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { QuestionEditorPage } from "./pages/QuestionEditorPage";
import { RevenuePage } from "./pages/RevenuePage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudentListPage } from "./pages/StudentListPage";
import { isAdminUser, useAuthStore } from "./store/authStore";

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token || !isAdminUser(user)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { token, user } = useAuthStore();
  return <Navigate to={token && isAdminUser(user) ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route
          path="/"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="content" element={<ContentManagerPage />} />
          <Route path="students" element={<StudentListPage />} />
          <Route path="tests" element={<QuestionEditorPage />} />
          <Route path="doubts" element={<DoubtQueuePage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
