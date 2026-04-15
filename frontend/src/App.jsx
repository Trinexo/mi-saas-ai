import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/MainLayout.jsx';
import { useAuth } from './state/auth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import HomePage from './pages/HomePage.jsx';
import TestPage from './pages/TestPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import HistorialPage from './pages/HistorialPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import MarcadasPage from './pages/MarcadasPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import PlanesPage from './pages/PlanesPage.jsx';
import CatalogoPage from './pages/CatalogoPage.jsx';
import OposicionPage from './pages/OposicionPage.jsx';
import MateriaPage from './pages/MateriaPage.jsx';
import TemaPage from './pages/TemaPage.jsx';
import MisOposicionesPage from './pages/MisOposicionesPage.jsx';
import ConfigurarTestPage from './pages/ConfigurarTestPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminCatalogPage from './pages/admin/AdminCatalogPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminRevisionPage from './pages/admin/AdminRevisionPage.jsx';
import AdminAccesosPage from './pages/admin/AdminAccesosPage.jsx';
import AdminPreciosPage from './pages/admin/AdminPreciosPage.jsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.jsx';
import AdminProfesoresPage from './pages/admin/AdminProfesoresPage.jsx';
import ProfesorLayout from './pages/profesor/ProfesorLayout.jsx';
import ProfesorDashboardPage from './pages/profesor/ProfesorDashboardPage.jsx';
import ProfesorPreguntasPage from './pages/profesor/ProfesorPreguntasPage.jsx';
import NotificacionesPage from './pages/NotificacionesPage.jsx';
import { RevisionProvider } from './state/revisionContext.jsx';

function ProtectedRoute({ children }) {
  const { token, user } = useAuth();
  const { pathname } = useLocation();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'admin' && !pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'profesor' && !pathname.startsWith('/profesor')) {
    return <Navigate to="/profesor" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

function ProfesorRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'profesor' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="test" element={<TestPage />} />
        <Route path="resultado" element={<ResultPage />} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="revision/:testId" element={<ReviewPage />} />
        <Route path="marcadas" element={<MarcadasPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="oposicion/:id" element={<OposicionPage />} />
        <Route path="materia/:id" element={<MateriaPage />} />
        <Route path="tema/:id" element={<TemaPage />} />
        <Route path="mis-oposiciones" element={<MisOposicionesPage />} />
        <Route path="configurar-test" element={<ConfigurarTestPage />} />
        <Route path="planes" element={<PlanesPage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <RevisionProvider>
                <AdminLayout />
              </RevisionProvider>
            </AdminRoute>
          }
        >
          <Route path="preguntas" element={<AdminQuestionsPage />} />
          <Route path="catalogo" element={<AdminCatalogPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="accesos" element={<AdminAccesosPage />} />
          <Route path="precios" element={<AdminPreciosPage />} />
          <Route path="ajustes" element={<AdminSettingsPage />} />
          <Route path="revision" element={<AdminRevisionPage />} />
          <Route path="profesores" element={<AdminProfesoresPage />} />
          <Route index element={<AdminDashboardPage />} />
        </Route>
        <Route
          path="profesor"
          element={
            <ProfesorRoute>
              <ProfesorLayout />
            </ProfesorRoute>
          }
        >
          <Route path="preguntas" element={<ProfesorPreguntasPage />} />
          <Route index element={<ProfesorDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}