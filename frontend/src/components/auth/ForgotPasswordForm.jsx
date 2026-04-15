import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { getErrorMessage } from '../../services/api';
import AuthCard from './AuthCard';

const INPUT = { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const BTN = { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%' };

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setEnviado(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <AuthCard>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📬</div>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>Revisa tu correo</h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
            Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
            El enlace es válido durante <strong>1 hora</strong>.
          </p>
          <Link to="/login" style={{ color: '#1d4ed8', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            ← Volver al inicio de sesión
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>¿Olvidaste tu contraseña?</h2>
      <p style={{ margin: '0 0 22px', fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.5 }}>
        Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={INPUT}
          required
        />
        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...BTN, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
      </form>
      <p style={{ marginTop: 18, textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
        <Link to="/login" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>← Volver al login</Link>
      </p>
    </AuthCard>
  );
}
