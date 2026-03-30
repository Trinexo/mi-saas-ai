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
      navigate('/');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <AuthCard>
      <h2>Iniciar sesi&oacute;n</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input
          placeholder="Contrase&ntilde;a"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p>
        &iquest;No tienes cuenta? <Link to="/register">Reg&iacute;strate</Link>
      </p>
    </AuthCard>
  );
}
