import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { misTestsApi } from '../services/misTestsApi';
import { testApi } from '../services/testApi';
import { getErrorMessage } from '../services/api';

/* ── Paleta ──────────────────────────────────────────────── */
const B    = '#1d4ed8';
const OR   = '#ea580c';
const BBG  = '#eff6ff';
const BD   = '#e5e7eb';
const DK   = '#111827';
const G    = '#374151';
const GL   = '#6b7280';
const GR   = '#f9fafb';

const CARD = {
  background: '#fff',
  borderRadius: 14,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

const DIFF_LABEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil', mixto: 'Mixto' };
const DIFF_COLOR = { facil: '#16a34a', medio: '#d97706', dificil: '#dc2626', mixto: '#6b7280' };

/* ── Spinner ─────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: 12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: `4px solid ${BBG}`, borderTopColor: B, animation: 'spin .8s linear infinite' }} />
      <span style={{ fontSize: '0.82rem', color: GL }}>Cargando…</span>
    </div>
  );
}

/* ── Cabecera de grupo (tema) ────────────────────────────── */
function TemaHeader({ nombre, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: GL, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {nombre || 'Sin tema asignado'}
      </span>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: BBG, color: B, borderRadius: 10, padding: '1px 8px' }}>
        {count}
      </span>
      <div style={{ flex: 1, height: 1, background: BD }} />
    </div>
  );
}

/* ── Card de test ────────────────────────────────────────── */
function TestCard({ test, onIniciar, loading, errorMsg }) {
  const [hov, setHov] = useState(false);
  const diff  = test.nivel_dificultad || 'mixto';
  const mins  = test.duracion_minutos;

  return (
    <div
      style={{
        ...CARD,
        padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,.09)' : CARD.boxShadow,
        transition: 'all .18s',
        border: errorMsg ? '1px solid #fca5a5' : CARD.border,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: BBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          📋
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DK, lineHeight: 1.3 }}>{test.nombre}</div>
          <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>{test.oposicion_nombre}</div>
        </div>
      </div>

      {/* Descripción */}
      {test.descripcion && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>{test.descripcion}</p>
      )}

      {/* Metadatos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {test.total_preguntas > 0 && (
          <span style={{ fontSize: '0.72rem', color: GL }}>📝 {test.total_preguntas} preguntas</span>
        )}
        {mins && (
          <span style={{ fontSize: '0.72rem', color: GL }}>⏱ {mins} min</span>
        )}
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: DIFF_COLOR[diff] ?? GL }}>
          ● {DIFF_LABEL[diff] ?? diff}
        </span>
      </div>

      {(test.temas_resumen || test.tema_nombre) && (
        <div style={{ fontSize: '0.74rem', color: G, lineHeight: 1.45 }}>
          <strong style={{ color: DK }}>Temas:</strong> {test.temas_resumen || test.tema_nombre}
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div style={{ fontSize: '0.78rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Botón */}
      <button
        onClick={() => onIniciar(test)}
        disabled={loading}
        style={{
          padding: '9px 0', borderRadius: 9, border: 'none',
          background: loading ? '#f3f4f6' : hov ? '#c2410c' : OR,
          color: loading ? GL : '#fff',
          fontWeight: 700, fontSize: '0.85rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background .15s',
          boxShadow: !loading ? `0 3px 10px ${OR}30` : 'none',
        }}
      >
        {loading ? 'Iniciando…' : 'Realizar test'}
      </button>
    </div>
  );
}

const TIPO_LABEL = {
  normal: 'Normal', simulacro: 'Simulacro', repaso: 'Repaso', refuerzo: 'Refuerzo', mixto: 'Mixto',
};

function PendienteCard({ test, onContinuar, onCerrar, loadingC, loadingX }) {
  const [hov, setHov] = useState(false);
  const fecha = test.fechaCreacion
    ? new Date(test.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const pct = test.numeroPreguntas > 0
    ? Math.round((test.respondidas / test.numeroPreguntas) * 100)
    : 0;

  return (
    <div
      style={{
        ...CARD,
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,.09)' : CARD.boxShadow,
        transition: 'all .18s',
        borderLeft: `4px solid ${OR}`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
          ⏳
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: DK, lineHeight: 1.3 }}>
            {test.oposicionNombre || test.temaNombre || 'Test sin título'}
          </div>
          <div style={{ fontSize: '0.7rem', color: GL, marginTop: 1 }}>
            {test.temaNombre && test.oposicionNombre ? test.temaNombre : null}
          </div>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#fff7ed', color: OR, borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>
          {TIPO_LABEL[test.tipoTest] ?? test.tipoTest}
        </span>
      </div>

      {/* Progreso */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: GL }}>
          <span>{test.respondidas} / {test.numeroPreguntas} respondidas</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: OR, borderRadius: 999, transition: 'width .3s' }} />
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: GL }}>📅 {fecha}</div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={() => onContinuar(test)}
          disabled={loadingC || loadingX}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: (loadingC || loadingX) ? '#f3f4f6' : OR,
            color: (loadingC || loadingX) ? GL : '#fff',
            fontWeight: 700, fontSize: '0.82rem',
            cursor: (loadingC || loadingX) ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
            boxShadow: !(loadingC || loadingX) ? `0 2px 8px ${OR}30` : 'none',
          }}
        >
          {loadingC ? 'Cargando…' : '▶ Continuar'}
        </button>
        <button
          onClick={() => onCerrar(test.id)}
          disabled={loadingC || loadingX}
          style={{
            padding: '8px 14px', borderRadius: 8,
            border: `1.5px solid ${BD}`, background: '#fff',
            color: GL, fontWeight: 600, fontSize: '0.82rem',
            cursor: (loadingC || loadingX) ? 'not-allowed' : 'pointer',
            transition: 'all .15s',
          }}
        >
          {loadingX ? '…' : '✕ Cerrar'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MisTestsPage
   ══════════════════════════════════════════════════════════ */
export default function MisTestsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { oposicionActiva } = useOposicionActiva();

  const [tests,     setTests    ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [activeId,  setActiveId ] = useState(null);
  const [errores,   setErrores  ] = useState({});

  const [pendientes,    setPendientes   ] = useState([]);
  const [loadingPend,   setLoadingPend  ] = useState(true);
  const [continuandoId, setContinuandoId] = useState(null);
  const [cerrandoId,    setCerrandoId   ] = useState(null);

  useEffect(() => {
    misTestsApi.getPublicados(token)
      .then((res) => {
        const lista = Array.isArray(res) ? res : (res?.data ?? []);
        setTests(lista);
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));

    testApi.getPendientes(token)
      .then((res) => {
        const lista = Array.isArray(res) ? res : (res?.data ?? []);
        setPendientes(lista);
      })
      .catch(() => setPendientes([]))
      .finally(() => setLoadingPend(false));
  }, [token]);

  const getOposicionId = (item) => (
    Number(item?.oposicionId ?? item?.oposicion_id ?? item?.oposicion?.id ?? 0) || null
  );

  const isInActiveOposicion = (item) => {
    if (!oposicionActiva?.id) return true;
    return getOposicionId(item) === Number(oposicionActiva.id);
  };

  /* Filtrar simulacros (van a su propia página) y respetar la oposición activa */
  const pendientesSinSim = useMemo(
    () => pendientes.filter((t) => t.tipoTest !== 'simulacro' && isInActiveOposicion(t)),
    [pendientes, oposicionActiva?.id],
  );

  const testsFiltrados = useMemo(
    () => tests.filter((t) => isInActiveOposicion(t)),
    [tests, oposicionActiva?.id],
  );

  /* Agrupar por tema */
  const porTema = useMemo(() => {
    const mapa = new Map();
    for (const t of testsFiltrados) {
      const clave = t.temas_resumen || t.tema_nombre || '__sin_tema__';
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(t);
    }
    return mapa;
  }, [testsFiltrados]);

  const onIniciar = async (test) => {
    if (activeId) return;
    setActiveId(test.id);
    setErrores((prev) => ({ ...prev, [test.id]: null }));
    try {
      const resp = await misTestsApi.iniciar(token, test.id);
      const data = resp?.data ?? resp;
      if (data) {
        sessionStorage.setItem('active_test', JSON.stringify(data));
        navigate('/test');
      }
    } catch (err) {
      setErrores((prev) => ({ ...prev, [test.id]: getErrorMessage(err, 'No se pudo iniciar el test') }));
    } finally {
      setActiveId(null);
    }
  };

  const onContinuar = async (test) => {
    if (continuandoId) return;
    setContinuandoId(test.id);
    try {
      const res = await testApi.getConfig(token, test.id);
      const cfg = res?.data ?? res;
      if (!cfg) return;
      const activeTest = {
        testId:          cfg.id,
        temaId:          cfg.temaId,
        oposicionId:     cfg.oposicionId,
        temaNombre:      test.temaNombre || null,
        oposicionNombre: test.oposicionNombre || null,
        modo:            cfg.tipoTest,
        dificultad:      'mixto',
        numeroPreguntas: cfg.numeroPreguntas,
        duracionSegundos: null,
        feedbackInmediato: false,
        preguntas:       cfg.preguntas,
      };
      sessionStorage.setItem('active_test', JSON.stringify(activeTest));
      navigate('/test');
    } catch {
      // silencioso; el test sigue en la lista
    } finally {
      setContinuandoId(null);
    }
  };

  const onCerrar = async (testId) => {
    if (cerrandoId) return;
    setCerrandoId(testId);
    try {
      await testApi.cerrar(token, testId);
      setPendientes((prev) => prev.filter((t) => t.id !== testId));
    } catch {
      // silencioso
    } finally {
      setCerrandoId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado global */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: DK, letterSpacing: '-0.02em' }}>Mis tests</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: GL }}>
            Tests pendientes y tests del profesor, ordenados por tema.
          </p>
        </div>
        <Link
          to="/configurar-test"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: OR, color: '#fff', borderRadius: 10,
            padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none', boxShadow: `0 3px 12px ${OR}40`,
            whiteSpace: 'nowrap',
          }}
        >
          + Crear test propio
        </Link>
      </div>

      {/* ── Tests sin finalizar ──────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: OR, letterSpacing: '-0.01em' }}>⏳ Tests sin finalizar</h2>
            {!loadingPend && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#fff7ed', color: OR, borderRadius: 10, padding: '2px 10px', border: '1px solid #fed7aa' }}>
                {pendientesSinSim.length}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>Tests que empezaste y no enviaste. Puedes continuarlos o cerrarlos.</p>
        </div>
        {loadingPend ? (
          <Spinner />
        ) : pendientesSinSim.length === 0 ? (
          <div style={{ ...CARD, padding: '1.5rem 1.75rem', background: GR, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: GL }}>No tienes tests pendientes. ¡Todo al día!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {pendientesSinSim.map((t) => (
              <PendienteCard
                key={t.id}
                test={t}
                onContinuar={onContinuar}
                onCerrar={onCerrar}
                loadingC={continuandoId === t.id}
                loadingX={cerrandoId === t.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Tests del profesor ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: B, letterSpacing: '-0.01em' }}>📋 Tests del profesor</h2>
          {!loading && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, background: BBG, color: B, borderRadius: 10, padding: '2px 10px', border: `1px solid ${BD}` }}>
              {testsFiltrados.length}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>Tests preparados por tu profesor, ordenados por tema.</p>
      </div>

      {/* Cuerpo */}
      {loading ? (
        <Spinner />
      ) : testsFiltrados.length === 0 ? (
        <div style={{ ...CARD, padding: '3rem', textAlign: 'center', background: GR }}>
          <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>📭</div>
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: DK, fontSize: '0.95rem' }}>
            Sin tests publicados
          </p>
          <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: GL }}>
            Cuando el profesor publique un test aparecerá aquí, ordenado por tema.
          </p>
          <Link
            to="/configurar-test"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: OR, color: '#fff', borderRadius: 9,
              padding: '10px 22px', fontWeight: 700, fontSize: '0.85rem',
              textDecoration: 'none',
            }}
          >
            + Crear mi propio test
          </Link>
        </div>
      ) : (
        Array.from(porTema.entries()).map(([temaNombre, items]) => (
          <div key={temaNombre}>
            <TemaHeader
              nombre={temaNombre === '__sin_tema__' ? 'Sin tema asignado' : temaNombre}
              count={items.length}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {items.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onIniciar={onIniciar}
                  loading={activeId === test.id}
                  errorMsg={errores[test.id] || null}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

