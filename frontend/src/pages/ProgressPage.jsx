import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../services/api';
import { testApi } from '../services/testApi';
import { catalogApi } from '../services/catalogApi';
import { useAuth } from '../state/auth.jsx';

function formatTime(segundos) {
  if (!segundos) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ProgressPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [temaError, setTemaError] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Cascading selectors for per-tema stats
  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selOposicion, setSelOposicion] = useState('');
  const [selMateria, setSelMateria] = useState('');
  const [selTema, setSelTema] = useState('');
  const [temaStats, setTemaStats] = useState(null);
  const [loadingTema, setLoadingTema] = useState(false);
  const [repasoData, setRepasoData] = useState(null);
  const [repasoLoading, setRepasoLoading] = useState(false);
  const [simulacrosData, setSimulacrosData] = useState(null);
  const [simulacrosLoading, setSimulacrosLoading] = useState(false);
  const [evolucionData, setEvolucionData] = useState(null);
  const [evolucionLoading, setEvolucionLoading] = useState(true);
  const [rachaData, setRachaData] = useState(null);
  const [objetivoData, setObjetivoData] = useState(null);
  const [progresoTemas, setProgresoTemas] = useState(null);
  const [progresoTemasFiltro, setProgresoTemasFiltro] = useState('');
  const [rachaTemas, setRachaTemas] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoadingStats(true);
    setStatsError('');
    testApi
      .userStats(token)
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setStatsError(getErrorMessage(e, 'No se pudo cargar el progreso'));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingStats(false);
      });

    setLoadingCatalog(true);
    setCatalogError('');
    catalogApi
      .getOposiciones()
      .then((data) => {
        if (cancelled) return;
        setOposiciones(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setCatalogError(getErrorMessage(e, 'No se pudo cargar el catálogo de progreso'));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCatalog(false);
      });

    setEvolucionLoading(true);
    testApi
      .evolucionStats(token, 30)
      .then((data) => { if (!cancelled) setEvolucionData(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setEvolucionData([]); })
      .finally(() => { if (!cancelled) setEvolucionLoading(false); });

    testApi
      .getRacha(token)
      .then((data) => { if (!cancelled) setRachaData(data); })
      .catch(() => { if (!cancelled) setRachaData(null); });

    testApi
      .getObjetivoDiario(token)
      .then((data) => { if (!cancelled) setObjetivoData(data); })
      .catch(() => { if (!cancelled) setObjetivoData(null); });

    testApi
      .getProgresoTemas(token)
      .then((data) => { if (!cancelled) setProgresoTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setProgresoTemas([]); });

    testApi
      .getRachaTemas(token)
      .then((data) => { if (!cancelled) setRachaTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setRachaTemas([]); });

    return () => {
      cancelled = true;
    };
  }, [token]);

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
    testApi
      .simulacroStats(token, selOposicion)
      .then((data) => { if (!cancelled) setSimulacrosData(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setSimulacrosData([]); })
      .finally(() => { if (!cancelled) setSimulacrosLoading(false); });

    catalogApi
      .getMaterias(selOposicion)
      .then((data) => {
        if (cancelled) return;
        setMaterias(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setMaterias([]);
        setCatalogError(getErrorMessage(e, 'No se pudieron cargar las materias'));
      });

    setSelMateria('');
    setTemas([]);
    setSelTema('');
    setTemaStats(null);
    setTemaError('');

    return () => {
      cancelled = true;
    };
  }, [selOposicion, token]);

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
    catalogApi
      .getTemas(selMateria)
      .then((data) => {
        if (cancelled) return;
        setTemas(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setTemas([]);
        setCatalogError(getErrorMessage(e, 'No se pudieron cargar los temas'));
      });

    setSelTema('');
    setTemaStats(null);
    setTemaError('');

    return () => {
      cancelled = true;
    };
  }, [selMateria]);

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
    testApi
      .temaStats(token, selTema)
      .then((data) => {
        if (cancelled) return;
        setTemaStats(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setTemaStats(null);
        setTemaError(getErrorMessage(e, 'No se pudieron cargar las estadísticas del tema'));
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTema(false);
      });

    testApi
      .repasoStats(token, selTema)
      .then((data) => {
        if (cancelled) return;
        setRepasoData(data);
      })
      .catch(() => {
        if (cancelled) return;
        setRepasoData(null);
      })
      .finally(() => {
        if (cancelled) return;
        setRepasoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selTema, token]);

  if (statsError) return <p className="error">{statsError}</p>;
  if (loadingStats || !stats) return <p>Cargando progreso...</p>;

  const totalRespondidas = stats.aciertos + stats.errores + stats.blancos;
  const pctAcierto = totalRespondidas > 0
    ? Math.round((stats.aciertos / totalRespondidas) * 100)
    : 0;

  return (
    <>
      <section>
      <h2>Mi Progreso</h2>

      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-value">{stats.totalTests}</span>
          <span className="stat-label">Tests realizados</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.aciertos}</span>
          <span className="stat-label">Aciertos</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.errores}</span>
          <span className="stat-label">Errores</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.blancos}</span>
          <span className="stat-label">En blanco</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{Number(stats.notaMedia).toFixed(2)}</span>
          <span className="stat-label">Nota media</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatTime(stats.tiempoMedio)}</span>
          <span className="stat-label">Tiempo medio/test</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-label">Tasa de acierto global: {pctAcierto}%</div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pctAcierto}%` }} />
        </div>
      </div>

      {(rachaData || objetivoData) && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {rachaData && (
            <div className="card" style={{ flex: '1 1 200px' }}>
              <h3 style={{ marginTop: 0 }}>Racha de estudio</h3>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                    🔥 {rachaData.rachaActual}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>días seguidos</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>{rachaData.mejorRacha}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>mejor racha</div>
                </div>
                <div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    background: rachaData.estudioHoy ? '#dcfce7' : '#fee2e2',
                    color: rachaData.estudioHoy ? '#166534' : '#991b1b',
                  }}>
                    {rachaData.estudioHoy ? '✓ Estudiado hoy' : '✗ Sin estudiar hoy'}
                  </span>
                </div>
              </div>
              {rachaData.actividad7Dias && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '0.75rem' }}>
                  {rachaData.actividad7Dias.map((d) => (
                    <div
                      key={d.fecha}
                      title={`${d.fecha}: ${d.tests} test${d.tests !== 1 ? 's' : ''}`}
                      style={{
                        flex: 1,
                        height: 28,
                        borderRadius: 4,
                        background: d.activo ? '#22c55e' : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {objetivoData && (
            <div className="card" style={{ flex: '1 1 200px' }}>
              <h3 style={{ marginTop: 0 }}>Objetivo diario</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span>{objetivoData.preguntasRespondidasHoy} preguntas hoy</span>
                <span style={{ color: '#6b7280' }}>meta: {objetivoData.objetivoPreguntasDia}</span>
              </div>
              <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
                <div style={{
                  width: `${objetivoData.porcentajeCumplido}%`,
                  background: objetivoData.cumplido ? '#22c55e' : '#3b82f6',
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.4rem' }}>
                {objetivoData.cumplido
                  ? '🎉 ¡Objetivo completado!'
                  : `${objetivoData.porcentajeCumplido}% completado`}
              </div>
            </div>
          )}
        </div>
      )}

      {!evolucionLoading && evolucionData && evolucionData.length >= 2 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>Evolución (últimos {evolucionData.length} tests)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Modo</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {evolucionData.map((e, i) => (
                  <tr key={i}>
                    <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{evolucionData.length - i}</td>
                    <td>{new Date(e.fecha).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className="badge" style={{ fontSize: '0.75rem' }}>
                        {e.tipoTest ?? '—'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: Number(e.nota) >= 5 ? '#22c55e' : '#ef4444' }}>
                        {Number(e.nota).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Estadísticas por tema</h3>
        {loadingCatalog && <p>Cargando catálogo...</p>}
        {catalogError && <p className="error">{catalogError}</p>}
        <div className="form-row">
          <select value={selOposicion} onChange={(e) => setSelOposicion(e.target.value)} disabled={loadingCatalog}>
            <option value="">— Oposición —</option>
            {oposiciones.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
          <select
            value={selMateria}
            onChange={(e) => setSelMateria(e.target.value)}
            disabled={!materias.length}
          >
            <option value="">— Materia —</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          <select
            value={selTema}
            onChange={(e) => setSelTema(e.target.value)}
            disabled={!temas.length}
          >
            <option value="">— Tema —</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {loadingTema && <p>Cargando...</p>}
        {temaError && !loadingTema && <p className="error">{temaError}</p>}

        {!repasoLoading && repasoData && repasoData.pendientes > 0 && (
          <div className="repaso-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
            <span className="badge badge--repaso">
              {repasoData.pendientes} pendiente{repasoData.pendientes !== 1 ? 's' : ''} de repaso
            </span>
            <button
              className="btn btn--sm"
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
              <div className="stats-cards" style={{ marginTop: '1rem' }}>
                <div className="stat-card">
                  <span className="stat-value">{temaStats.preguntasVistas}</span>
                  <span className="stat-label">Preguntas vistas</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{temaStats.aciertos}</span>
                  <span className="stat-label">Aciertos</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{temaStats.errores}</span>
                  <span className="stat-label">Errores</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{pctTema}%</span>
                  <span className="stat-label">Tasa de acierto</span>
                </div>
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

      {selOposicion && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
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
                  <div style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Simulacros realizados</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{simulacrosData.length}</div>
                  </div>
                  <div style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Nota media</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: notaMedia >= 5 ? '#22c55e' : '#ef4444' }}>{notaMedia.toFixed(2)}</div>
                  </div>
                  <div style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: 6 }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Mejor nota</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{mejor.nota.toFixed(2)}</div>
                  </div>
                </div>
                <div className="table-wrap">
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
    </section>

      {/* ── Progreso por tema ── */}
      <section style={{ marginTop: '2rem' }}>
        <h2>Progreso por tema</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: '1rem' }}>
          Porcentaje de acierto acumulado en cada tema practicado.
        </p>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={progresoTemasFiltro}
            onChange={(e) => setProgresoTemasFiltro(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #d1d5db' }}
          >
            <option value="">Todas las oposiciones</option>
            {[...new Set((progresoTemas ?? []).map((t) => t.oposicionNombre))].map((nombre) => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {(progresoTemas ?? []).filter((t) => !progresoTemasFiltro || t.oposicionNombre === progresoTemasFiltro).length} temas
          </span>
        </div>

        {progresoTemas === null ? (
          <p>Cargando progreso...</p>
        ) : progresoTemas.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Aún no tienes progreso registrado. Completa algunos tests para ver tus estadísticas por tema.</p>
        ) : (
          <div className="table-wrap">
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
                {(progresoTemas ?? [])
                  .filter((t) => !progresoTemasFiltro || t.oposicionNombre === progresoTemasFiltro)
                  .map((t) => {
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

      <section style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Racha por tema</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>Días consecutivos practicando cada tema</p>
        {rachaTemas === null ? (
          <p style={{ color: '#aaa' }}>Cargando…</p>
        ) : rachaTemas.length === 0 ? (
          <p style={{ color: '#aaa' }}>Aún no has practicado ningún tema.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Tema</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Materia</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Racha actual</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Días activos</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Último día</th>
                </tr>
              </thead>
              <tbody>
                {rachaTemas.slice(0, 15).map((t) => {
                  const rachaColor = t.rachaActual >= 7 ? '#22c55e' : t.rachaActual >= 3 ? '#f59e0b' : '#64748b';
                  return (
                    <tr key={t.temaId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '9px 12px', maxWidth: 240 }}>
                        <Link to={`/tema/${t.temaId}`} style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}>{t.temaNombre}</Link>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#666', fontSize: 13 }}>{t.materiaNombre}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${rachaColor}18`, color: rachaColor, fontWeight: 700, borderRadius: 20, padding: '2px 10px', fontSize: 13 }}>
                          🔥 {t.rachaActual}d
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', color: '#555' }}>{t.diasActivos}</td>
                      <td style={{ padding: '9px 12px', color: '#888', fontSize: 13 }}>{t.ultimoDia ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
