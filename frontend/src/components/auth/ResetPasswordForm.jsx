import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { getErrorMessage } from '../../services/api';
import AuthCard from './AuthCard';

const INPUT = { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const BTN = { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%' };

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ passwordNuevo: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  if (!token) {
    return (
      <AuthCard>
        <p style={{ color: '#dc2626', textAlign: 'center' }}>Enlace inválido. Solicita uno nuevo.</p>
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/forgot-password" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>Recuperar contraseña</Link>
        </p>
      </AuthCard>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.passwordNuevo !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, form.passwordNuevo);
      setOk(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <AuthCard>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>Contraseña actualizada</h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Redirigiendo al login…</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>Nueva contraseña</h2>
      <p style={{ margin: '0 0 22px', fontSize: '0.85rem', color: '#6b7280' }}>Introduce tu nueva contraseña (mínimo 8 caracteres).</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={form.passwordNuevo}
          onChange={(e) => setForm({ ...form, passwordNuevo: e.target.value })}
          style={INPUT}
          minLength={8}
          required
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={form.confirmar}
          onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
          style={INPUT}
          required
        />
        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...BTN, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </AuthCard>
  );
}
