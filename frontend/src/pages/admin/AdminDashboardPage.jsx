import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';

const CARD_STYLE = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '1.25rem 1.5rem',
  textAlign: 'center',
  flex: '1 1 160px',
};

const BIG_NUM = { fontSize: '2.25rem', fontWeight: 700, color: '#1d4ed8', lineHeight: 1.2 };
const LABEL = { fontSize: '0.8rem', color: '#6b7280', marginTop: 6 };

const QUICK_LINKS = [
  { to: '/admin/preguntas', label: '\uD83D\uDCDD Gestionar preguntas' },
  { to: '/admin/catalogo', label: '\uD83D\uDDC2\uFE0F Gestionar cat\u00e1logo' },
  { to: '/admin/usuarios', label: '\uD83D\uDC65 Gestionar usuarios' },
];

const ROL_LABELS = { alumno: 'Alumnos', editor: 'Editores', revisor: 'Revisores', admin: 'Admins' };
const ROL_COLOR = { alumno: '#374151', editor: '#1d4ed8', revisor: '#a16207', admin: '#b91c1c' };

const TH = { padding: '0.5rem 0.75rem', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' };
const TD = { padding: '0.5rem 0.75rem', color: '#111827' };

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersByRole, setUsersByRole] = useState(null);
  const [temasErrores, setTemasErrores] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getAdminStats(token)
      .then((res) => {
        if (res?.data) setStats(res.data);
      })
      .catch(() => setError('No se pudieron cargar las estad\u00edsticas.'));

    // Cargar desglose por rol
    Promise.all(
      ['alumno', 'editor', 'revisor', 'admin'].map((role) =>
        adminApi.listUsers(token, { role, page: 1, page_size: 1 })
          .then((res) => ({ role, total: res?.data?.pagination?.total ?? 0 }))
          .catch(() => ({ role, total: 0 })),
      ),
    ).then((results) => {
      const byRole = {};
      results.forEach(({ role, total }) => { byRole[role] = total; });
      setUsersByRole(byRole);
    });

    // Cargar top temas con más errores
    adminApi
      .getTemasConMasErrores(token, 10)
      .then((res) => { if (res?.data) setTemasErrores(res.data); })
      .catch(() => setTemasErrores([]));
  }, [token]);

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Dashboard del sistema</h2>

      {error && <p style={{ color: '#c00' }}>{error}</p>}

      {!stats && !error && <p style={{ color: '#6b7280' }}>Cargando estad\u00edsticas...</p>}

      {stats && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>{stats.totalPreguntas.toLocaleString()}</div>
            <div style={LABEL}>Preguntas en el banco</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>{stats.totalUsuarios.toLocaleString()}</div>
            <div style={LABEL}>Usuarios registrados</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>{stats.totalTests.toLocaleString()}</div>
            <div style={LABEL}>Tests completados</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={{ ...BIG_NUM, color: '#059669' }}>{stats.testsEstaSemana.toLocaleString()}</div>
            <div style={LABEL}>Tests esta semana</div>
          </div>
          <div style={CARD_STYLE}>
            <div style={BIG_NUM}>
              {stats.notaMediaGlobal !== null ? stats.notaMediaGlobal.toFixed(2) : '\u2014'}
            </div>
            <div style={LABEL}>Nota media global</div>
          </div>
        </div>
      )}

      {usersByRole && (
        <>
          <h3 style={{ marginBottom: '0.75rem' }}>Usuarios por rol</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
            {['alumno', 'editor', 'revisor', 'admin'].map((role) => (
              <div
                key={role}
                style={{
                  ...CARD_STYLE,
                  flex: '1 1 100px',
                  borderTop: `3px solid ${ROL_COLOR[role]}`,
                }}
              >
                <div style={{ ...BIG_NUM, color: ROL_COLOR[role] }}>{usersByRole[role]}</div>
                <div style={LABEL}>{ROL_LABELS[role]}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {temasErrores && temasErrores.length > 0 && (
        <>
          <h3 style={{ marginBottom: '0.75rem' }}>Top temas con m\u00e1s errores</h3>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  <th style={TH}>Tema</th>
                  <th style={TH}>Materia</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Respuestas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Errores</th>
                  <th style={{ ...TH, textAlign: 'right' }}>% Error</th>
                </tr>
              </thead>
              <tbody>
                {temasErrores.map((t) => (
                  <tr key={t.temaId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={TD}>{t.temaNombre}</td>
                    <td style={{ ...TD, color: '#6b7280' }}>{t.materiaNombre}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{t.totalRespuestas.toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#b91c1c', fontWeight: 600 }}>{t.totalErrores.toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <span
                        style={{
                          background: t.pctError >= 60 ? '#fee2e2' : t.pctError >= 40 ? '#fef3c7' : '#dcfce7',
                          color: t.pctError >= 60 ? '#991b1b' : t.pctError >= 40 ? '#92400e' : '#166534',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {t.pctError !== null ? `${t.pctError}%` : '\u2014'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 style={{ marginBottom: '0.75rem' }}>Accesos r\u00e1pidos</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {QUICK_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#1d4ed8',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
