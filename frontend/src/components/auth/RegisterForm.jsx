import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { getErrorMessage } from '../../services/api';
import AuthCard from './AuthCard';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await authApi.register(form);
      navigate('/login');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AuthCard>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Crear cuenta</h2>
      <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: '#6b7280' }}>Empieza a preparar tu oposición hoy</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
        />
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
          Crear cuenta
        </button>
      </form>
      <p style={{ marginTop: 20, textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
        &iquest;Ya tienes cuenta? <Link to="/login" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>Inicia sesi&oacute;n</Link>
      </p>
    </AuthCard>
  );
}
