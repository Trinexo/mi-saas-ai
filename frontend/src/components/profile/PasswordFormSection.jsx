import { useState } from 'react';
import { authApi } from '../../services/authApi.js';
import { useAsyncAction } from '../../hooks/useAsyncAction.js';

const inputStyle = {
  width: '100%',
  marginBottom: '1rem',
  padding: '.5rem .75rem',
  borderRadius: 6,
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};

const labelStyle = { display: 'block', marginBottom: '.5rem', fontWeight: 600 };

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
    <section style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
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
        {passwordAction.error && <p style={{ color: '#c00', marginBottom: '.75rem' }}>{passwordAction.error}</p>}
        {passwordAction.message && <p style={{ color: '#2a7', marginBottom: '.75rem' }}>{passwordAction.message}</p>}
        <button
          type="submit"
          disabled={passwordAction.isLoading}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: passwordAction.isLoading ? 0.7 : 1 }}
        >
          {passwordAction.isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  );
}
