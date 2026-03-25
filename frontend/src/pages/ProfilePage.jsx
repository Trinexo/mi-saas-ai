import { useEffect, useState } from 'react';
import { useAuth } from '../state/auth.jsx';
import { authApi } from '../services/authApi.js';
import { catalogApi } from '../services/catalogApi.js';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import DashboardWidget from '../components/DashboardWidget.jsx';

export default function ProfilePage() {
  const { token, user, refreshUser } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [oposicionPreferidaId, setOposicionPreferidaId] = useState('');
  const [objetivoDiario, setObjetivoDiario] = useState(10);
  const [oposiciones, setOposiciones] = useState([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const profileAction = useAsyncAction();
  const passwordAction = useAsyncAction();

  useEffect(() => {
    authApi.getProfile(token).then((res) => {
      if (res?.data) {
        setNombre(res.data.nombre || '');
        setEmail(res.data.email || '');
        setOposicionPreferidaId(res.data.oposicionPreferidaId ? String(res.data.oposicionPreferidaId) : '');
        setObjetivoDiario(res.data.objetivoDiarioPreguntas ?? 10);
        setProfileLoaded(true);
      }
    });
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
  }, [token]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (nombre.trim()) payload.nombre = nombre.trim();
    if (email.trim()) payload.email = email.trim();
    if (oposicionPreferidaId !== '') payload.oposicionPreferidaId = Number(oposicionPreferidaId);
    else payload.oposicionPreferidaId = null;
    if (objetivoDiario) payload.objetivoDiarioPreguntas = Number(objetivoDiario);
    await profileAction.runAction(async () => {
      const res = await authApi.updateProfile(token, payload);
      profileAction.setSuccessMessage('Perfil actualizado correctamente');
      if (res?.data) {
        setNombre(res.data.nombre || '');
        setEmail(res.data.email || '');
        setOposicionPreferidaId(res.data.oposicionPreferidaId ? String(res.data.oposicionPreferidaId) : '');
        setObjetivoDiario(res.data.objetivoDiarioPreguntas ?? 10);
        refreshUser(res.data);
      }
    }, 'Error al actualizar el perfil');
  };

  const handlePasswordSubmit = async (e) => {
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

  if (!profileLoaded) return <p style={{ padding: '2rem' }}>Cargando perfil...</p>;

  return (
    <div style={{ maxWidth: 540, margin: '2rem auto', padding: '0 1rem' }}>
      <h2>Mi perfil</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Rol: <strong>{user?.role}</strong></p>

      <DashboardWidget />

      <section style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Datos personales</h3>
        <form onSubmit={handleProfileSubmit}>
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Oposición predeterminada</label>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 .5rem' }}>Se preseleccionará automáticamente al entrar en la pantalla de inicio.</p>
          <select
            value={oposicionPreferidaId}
            onChange={(e) => setOposicionPreferidaId(e.target.value)}
            style={{ width: '100%', marginBottom: '1.25rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          >
            <option value="">— Sin preferencia —</option>
            {oposiciones.map((op) => (
              <option key={op.id} value={String(op.id)}>{op.nombre}</option>
            ))}
          </select>
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Objetivo diario de preguntas</label>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 .5rem' }}>Número de preguntas que quieres responder cada día (1–200).</p>
          <input
            type="number"
            min={1}
            max={200}
            value={objetivoDiario}
            onChange={(e) => setObjetivoDiario(e.target.value)}
            style={{ width: '100%', marginBottom: '1.25rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          {profileAction.error && <p style={{ color: '#c00', marginBottom: '.75rem' }}>{profileAction.error}</p>}
          {profileAction.message && <p style={{ color: '#2a7', marginBottom: '.75rem' }}>{profileAction.message}</p>}
          <button type="submit" disabled={profileAction.isLoading} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: profileAction.isLoading ? 0.7 : 1 }}>
            {profileAction.isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </section>

      <section style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
        <form onSubmit={handlePasswordSubmit}>
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Contraseña actual</label>
          <input
            type="password"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Nueva contraseña</label>
          <input
            type="password"
            value={passwordNuevo}
            onChange={(e) => setPasswordNuevo(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 600 }}>Confirmar nueva contraseña</label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            style={{ width: '100%', marginBottom: '1.25rem', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
          {passwordAction.error && <p style={{ color: '#c00', marginBottom: '.75rem' }}>{passwordAction.error}</p>}
          {passwordAction.message && <p style={{ color: '#2a7', marginBottom: '.75rem' }}>{passwordAction.message}</p>}
          <button type="submit" disabled={passwordAction.isLoading} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: passwordAction.isLoading ? 0.7 : 1 }}>
            {passwordAction.isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}
