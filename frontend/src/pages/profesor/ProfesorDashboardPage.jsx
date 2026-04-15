import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';
import { Link } from 'react-router-dom';

export default function ProfesorDashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    profesorApi.getDashboard(token)
      .then(setData)
      .catch((e) => setError(getErrorMessage(e)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 10, fontSize: '0.9rem' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 20, color: '#6b7280' }}>Cargando…</div>;
  }

  const { oposiciones, stats, actividad } = data;

  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
          Hola, {user?.nombre ?? 'Profesor'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
          Panel de profesor — resumen de tu actividad
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Preguntas creadas', value: stats.total, bg: '#eff6ff', fg: '#1d4ed8', icon: '📝' },
        ].map((c) => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                {c.icon}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{c.label}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.fg }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Oposiciones asignadas */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
          Mis oposiciones ({oposiciones.length})
        </h2>
        {oposiciones.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            No tienes oposiciones asignadas. Contacta al administrador.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {oposiciones.map((o) => (
              <div
                key={o.id}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#166534',
                }}
              >
                {o.nombre}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actividad reciente */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
            Actividad reciente
          </h2>
          <Link to="/profesor/preguntas" style={{ fontSize: '0.8rem', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>
            Ver todas →
          </Link>
        </div>
        {actividad.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            Aún no has creado preguntas.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actividad.map((a) => (
              <div key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ flex: 1, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.enunciado?.substring(0, 80)}{(a.enunciado?.length ?? 0) > 80 ? '…' : ''}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', flexShrink: 0 }}>
                  {a.oposicion_nombre} · {a.creado_en ? new Date(a.creado_en).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
