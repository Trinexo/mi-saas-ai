import { useEffect, useState } from 'react';
import { authApi } from '../../services/authApi.js';
import { catalogApi } from '../../services/catalogApi.js';
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
const hintStyle = { color: '#6b7280', fontSize: '0.875rem', margin: '0 0 .5rem' };

export default function ProfileFormSection({ token, refreshUser }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [oposicionPreferidaId, setOposicionPreferidaId] = useState('');
  const [objetivoDiario, setObjetivoDiario] = useState(10);
  const [oposiciones, setOposiciones] = useState([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const profileAction = useAsyncAction();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (nombre.trim()) payload.nombre = nombre.trim();
    if (email.trim()) payload.email = email.trim();
    payload.oposicionPreferidaId = oposicionPreferidaId !== '' ? Number(oposicionPreferidaId) : null;
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

  if (!profileLoaded) return <p style={{ padding: '1rem 0' }}>Cargando perfil...</p>;

  return (
    <section style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: '2rem' }}>
      <h3 style={{ marginTop: 0 }}>Datos personales</h3>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nombre</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Oposición predeterminada</label>
        <p style={hintStyle}>Se preseleccionará automáticamente al entrar en la pantalla de inicio.</p>
        <select
          value={oposicionPreferidaId}
          onChange={(e) => setOposicionPreferidaId(e.target.value)}
          style={{ ...inputStyle, marginBottom: '1.25rem' }}
        >
          <option value="">— Sin preferencia —</option>
          {oposiciones.map((op) => (
            <option key={op.id} value={String(op.id)}>{op.nombre}</option>
          ))}
        </select>
        <label style={labelStyle}>Objetivo diario de preguntas</label>
        <p style={hintStyle}>Número de preguntas que quieres responder cada día (1–200).</p>
        <input
          type="number"
          min={1}
          max={200}
          value={objetivoDiario}
          onChange={(e) => setObjetivoDiario(e.target.value)}
          style={{ ...inputStyle, marginBottom: '1.25rem' }}
        />
        {profileAction.error && <p style={{ color: '#c00', marginBottom: '.75rem' }}>{profileAction.error}</p>}
        {profileAction.message && <p style={{ color: '#2a7', marginBottom: '.75rem' }}>{profileAction.message}</p>}
        <button
          type="submit"
          disabled={profileAction.isLoading}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: profileAction.isLoading ? 0.7 : 1 }}
        >
          {profileAction.isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  );
}
