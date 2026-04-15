import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { catalogApi } from '../services/catalogApi';
import { useAuth } from '../state/auth.jsx';
import { useUserPlan } from '../hooks/useUserPlan';
import HistorialFiltros from '../components/historial/HistorialFiltros';
import HistorialStats from '../components/historial/HistorialStats';
import HistorialTabla from '../components/historial/HistorialTabla';
import HistorialPaginacion from '../components/historial/HistorialPaginacion';

export default function HistorialPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { hasAccess } = useUserPlan();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [planLimit, setPlanLimit] = useState(null);
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
          if (data.planLimit != null) setPlanLimit(data.planLimit);
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

  if (error) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
      <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
    </div>
  );
  if (!items) return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Cargando historial…</p>
    </div>
  );
  if (items.length === 0) return (
    <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
      <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '1rem' }}>Aún no tienes tests finalizados</p>
      <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Completa tu primer test para ver el historial aquí.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Historial de tests</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Tu actividad de los últimos tests completados</p>
        </div>
        <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8' }}>
          {total} tests
        </span>
      </div>

      {/* Banner plan free */}
      {!hasAccess('pro') && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '10px 16px', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
            📋 Con el plan gratuito ves los últimos <strong>{planLimit ?? 5} tests</strong>. Actualiza a Pro para acceder a todo tu historial.
          </span>
          <button
            onClick={() => navigate('/planes')}
            style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #d97706', background: '#fff', color: '#92400e', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Ver planes
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
        <HistorialFiltros
          oposiciones={oposiciones}
          modoFiltro={modoFiltro} setModoFiltro={setModoFiltro}
          oposicionId={oposicionId} setOposicionId={setOposicionId}
          textoFiltro={textoFiltro} setTextoFiltro={setTextoFiltro}
          notaFiltro={notaFiltro} setNotaFiltro={setNotaFiltro}
          periodoFiltro={periodoFiltro} setPeriodoFiltro={setPeriodoFiltro}
          ordenFiltro={ordenFiltro} setOrdenFiltro={setOrdenFiltro}
          erroresFiltro={erroresFiltro} setErroresFiltro={setErroresFiltro}
          duracionFiltro={duracionFiltro} setDuracionFiltro={setDuracionFiltro}
          blancosFiltro={blancosFiltro} setBlancosFiltro={setBlancosFiltro}
          ritmoFiltro={ritmoFiltro} setRitmoFiltro={setRitmoFiltro}
          consistenciaFiltro={consistenciaFiltro} setConsistenciaFiltro={setConsistenciaFiltro}
          filtradosCount={itemsFiltrados.length}
          totalCount={items.length}
          onResetPage={() => setPage(1)}
        />
      </div>

      <HistorialStats
        testsLast7Days={testsLast7Days}
        bestNoteLast30Days={bestNoteLast30Days}
        mejorTestSemana={mejorTestSemana}
        onReintentar={handleReintentar}
      />

      <HistorialTabla itemsOrdenados={itemsOrdenados} onReintentar={handleReintentar} />

      <HistorialPaginacion
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );
}
