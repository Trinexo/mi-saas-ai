import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/MainLayout.jsx';
import { useAuth } from './state/auth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import TestPage from './pages/TestPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  const allowed = user && ['admin', 'editor', 'revisor'].includes(user.role);
  return allowed ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

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
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="preguntas" element={<AdminQuestionsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}