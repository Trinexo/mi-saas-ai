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
      <h2>Registro</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input
          placeholder="Contrase&ntilde;a"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
        <button type="submit">Crear cuenta</button>
      </form>
      <p>
        &iquest;Ya tienes cuenta? <Link to="/login">Inicia sesi&oacute;n</Link>
      </p>
    </AuthCard>
  );
}
