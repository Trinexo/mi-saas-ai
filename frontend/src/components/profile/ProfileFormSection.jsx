import { useEffect, useState } from 'react';
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

const selectStyle = {
  ...inputStyle,
  background: '#fff',
  cursor: 'pointer',
};

const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: '#374151' };
const hintStyle = { color: '#6b7280', fontSize: '0.8rem', margin: '-4px 0 8px' };

export default function ProfileFormSection({ token, refreshUser }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [objetivoDiario, setObjetivoDiario] = useState(10);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const profileAction = useAsyncAction();

  useEffect(() => {
    authApi.getProfile(token).then((res) => {
      if (res) {
        setNombre(res.nombre || '');
        setEmail(res.email || '');
        setObjetivoDiario(res.objetivoDiarioPreguntas ?? 10);
        setProfileLoaded(true);
      }
    });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    if (nombre.trim()) payload.nombre = nombre.trim();
    if (email.trim()) payload.email = email.trim();
    if (objetivoDiario) payload.objetivoDiarioPreguntas = Number(objetivoDiario);
    await profileAction.runAction(async () => {
      const res = await authApi.updateProfile(token, payload);
      profileAction.setSuccessMessage('Perfil actualizado correctamente');
      if (res) {
        setNombre(res.nombre || '');
        setEmail(res.email || '');
        setObjetivoDiario(res.objetivoDiarioPreguntas ?? 10);
        refreshUser(res);
      }
    }, 'Error al actualizar el perfil');
  };

  if (!profileLoaded) return <p style={{ padding: '0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Cargando perfil…</p>;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nombre</label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
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
        {profileAction.error && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem', marginBottom: 8 }}><span>⚠️</span>{profileAction.error}</div>}
        {profileAction.message && <p style={{ color: '#2a7', marginBottom: '.75rem' }}>{profileAction.message}</p>}
        <button
          type="submit"
          disabled={profileAction.isLoading}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: profileAction.isLoading ? 0.7 : 1, fontSize: '0.9rem' }}
        >
          {profileAction.isLoading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </>
  );
}
