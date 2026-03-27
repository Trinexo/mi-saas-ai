import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';
import { catalogApi } from '../../services/catalogApi';
import { getErrorMessage } from '../../services/api';

function formatTime(segundos) {
  if (!segundos) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EstadisticasPorTemaSection() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [catalogError, setCatalogError] = useState('');
  const [temaError, setTemaError] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingTema, setLoadingTema] = useState(false);
  const [repasoLoading, setRepasoLoading] = useState(false);
  const [simulacrosLoading, setSimulacrosLoading] = useState(false);

  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selOposicion, setSelOposicion] = useState('');
  const [selMateria, setSelMateria] = useState('');
  const [selTema, setSelTema] = useState('');

  const [temaStats, setTemaStats] = useState(null);
  const [repasoData, setRepasoData] = useState(null);
  const [simulacrosData, setSimulacrosData] = useState(null);

  // Cargar oposiciones al montar
  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    setCatalogError('');
    catalogApi.getOposiciones()
      .then((data) => { if (!cancelled) setOposiciones(data); })
      .catch((e) => { if (!cancelled) setCatalogError(getErrorMessage(e, 'No se pudo cargar el catálogo de progreso')); })
      .finally(() => { if (!cancelled) setLoadingCatalog(false); });
    return () => { cancelled = true; };
  }, []);

  // Cambio de oposición: cargar materias + simulacros
  useEffect(() => {
    if (!selOposicion) {
      setMaterias([]);
      setSelMateria('');
      setTemas([]);
      setSelTema('');
      setTemaStats(null);
      setCatalogError('');
      setTemaError('');
      setSimulacrosData(null);
      return;
    }
    let cancelled = false;
    setCatalogError('');
    setSimulacrosLoading(true);
    testApi.simulacroStats(token, selOposicion)
      .then((data) => { if (!cancelled) setSimulacrosData(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setSimulacrosData([]); })
      .finally(() => { if (!cancelled) setSimulacrosLoading(false); });
    catalogApi.getMaterias(selOposicion)
      .then((data) => { if (!cancelled) setMaterias(data); })
      .catch((e) => { if (!cancelled) { setMaterias([]); setCatalogError(getErrorMessage(e, 'No se pudieron cargar las materias')); } });
    setSelMateria('');
    setTemas([]);
    setSelTema('');
    setTemaStats(null);
    setTemaError('');
    return () => { cancelled = true; };
  }, [selOposicion, token]);

  // Cambio de materia: cargar temas
  useEffect(() => {
    if (!selMateria) {
      setTemas([]);
      setSelTema('');
      setTemaStats(null);
      setCatalogError('');
      setTemaError('');
      return;
    }
    let cancelled = false;
    setCatalogError('');
    catalogApi.getTemas(selMateria)
      .then((data) => { if (!cancelled) setTemas(data); })
      .catch((e) => { if (!cancelled) { setTemas([]); setCatalogError(getErrorMessage(e, 'No se pudieron cargar los temas')); } });
    setSelTema('');
    setTemaStats(null);
    setTemaError('');
    return () => { cancelled = true; };
  }, [selMateria]);

  // Cambio de tema: cargar stats + repaso
  useEffect(() => {
    if (!selTema) {
      setTemaStats(null);
      setTemaError('');
      setRepasoData(null);
      return;
    }
    let cancelled = false;
    setLoadingTema(true);
    setTemaError('');
    setRepasoLoading(true);
    setRepasoData(null);
    testApi.temaStats(token, selTema)
      .then((data) => { if (!cancelled) setTemaStats(data); })
      .catch((e) => { if (!cancelled) { setTemaStats(null); setTemaError(getErrorMessage(e, 'No se pudieron cargar las estadísticas del tema')); } })
      .finally(() => { if (!cancelled) setLoadingTema(false); });
    testApi.repasoStats(token, selTema)
      .then((data) => { if (!cancelled) setRepasoData(data); })
      .catch(() => { if (!cancelled) setRepasoData(null); })
      .finally(() => { if (!cancelled) setRepasoLoading(false); });
    return () => { cancelled = true; };
  }, [selTema, token]);

  return (
    <>
      {/* ── Estadísticas por tema ── */}
      <div style={{ marginTop: '1.5rem', background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3>Estadísticas por tema</h3>
        {loadingCatalog && <p>Cargando catálogo...</p>}
        {catalogError && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{catalogError}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0.75rem 0' }}>
          <select value={selOposicion} onChange={(e) => setSelOposicion(e.target.value)} disabled={loadingCatalog}>
            <option value="">— Oposición —</option>
            {oposiciones.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
          <select value={selMateria} onChange={(e) => setSelMateria(e.target.value)} disabled={!materias.length}>
            <option value="">— Materia —</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          <select value={selTema} onChange={(e) => setSelTema(e.target.value)} disabled={!temas.length}>
            <option value="">— Tema —</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {loadingTema && <p>Cargando...</p>}
        {temaError && !loadingTema && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{temaError}</p>}

        {!repasoLoading && repasoData && repasoData.pendientes > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600 }}>
              {repasoData.pendientes} pendiente{repasoData.pendientes !== 1 ? 's' : ''} de repaso
            </span>
            <button
              onClick={async () => {
                const test = await testApi.generate(token, {
                  modo: 'repaso',
                  temaId: Number(selTema),
                  numeroPreguntas: Math.min(20, Math.max(5, repasoData.pendientes)),
                  dificultad: 'mixto',
                });
                sessionStorage.setItem('active_test', JSON.stringify(test));
                navigate('/test');
              }}
            >
              Practicar repaso
            </button>
          </div>
        )}

        {temaStats && !loadingTema && (() => {
          const pctTema = temaStats.preguntasVistas > 0
            ? Math.round((temaStats.aciertos / temaStats.preguntasVistas) * 100)
            : 0;
          return (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: '1rem' }}>
                {[
                  { value: temaStats.preguntasVistas, label: 'Preguntas vistas' },
                  { value: temaStats.aciertos, label: 'Aciertos' },
                  { value: temaStats.errores, label: 'Errores' },
                  { value: `${pctTema}%`, label: 'Tasa de acierto' },
                ].map(({ value, label }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100, flex: '1 1 100px' }}>
                    <span style={{ display: 'block', fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{value}</span>
                    <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</span>
                  </div>
                ))}
              </div>
              {temaStats.preguntasVistas > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>
                    <span>Tasa de acierto del tema</span>
                    <span>{pctTema}%</span>
                  </div>
                  <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: '#e5e7eb' }}>
                    <div style={{ width: `${pctTema}%`, background: pctTema >= 70 ? '#22c55e' : pctTema >= 50 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ── Simulacros de esta oposición ── */}
      {selOposicion && (
        <div style={{ marginTop: '1.5rem', background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <h3>Simulacros de esta oposición</h3>
          {simulacrosLoading && <p>Cargando simulacros...</p>}
          {!simulacrosLoading && simulacrosData !== null && simulacrosData.length === 0 && (
            <p style={{ color: '#6b7280' }}>Aún no has hecho ningún simulacro para esta oposición.</p>
          )}
          {!simulacrosLoading && simulacrosData && simulacrosData.length > 0 && (() => {
            const notaMedia = simulacrosData.reduce((s, r) => s + r.nota, 0) / simulacrosData.length;
            const mejor = simulacrosData.reduce((b, r) => r.nota > b.nota ? r : b, simulacrosData[0]);
            return (
              <>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Simulacros realizados', value: simulacrosData.length, color: null },
                    { label: 'Nota media', value: notaMedia.toFixed(2), color: notaMedia >= 5 ? '#22c55e' : '#ef4444' },
                    { label: 'Mejor nota', value: mejor.nota.toFixed(2), color: '#22c55e' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: color ?? undefined }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Nota</th>
                        <th>Aciertos</th>
                        <th>Errores</th>
                        <th>En blanco</th>
                        <th>Tiempo</th>
                        <th>Revisión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulacrosData.map((s) => (
                        <tr key={s.testId}>
                          <td>{new Date(s.fecha).toLocaleDateString('es-ES')}</td>
                          <td><strong style={{ color: s.nota >= 5 ? '#22c55e' : '#ef4444' }}>{s.nota.toFixed(2)}</strong></td>
                          <td>{s.aciertos}</td>
                          <td>{s.errores}</td>
                          <td>{s.blancos}</td>
                          <td>{formatTime(s.tiempoRealSegundos)}</td>
                          <td><a href={`/revision/${s.testId}`}>Ver</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}
