import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  );
}
