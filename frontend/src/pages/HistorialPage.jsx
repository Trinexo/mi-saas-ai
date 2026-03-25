import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { catalogApi } from '../services/catalogApi';
import { useAuth } from '../state/auth.jsx';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };

export default function HistorialPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [oposicionId, setOposicionId] = useState('');
  const [oposiciones, setOposiciones] = useState([]);
  const [modoFiltro, setModoFiltro] = useState('todos');
  const [textoFiltro, setTextoFiltro] = useState('');
  const [notaFiltro, setNotaFiltro] = useState('todas');
  const [periodoFiltro, setPeriodoFiltro] = useState('30d');
  const [ordenFiltro, setOrdenFiltro] = useState('fecha_desc');
  const [erroresFiltro, setErroresFiltro] = useState('todos');
  const [duracionFiltro, setDuracionFiltro] = useState('todos');
  const [blancosFiltro, setBlancosFiltro] = useState('todos');
  const [ritmoFiltro, setRitmoFiltro] = useState('todos');
  const [consistenciaFiltro, setConsistenciaFiltro] = useState('todos');

  useEffect(() => {
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
  }, []);

  useEffect(() => {
    setItems(null);
    const params = { limit: PAGE_SIZE, page };
    if (oposicionId) params.oposicion_id = Number(oposicionId);
    if (periodoFiltro === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      params.desde = d.toISOString().slice(0, 10);
    } else if (periodoFiltro === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      params.desde = d.toISOString().slice(0, 10);
    }
    testApi.history(token, params)
      .then((data) => {
        if (data && data.items) {
          setItems(data.items);
          setTotal(data.total ?? data.items.length);
        } else {
          setItems(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }
      })
      .catch((e) => setError(e.message || 'No se pudo cargar el historial'));
  }, [token, page, oposicionId, periodoFiltro]);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const testsLast7Days = (items ?? []).filter((t) => new Date(t.fecha) > sevenDaysAgo).length;
  const testsSemana = (items ?? []).filter((t) => new Date(t.fecha) > sevenDaysAgo);
  const mejorTestSemana = testsSemana.reduce((best, t) => {
    if (!best) return t;
    return Number(t.nota ?? 0) > Number(best.nota ?? 0) ? t : best;
  }, null);
  const bestNoteLast30Days = (items ?? [])
    .filter((t) => new Date(t.fecha) > thirtyDaysAgo)
    .reduce((max, t) => Math.max(max, t.nota ?? 0), 0);

  const testsPorDia = (items ?? []).reduce((acc, t) => {
    const fechaKey = new Date(t.fecha).toISOString().slice(0, 10);
    acc[fechaKey] = (acc[fechaKey] || 0) + 1;
    return acc;
  }, {});

  const itemsFiltrados = (items ?? []).filter((t) => {
    const fecha = new Date(t.fecha);
    const byModo = modoFiltro === 'todos' || String(t.tipoTest) === modoFiltro;
    const nota = Number(t.nota ?? 0);
    const byNota = notaFiltro === 'todas' || (notaFiltro === 'aprobados' ? nota >= 5 : nota < 5);
    const errores = Number(t.errores ?? 0);
    const byErrores = erroresFiltro === 'todos' || (erroresFiltro === 'con' ? errores > 0 : errores === 0);
    const blancos = Number(t.blancos ?? 0);
    const byBlancos = blancosFiltro === 'todos' || (blancosFiltro === 'con' ? blancos > 0 : blancos === 0);
    const minutos = Number(t.tiempoSegundos ?? 0) / 60;
    const byDuracion = duracionFiltro === 'todos'
      || (duracionFiltro === 'cortos' && minutos > 0 && minutos < 10)
      || (duracionFiltro === 'medios' && minutos >= 10 && minutos <= 30)
      || (duracionFiltro === 'largos' && minutos > 30);
    const totalPreguntas = Number(t.aciertos ?? 0) + Number(t.errores ?? 0) + Number(t.blancos ?? 0);
    const segundosPorPregunta = totalPreguntas > 0 ? Number(t.tiempoSegundos ?? 0) / totalPreguntas : 0;
    const byRitmo = ritmoFiltro === 'todos'
      || (ritmoFiltro === 'rapidos' && segundosPorPregunta > 0 && segundosPorPregunta < 45)
      || (ritmoFiltro === 'medios' && segundosPorPregunta >= 45 && segundosPorPregunta <= 90)
      || (ritmoFiltro === 'pausados' && segundosPorPregunta > 90);
    const fechaKey = fecha.toISOString().slice(0, 10);
    const volumenDia = Number(testsPorDia[fechaKey] || 0);
    const byConsistencia = consistenciaFiltro === 'todos'
      || (consistenciaFiltro === 'alta' && volumenDia >= 3)
      || (consistenciaFiltro === 'media' && volumenDia === 2)
      || (consistenciaFiltro === 'baja' && volumenDia === 1);
    const texto = textoFiltro.trim().toLowerCase();
    const hayTexto = texto.length > 0;
    const compuesto = `${t.oposicionNombre || ''} ${t.materiaNombre || ''} ${t.temaNombre || ''}`.toLowerCase();
    const byTexto = !hayTexto || compuesto.includes(texto);
    return byModo && byNota && byErrores && byBlancos && byDuracion && byRitmo && byConsistencia && byTexto;
  });

  const itemsOrdenados = [...itemsFiltrados].sort((a, b) => {
    if (ordenFiltro === 'nota_desc') {
      return Number(b.nota ?? 0) - Number(a.nota ?? 0);
    }
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  const handleReintentar = async (testId) => {
    try {
      const config = await testApi.getConfig(token, testId);
      const payload = {
        numeroPreguntas: config.numeroPreguntas,
        modo: config.tipoTest === 'simulacro' ? 'simulacro' : 'adaptativo',
        dificultad: 'mixto',
      };
      if (config.tipoTest === 'simulacro') {
        payload.oposicionId = config.oposicionId;
      } else {
        payload.temaId = config.temaId;
      }
      const test = await testApi.generate(token, payload);
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    } catch (e) {
      setError(e.message || 'No se pudo reintentar el test');
    }
  };

  if (error) return <p style={{ color: '#dc2626', padding: '1rem' }}>{error}</p>;
  if (!items) return <p>Cargando historial...</p>;
  if (items.length === 0) return <p>Aún no tienes tests finalizados.</p>;

  return (
    <section>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Historial</span>
      </nav>
      <h2>Historial de tests</h2>
      <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Total: {total} tests · mostrando {itemsFiltrados.length} con los filtros activos</p>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.75rem 0 1rem', flexWrap: 'wrap' }}>
        <select value={modoFiltro} onChange={(e) => setModoFiltro(e.target.value)}>
          <option value="todos">Todos los modos</option>
          <option value="adaptativo">Adaptativo</option>
          <option value="normal">Normal</option>
          <option value="repaso">Repaso</option>
          <option value="refuerzo">Refuerzo</option>
          <option value="simulacro">Simulacro</option>
          <option value="marcadas">Marcadas</option>
        </select>
        <select value={oposicionId} onChange={(e) => { setOposicionId(e.target.value); setPage(1); }}>
          <option value="">Todas las oposiciones</option>
          {oposiciones.map((op) => (
            <option key={op.id} value={String(op.id)}>{op.nombre}</option>
          ))}
        </select>
        <input
          type="text"
          value={textoFiltro}
          onChange={(e) => setTextoFiltro(e.target.value)}
          placeholder="Buscar por oposición, materia o tema"
          style={{ minWidth: 260 }}
        />
        <select value={notaFiltro} onChange={(e) => setNotaFiltro(e.target.value)}>
          <option value="todas">Todas las notas</option>
          <option value="aprobados">Aprobados (≥5)</option>
          <option value="suspensos">Suspensos (&lt;5)</option>
        </select>
        <select value={periodoFiltro} onChange={(e) => { setPeriodoFiltro(e.target.value); setPage(1); }}>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="todo">Todo</option>
        </select>
        <select value={ordenFiltro} onChange={(e) => setOrdenFiltro(e.target.value)}>
          <option value="fecha_desc">Fecha (reciente primero)</option>
          <option value="nota_desc">Nota (alta primero)</option>
        </select>
        <select value={erroresFiltro} onChange={(e) => setErroresFiltro(e.target.value)}>
          <option value="todos">Errores: todos</option>
          <option value="con">Con errores</option>
          <option value="sin">Sin errores</option>
        </select>
        <select value={duracionFiltro} onChange={(e) => setDuracionFiltro(e.target.value)}>
          <option value="todos">Duración: todos</option>
          <option value="cortos">Cortos (&lt;10 min)</option>
          <option value="medios">Medios (10–30 min)</option>
          <option value="largos">Largos (&gt;30 min)</option>
        </select>
        <select value={blancosFiltro} onChange={(e) => setBlancosFiltro(e.target.value)}>
          <option value="todos">Blancos: todos</option>
          <option value="con">Con blancos</option>
          <option value="sin">Sin blancos</option>
        </select>
        <select value={ritmoFiltro} onChange={(e) => setRitmoFiltro(e.target.value)}>
          <option value="todos">Ritmo: todos</option>
          <option value="rapidos">Rápidos (&lt;45s/pregunta)</option>
          <option value="medios">Medios (45–90s/pregunta)</option>
          <option value="pausados">Pausados (&gt;90s/pregunta)</option>
        </select>
        <select value={consistenciaFiltro} onChange={(e) => setConsistenciaFiltro(e.target.value)}>
          <option value="todos">Constancia diaria: todos</option>
          <option value="alta">Alta (≥3 tests en el día)</option>
          <option value="media">Media (2 tests en el día)</option>
          <option value="baja">Baja (1 test en el día)</option>
        </select>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Mostrando {itemsFiltrados.length} de {items.length}</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tests últimos 7 días</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{testsLast7Days}</div>
        </div>
        <div style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Mejor nota últimos 30 días</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{bestNoteLast30Days.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleReintentar(mejorTestSemana.id)}
          disabled={!mejorTestSemana}
        >
          Reintentar mejor test semanal
        </button>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          {mejorTestSemana
            ? `Mejor nota 7 días: ${Number(mejorTestSemana.nota).toFixed(2)}`
            : 'No hay tests esta semana'}
        </span>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Modo</th>
              <th>Oposición</th>
              <th>Materia/Tema</th>
              <th>Resultado</th>
              <th>Nota</th>
              <th>Revisión</th>
              <th>Reintentar</th>
            </tr>
          </thead>
          <tbody>
            {itemsOrdenados.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.fecha).toLocaleDateString('es-ES')}</td>
                <td>{MODO_LABEL[t.tipoTest] ?? t.tipoTest}</td>
                <td>
                  {t.oposicionId
                    ? <Link to={`/oposicion/${t.oposicionId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{t.oposicionNombre}</Link>
                    : (t.oposicionNombre || '—')}
                </td>
                <td>
                  {t.materiaNombre || '—'}
                  {t.temaId
                    ? <> / <Link to={`/tema/${t.temaId}`} style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}>{t.temaNombre}</Link></>
                    : (t.temaNombre ? ` / ${t.temaNombre}` : '')}
                </td>
                <td>{t.aciertos}A · {t.errores}E · {t.blancos}B</td>
                <td><strong>{t.nota}</strong></td>
                <td><Link to={`/revision/${t.id}`}>Ver</Link></td>
                <td><button onClick={() => handleReintentar(t.id)}>Reintentar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</button>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Página {page} de {Math.ceil(total / PAGE_SIZE)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / PAGE_SIZE)}>Siguiente →</button>
        </div>
      )}
    </section>
  );
}
