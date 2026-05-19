import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './components/MainLayout.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';
import { useAuth } from './state/auth.jsx';
import { OposicionActivaProvider, useOposicionActiva } from './state/oposicionActiva.jsx';
import { useUserAccesos } from './hooks/useUserAccesos';
import { RevisionProvider } from './state/revisionContext.jsx';
import { lazy, Suspense, useEffect } from 'react';

const SeleccionarOposicionPage = lazy(() => import('./pages/SeleccionarOposicionPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const PlanEstudioPage = lazy(() => import('./pages/PlanEstudioPage.jsx'));
const TestPage = lazy(() => import('./pages/TestPage.jsx'));
const ResultPage = lazy(() => import('./pages/ResultPage.jsx'));
const ProgressPage = lazy(() => import('./pages/ProgressPage.jsx'));
const HistorialPage = lazy(() => import('./pages/HistorialPage.jsx'));
const ReviewPage = lazy(() => import('./pages/ReviewPage.jsx'));
const MarcadasPage = lazy(() => import('./pages/MarcadasPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const PlanesPage = lazy(() => import('./pages/PlanesPage.jsx'));
const CatalogoPage = lazy(() => import('./pages/CatalogoPage.jsx'));
const OposicionPage = lazy(() => import('./pages/OposicionPage.jsx'));
const MateriaPage = lazy(() => import('./pages/MateriaPage.jsx'));
const TemaPage = lazy(() => import('./pages/TemaPage.jsx'));
const MisOposicionesPage = lazy(() => import('./pages/MisOposicionesPage.jsx'));
const ConfigurarTestPage = lazy(() => import('./pages/ConfigurarTestPage.jsx'));
const NotificacionesPage = lazy(() => import('./pages/NotificacionesPage.jsx'));
const SimulacrosPage = lazy(() => import('./pages/SimulacrosPage.jsx'));
const MisTestsPage = lazy(() => import('./pages/MisTestsPage.jsx'));
const RankingPage = lazy(() => import('./pages/RankingPage.jsx'));

const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage.jsx'));
const AdminNuevaPreguntaPage = lazy(() => import('./pages/admin/AdminNuevaPreguntaPage.jsx'));
const AdminCatalogPage = lazy(() => import('./pages/admin/AdminCatalogPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx'));
const AdminRevisionPage = lazy(() => import('./pages/admin/AdminRevisionPage.jsx'));
const AdminAccesosPage = lazy(() => import('./pages/admin/AdminAccesosPage.jsx'));
const AdminPreciosPage = lazy(() => import('./pages/admin/AdminPreciosPage.jsx'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx'));
const AdminProfesoresPage = lazy(() => import('./pages/admin/AdminProfesoresPage.jsx'));
const AdminOposicionesPage = lazy(() => import('./pages/admin/AdminOposicionesPage.jsx'));
const AdminSimulacrosPage = lazy(() => import('./pages/admin/AdminSimulacrosPage.jsx'));
const AdminSimulacroWizardPage = lazy(() => import('./pages/admin/AdminSimulacroWizardPage.jsx'));
const AdminEtiquetasPage = lazy(() => import('./pages/admin/AdminEtiquetasPage.jsx'));
const AdminTestsPage = lazy(() => import('./pages/admin/AdminTestsPage.jsx'));
const AdminEditTestPage = lazy(() => import('./pages/admin/AdminEditTestPage.jsx'));

const ProfesorDashboardPage = lazy(() => import('./pages/profesor/ProfesorDashboardPage.jsx'));
const ProfesorPreguntasPage = lazy(() => import('./pages/profesor/ProfesorPreguntasPage.jsx'));
const ProfesorTestsPage = lazy(() => import('./pages/profesor/ProfesorTestsPage.jsx'));
const ProfesorSimulacrosPage = lazy(() => import('./pages/profesor/ProfesorSimulacrosPage.jsx'));
const ProfesorOposicionesPage = lazy(() => import('./pages/profesor/ProfesorOposicionesPage.jsx'));
const ProfesorOposicionDetallePage = lazy(() => import('./pages/profesor/ProfesorOposicionDetallePage.jsx'));
const ProfesorTemarioPage = lazy(() => import('./pages/profesor/ProfesorTemarioPage.jsx'));
const ProfesorEstadisticasPage = lazy(() => import('./pages/profesor/ProfesorEstadisticasPage.jsx'));
const ProfesorTemaDetallePage = lazy(() => import('./pages/profesor/ProfesorTemaDetallePage.jsx'));
const ProfesorActividadPage = lazy(() => import('./pages/profesor/ProfesorActividadPage.jsx'));
const ProfesorAlumnosPage = lazy(() => import('./pages/profesor/ProfesorAlumnosPage.jsx'));
const ProfesorCalendarioPage = lazy(() => import('./pages/profesor/ProfesorCalendarioPage.jsx'));

/**
 * Redirige al usuario a /seleccionar-oposicion si tiene mÃ¡s de una oposiciÃ³n
 * activa y no ha seleccionado ninguna todavÃ­a. Auto-selecciona si solo hay una.
 */
// Rutas accesibles sin tener ninguna oposición comprada (usuario free o nuevo)
const RUTAS_LIBRES = ['/catalogo', '/configurar-test', '/planes', '/perfil', '/test', '/resultado'];

function OposicionGuard({ children }) {
  const { user } = useAuth();
  const { oposicionActiva, setOposicionActiva } = useOposicionActiva();
  const { accesos, loading } = useUserAccesos();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const esAlumno = user && user.role !== 'admin' && user.role !== 'profesor';

  useEffect(() => {
    if (!esAlumno || loading || oposicionActiva) return;
    if (accesos.length === 0) {
      if (!RUTAS_LIBRES.some((r) => pathname.startsWith(r))) {
        navigate('/catalogo', { replace: true });
      }
    } else if (accesos.length === 1) {
      setOposicionActiva({ id: accesos[0].oposicion_id, nombre: accesos[0].nombre });
    } else {
      navigate('/seleccionar-oposicion', { replace: true });
    }
  }, [esAlumno, loading, accesos, oposicionActiva, navigate, setOposicionActiva]);

  const esRutaLibre = RUTAS_LIBRES.some((r) => pathname.startsWith(r));
  if (esAlumno && loading && !oposicionActiva && !esRutaLibre) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #fff7ed', borderTopColor: '#ea580c', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return children;
}

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

function PageFallback() {
  return (
    <div style={{ minHeight: 260, display: 'grid', placeItems: 'center', color: '#64748b', fontWeight: 700 }}>
      Cargando...
    </div>
  );
}

export default function App() {
  return (
    <OposicionActivaProvider>
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/seleccionar-oposicion"
        element={
          <ProtectedRoute>
            <SeleccionarOposicionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OposicionGuard>
              <RevisionProvider>
                <MainLayout />
              </RevisionProvider>
            </OposicionGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="plan-estudio" element={<PlanEstudioPage />} />
        <Route path="test" element={<TestPage />} />
        <Route path="resultado" element={<ResultPage />} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="revision/:testId" element={<ReviewPage />} />
        <Route path="marcadas" element={<MarcadasPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="oposicion/:id" element={<OposicionPage />} />
        <Route path="tema/:id" element={<MateriaPage />} />
        <Route path="bloque/:id" element={<TemaPage />} />
        <Route path="mis-oposiciones" element={<MisOposicionesPage />} />
        <Route path="configurar-test" element={<ConfigurarTestPage />} />
        <Route path="planes" element={<PlanesPage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
        <Route path="notificaciones" element={<NotificacionesPage />} />
        <Route path="simulacros" element={<SimulacrosPage />} />
        <Route path="mis-tests" element={<MisTestsPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Outlet />
            </AdminRoute>
          }
        >
          <Route path="preguntas/nueva" element={<AdminNuevaPreguntaPage />} />
          <Route path="preguntas" element={<AdminQuestionsPage />} />
          <Route path="catalogo" element={<AdminCatalogPage />} />
          <Route path="oposiciones" element={<AdminOposicionesPage />} />
          <Route path="simulacros/nuevo" element={<AdminSimulacroWizardPage />} />
          <Route path="simulacros/:id/editar" element={<AdminSimulacroWizardPage />} />
          <Route path="simulacros" element={<AdminSimulacrosPage />} />
          <Route path="etiquetas" element={<AdminEtiquetasPage />} />
          <Route path="tests/nuevo" element={<AdminEditTestPage />} />
          <Route path="tests/:id/editar" element={<AdminEditTestPage />} />
          <Route path="tests" element={<AdminTestsPage />} />
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
              <Outlet />
            </ProfesorRoute>
          }
        >
          <Route path="preguntas/nueva" element={<AdminNuevaPreguntaPage />} />
          <Route path="preguntas" element={<ProfesorPreguntasPage />} />
          <Route path="revision" element={<AdminRevisionPage />} />
          <Route path="oposiciones/:id" element={<Navigate to="/profesor/oposiciones" replace />} />
          <Route path="oposiciones" element={<ProfesorOposicionesPage />} />
          <Route path="temario" element={<ProfesorTemarioPage />} />
          <Route path="alumnos" element={<ProfesorAlumnosPage />} />
          <Route path="estadisticas/:slug/:temaId" element={<ProfesorTemaDetallePage />} />
          <Route path="estadisticas/:slug" element={<ProfesorOposicionDetallePage />} />
          <Route path="estadisticas" element={<ProfesorEstadisticasPage />} />
          <Route path="temas/:temaId" element={<Navigate to="/profesor/estadisticas" replace />} />
          <Route path="actividad" element={<ProfesorActividadPage />} />
          <Route path="calendario" element={<ProfesorCalendarioPage />} />
          <Route path="mis-tests" element={<Navigate to="/profesor/tests" replace />} />
          <Route path="mis-simulacros" element={<Navigate to="/profesor/simulacros" replace />} />
          <Route path="tests/nuevo" element={<AdminEditTestPage />} />
          <Route path="tests/:id/editar" element={<AdminEditTestPage />} />
          <Route path="tests" element={<ProfesorTestsPage />} />
          <Route path="simulacros/nuevo" element={<AdminSimulacroWizardPage />} />
          <Route path="simulacros/:id/editar" element={<AdminSimulacroWizardPage />} />
          <Route path="simulacros" element={<ProfesorSimulacrosPage />} />
          <Route path="notificaciones" element={<NotificacionesPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route index element={<ProfesorDashboardPage />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
    <InstallPrompt />
    </OposicionActivaProvider>
  );
}
