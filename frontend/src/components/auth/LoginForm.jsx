import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { getErrorMessage } from '../../services/api';
import { useAuth } from '../../state/auth.jsx';
import AuthCard from './AuthCard';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await authApi.login(form);
      login(data.token, data.user);
      const destino = ['admin', 'profesor'].includes(data.user?.role) ? '/admin' : '/';
      navigate(destino);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AuthCard>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Iniciar sesi&oacute;n</h2>
      <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: '#6b7280' }}>Accede a tu cuenta para continuar</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        <button
          type="submit"
          style={{ marginTop: 4, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
        >
          Entrar
        </button>
      </form>
      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
        &iquest;No tienes cuenta? <Link to="/register" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>Reg&iacute;strate</Link>
      </p>
      <p style={{ marginTop: 8, textAlign: 'center', fontSize: '0.82rem' }}>
        <Link to="/forgot-password" style={{ color: '#6b7280', textDecoration: 'none' }}>&iquest;Olvidaste tu contrase&ntilde;a?</Link>
      </p>
    </AuthCard>
  );
}
