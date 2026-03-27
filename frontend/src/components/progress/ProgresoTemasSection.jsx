import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

export default function ProgresoTemasSection() {
  const { token } = useAuth();
  const [progresoTemas, setProgresoTemas] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    let cancelled = false;
    testApi.getProgresoTemas(token)
      .then((data) => { if (!cancelled) setProgresoTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setProgresoTemas([]); });
    return () => { cancelled = true; };
  }, [token]);

  const temasFiltrados = (progresoTemas ?? []).filter((t) => !filtro || t.oposicionNombre === filtro);

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2>Progreso por tema</h2>
      <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: '1rem' }}>
        Porcentaje de acierto acumulado en cada tema practicado.
      </p>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db' }}
        >
          <option value="">Todas las oposiciones</option>
          {[...new Set((progresoTemas ?? []).map((t) => t.oposicionNombre))].map((nombre) => (
            <option key={nombre} value={nombre}>{nombre}</option>
          ))}
        </select>
        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{temasFiltrados.length} temas</span>
      </div>

      {progresoTemas === null ? (
        <p>Cargando progreso...</p>
      ) : progresoTemas.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Aún no tienes progreso registrado. Completa algunos tests para ver tus estadísticas por tema.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Tema</th>
                <th>Materia</th>
                <th>Oposición</th>
                <th>Respondidas</th>
                <th>Aciertos</th>
                <th>Errores</th>
                <th>% Acierto</th>
              </tr>
            </thead>
            <tbody>
              {temasFiltrados.map((t) => {
                const pct = Number(t.porcentajeAcierto ?? 0);
                const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
                return (
                  <tr key={t.temaId}>
                    <td>
                      <Link to={`/tema/${t.temaId}`} style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}>{t.temaNombre}</Link>
                    </td>
                    <td>
                      {t.materiaId
                        ? <Link to={`/materia/${t.materiaId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{t.materiaNombre}</Link>
                        : (t.materiaNombre || '—')}
                    </td>
                    <td>
                      <Link to={`/oposicion/${t.oposicionId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{t.oposicionNombre}</Link>
                    </td>
                    <td>{t.totalRespondidas}</td>
                    <td>{t.aciertos}</td>
                    <td>{t.errores}</td>
                    <td>
                      <span style={{ fontWeight: 700, color }}>{pct}%</span>
                      <div style={{ background: '#e5e7eb', borderRadius: 999, height: 6, marginTop: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
