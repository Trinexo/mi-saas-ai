import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';

export default function MateriaPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    testApi
      .getProgresoTemasByMateria(token, Number(id))
      .then((data) => setTemas(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'No se pudo cargar la materia'))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return <main style={{ padding: 32 }}><p>Cargando…</p></main>;
  if (error) return <main style={{ padding: 32 }}><p style={{ color: 'red' }}>{error}</p></main>;

  const materiaNombre = temas[0]?.materiaNombre ?? `Materia #${id}`;
  const practicados = temas.filter((t) => t.respondidas > 0).length;
  const totalTemas = temas.length;
  const maestriaGlobal = totalTemas > 0
    ? Number(((practicados / totalTemas) * 100).toFixed(1))
    : 0;
  const colorGlobal = maestriaGlobal >= 70 ? '#22c55e' : maestriaGlobal >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <Link to="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Inicio</Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '16px 0 4px' }}>
        {materiaNombre}
      </h1>
      <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: 13 }}>
        {practicados} de {totalTemas} temas practicados
      </p>

      {/* Barra maestra */}
      <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Maestría global</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: colorGlobal }}>{maestriaGlobal}%</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${maestriaGlobal}%`, height: '100%', background: colorGlobal, borderRadius: 999, transition: 'width .4s' }} />
        </div>
      </section>

      {/* Tabla de temas */}
      {temas.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No hay temas disponibles para esta materia.</p>
      ) : (
        <section style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Temas</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Tema</th>
                  <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Preguntas</th>
                  <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, minWidth: 140 }}>Maestría</th>
                  <th style={{ padding: '8px 12px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>% Acierto</th>
                  <th style={{ padding: '8px 12px' }} />
                </tr>
              </thead>
              <tbody>
                {temas.map((t) => {
                  const color = t.maestria >= 70 ? '#22c55e' : t.maestria >= 40 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={t.temaId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                        <Link to={`/tema/${t.temaId}`} style={{ color: '#1e293b', textDecoration: 'none' }}>{t.temaNombre}</Link>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>
                        {t.respondidas}/{t.totalPreguntas}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                            <div style={{ width: `${t.maestria}%`, height: '100%', background: color, borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: 12, color, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{t.maestria}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{t.porcentajeAcierto}%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate('/', { state: { temaId: t.temaId, materiaId: Number(id) } })}
                          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                        >
                          Practicar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
