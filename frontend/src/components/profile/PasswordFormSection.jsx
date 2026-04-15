import { useState } from 'react';
import { authApi } from '../../services/authApi.js';
import { useAsyncAction } from '../../hooks/useAsyncAction.js';

const inputStyle = {
  width: '100%',
  marginBottom: '1rem',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  boxSizing: 'border-box',
  fontSize: '0.9rem',
  color: '#111827',
  outline: 'none',
};

const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: '#374151' };

export default function PasswordFormSection({ token }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const passwordAction = useAsyncAction();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordNuevo !== passwordConfirm) {
      passwordAction.setErrorMessage('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwordNuevo.length < 8) {
      passwordAction.setErrorMessage('La contraseña nueva debe tener al menos 8 caracteres');
      return;
    }
    await passwordAction.runAction(async () => {
      await authApi.changePassword(token, { passwordActual, passwordNuevo });
      passwordAction.setSuccessMessage('Contraseña actualizada correctamente');
      setPasswordActual('');
      setPasswordNuevo('');
      setPasswordConfirm('');
    }, 'Error al cambiar la contraseña');
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Contraseña actual</label>
        <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Nueva contraseña</label>
        <input type="password" value={passwordNuevo} onChange={(e) => setPasswordNuevo(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Confirmar nueva contraseña</label>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          style={{ ...inputStyle, marginBottom: '1.25rem' }}
        />
        {passwordAction.error && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem', marginBottom: 8 }}><span>⚠️</span>{passwordAction.error}</div>}
        {passwordAction.message && <p style={{ color: '#2a7', marginBottom: '.75rem' }}>{passwordAction.message}</p>}
        <button
          type="submit"
          disabled={passwordAction.isLoading}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: passwordAction.isLoading ? 0.7 : 1, fontSize: '0.9rem' }}
        >
          {passwordAction.isLoading ? 'Actualizando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </>
  );
}
