import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';
import { testApi } from '../services/testApi';
import { catalogApi } from '../services/catalogApi';
import { useAuth } from '../state/auth.jsx';

export default function ProgressPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  // Cascading selectors for per-tema stats
  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selOposicion, setSelOposicion] = useState('');
  const [selMateria, setSelMateria] = useState('');
  const [selTema, setSelTema] = useState('');
  const [temaStats, setTemaStats] = useState(null);
  const [loadingTema, setLoadingTema] = useState(false);

  useEffect(() => {
    testApi.userStats(token).then(setStats).catch((e) => setError(getErrorMessage(e)));
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!selOposicion) {
      setMaterias([]);
      setSelMateria('');
      setTemas([]);
      setSelTema('');
      return;
    }
    catalogApi.getMaterias(selOposicion).then(setMaterias).catch(() => {});
    setSelMateria('');
    setTemas([]);
    setSelTema('');
  }, [selOposicion]);

  useEffect(() => {
    if (!selMateria) {
      setTemas([]);
      setSelTema('');
      return;
    }
    catalogApi.getTemas(selMateria).then(setTemas).catch(() => {});
    setSelTema('');
  }, [selMateria]);

  useEffect(() => {
    if (!selTema) {
      setTemaStats(null);
      return;
    }
    setLoadingTema(true);
    testApi
      .temaStats(token, selTema)
      .then(setTemaStats)
      .catch(() => setTemaStats(null))
      .finally(() => setLoadingTema(false));
  }, [selTema, token]);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Cargando progreso...</p>;

  const totalRespondidas = stats.aciertos + stats.errores + stats.blancos;
  const pctAcierto = totalRespondidas > 0
    ? Math.round((stats.aciertos / totalRespondidas) * 100)
    : 0;

  return (
    <section>
      <h2>Mi Progreso</h2>

      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-value">{stats.total_tests}</span>
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
          <span className="stat-value">{stats.nota_media}</span>
          <span className="stat-label">Nota media</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.tiempo_medio} s</span>
          <span className="stat-label">Tiempo medio</span>
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
        <div className="form-row">
          <select value={selOposicion} onChange={(e) => setSelOposicion(e.target.value)}>
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

        {temaStats && !loadingTema && (
          <div className="stats-cards" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <span className="stat-value">{temaStats.preguntas_vistas}</span>
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
              <span className="stat-value">
                {temaStats.preguntas_vistas > 0
                  ? Math.round((temaStats.aciertos / temaStats.preguntas_vistas) * 100)
                  : 0}%
              </span>
              <span className="stat-label">Tasa de acierto</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
