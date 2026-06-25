import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { testApi } from '../services/testApi';
import { simulacrosApi } from '../services/simulacrosApi';
import { getErrorMessage } from '../services/api';
import SimulacroForm from '../components/forms/SimulacroForm';

/* ── Paleta ─────────────────────────────────────────── */
const O    = '#ea580c';
const OBG  = '#fff7ed';
const OL   = '#fb923c';
const BD   = '#e5e7eb';
const DK   = '#111827';
const G    = '#374151';
const GL   = '#6b7280';
const GR   = '#f9fafb';
const GN   = '#16a34a';

const CARD = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

/* ── Spinner ──────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: 12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: `4px solid ${OBG}`, borderTopColor: O, animation: 'spin .8s linear infinite' }} />
      <span style={{ fontSize: '0.82rem', color: GL }}>Cargando…</span>
    </div>
  );
}

/* ── SectionHeader ─────────────────────────────────── */
function SectionHeader({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      {count != null && (
        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: OBG, color: O, borderRadius: 10, padding: '1px 8px' }}>{count}</span>
      )}
    </div>
  );
}

/* ── Card simulacro del profesor ──────────────────── */
function SimulacroProfesorCard({ sim, onIniciar, loading, errorMsg }) {
  const [hov, setHov] = useState(false);
  const mins = sim.tiempo_limite_segundos ? Math.round(sim.tiempo_limite_segundos / 60) : null;

  const fechaPub = sim.fecha_publicacion
    ? new Date(sim.fecha_publicacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const ahora        = new Date();
  const pubDate      = sim.fecha_publicacion ? new Date(sim.fecha_publicacion) : null;
  const esProximo    = pubDate && pubDate > ahora;
  const diasRestantes = pubDate ? Math.ceil((pubDate - ahora) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div
      style={{
        ...CARD,
        padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        transform: hov && !esProximo ? 'translateY(-2px)' : 'none',
        boxShadow: hov && !esProximo ? '0 6px 20px rgba(0,0,0,.09)' : CARD.boxShadow,
        transition: 'all .18s',
        border: errorMsg ? '1px solid #fca5a5' : esProximo ? `1px solid #a5b4fc` : CARD.border,
        opacity: esProximo ? 0.8 : 1,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: esProximo ? '#eef2ff' : OBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
          {esProximo ? '📅' : '🎯'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: DK, lineHeight: 1.3 }}>{sim.nombre}</div>
          <div style={{ fontSize: '0.75rem', color: GL, marginTop: 2 }}>{sim.oposicion_nombre}</div>
        </div>
        {esProximo && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#eef2ff', color: '#4f46e5', padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
            En {diasRestantes}d
          </span>
        )}
      </div>

      {sim.descripcion && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: G, lineHeight: 1.5 }}>{sim.descripcion}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {sim.total_preguntas > 0 && <span style={{ fontSize: '0.72rem', color: GL }}>📝 {sim.total_preguntas} preguntas</span>}
        {mins && <span style={{ fontSize: '0.72rem', color: GL }}>⏱ {mins} min</span>}
        {sim.penalizacion && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>⚠️ Penalización</span>}
        {fechaPub && <span style={{ fontSize: '0.72rem', color: esProximo ? '#4f46e5' : GL }}>{esProximo ? '🗓 Disponible el ' : '📅 '}{fechaPub}</span>}
      </div>

      {errorMsg && (
        <div style={{ fontSize: '0.78rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        onClick={() => !esProximo && onIniciar(sim)}
        disabled={loading || esProximo}
        style={{
          padding: '9px 0', borderRadius: 9, border: 'none',
          background: esProximo ? '#e0e7ff' : loading ? '#f3f4f6' : hov ? '#c2410c' : O,
          color: esProximo ? '#4f46e5' : loading ? GL : '#fff',
          fontWeight: 700, fontSize: '0.85rem',
          cursor: esProximo || loading ? 'not-allowed' : 'pointer',
          transition: 'background .15s',
          boxShadow: !esProximo && !loading ? `0 3px 10px ${O}30` : 'none',
        }}
      >
        {loading ? 'Iniciando…' : esProximo ? 'Próximamente' : 'Realizar simulacro'}
      </button>
    </div>
  );
}

/* ── Card simulacro pendiente (sin finalizar) ────── */
function PendienteSimulacroCard({ test, onContinuar, onCerrar, loadingC, loadingX }) {
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
        borderLeft: `4px solid ${O}`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: OBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
          ⏳
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: DK, lineHeight: 1.3 }}>
            {test.oposicionNombre || test.temaNombre || 'Simulacro sin título'}
          </div>
          <div style={{ fontSize: '0.7rem', color: GL, marginTop: 1 }}>{test.temaNombre && test.oposicionNombre ? test.temaNombre : null}</div>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: OBG, color: O, borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>Simulacro</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: GL }}>
          <span>{test.respondidas} / {test.numeroPreguntas} respondidas</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: O, borderRadius: 999, transition: 'width .3s' }} />
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: GL }}>📅 {fecha}</div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={() => onContinuar(test)}
          disabled={loadingC || loadingX}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
            background: (loadingC || loadingX) ? '#f3f4f6' : O,
            color: (loadingC || loadingX) ? GL : '#fff',
            fontWeight: 700, fontSize: '0.82rem',
            cursor: (loadingC || loadingX) ? 'not-allowed' : 'pointer',
            transition: 'background .15s',
            boxShadow: !(loadingC || loadingX) ? `0 2px 8px ${O}30` : 'none',
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
          }}
        >
          {loadingX ? '…' : '✕ Cerrar'}
        </button>
      </div>
    </div>
  );
}

/* ── Fila historial ───────────────────────────────── */
function HistorialRow({ item }) {
  const total = item.numeroPreguntas || item.total || 0;
  const pct   = total > 0 ? Math.round(((item.aciertos || 0) / total) * 100) : null;
  const fecha = item.fecha
    ? new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';
  const color = pct == null ? GL : pct >= 70 ? GN : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <>
      <td style={{ padding: '10px 0', fontSize: '0.82rem', color: G }}>{item.oposicionNombre || 'Simulacro'}</td>
      <td style={{ padding: '10px 0', fontSize: '0.82rem', color: GL, textAlign: 'center' }}>{total}</td>
      <td style={{ padding: '10px 0', fontWeight: 700, fontSize: '0.85rem', color, textAlign: 'center' }}>
        {pct != null ? `${pct}%` : '—'}
      </td>
      <td style={{ padding: '10px 0', fontSize: '0.78rem', color: GL, textAlign: 'right' }}>{fecha}</td>
    </>
  );
}

/* ══════════════════════════════════════════════════
   SimulacrosPage
   ══════════════════════════════════════════════════ */
export default function SimulacrosPage() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const { accesos, loading: loadingAccesos } = useUserAccesos();

  const [simulacrosProfesor, setSimulacrosProfesor] = useState([]);
  const [historial,          setHistorial          ] = useState([]);
  const [loadingData,        setLoadingData        ] = useState(true);
  const [activeSim,          setActiveSim          ] = useState(null);
  const [erroresSim,         setErroresSim         ] = useState({});
  const [mostrarForm,        setMostrarForm        ] = useState(false);

  const [pendientesSim,  setPendientesSim ] = useState([]);
  const [loadingPend,    setLoadingPend   ] = useState(true);
  const [continuandoId,  setContinuandoId ] = useState(null);
  const [cerrandoId,     setCerrandoId    ] = useState(null);

  useEffect(() => {
    const oposicionId = oposicionActiva?.id;
    const modoPreparacion = oposicionActiva?.modoPreparacion ?? 'experto';
    Promise.all([
      simulacrosApi.getPublicados(token, oposicionId).catch(() => []),
      testApi.history(token, { limit: 50, modo_preparacion: modoPreparacion, ...(oposicionId ? { oposicion_id: oposicionId } : {}) }).catch(() => ({ items: [] })),
      testApi.getPendientes(token, oposicionId).catch(() => []),
    ]).then(([sims, histResp, pendRes]) => {
      const lista = Array.isArray(sims) ? sims : (sims?.data ?? []);
      setSimulacrosProfesor(lista);
      const items = histResp?.items ?? (Array.isArray(histResp) ? histResp : []);
      setHistorial(items.filter((h) => h.tipoTest === 'simulacro'));
      const pend = Array.isArray(pendRes) ? pendRes : (pendRes?.data ?? []);
      setPendientesSim(pend.filter((t) => t.tipoTest === 'simulacro'));
    }).finally(() => { setLoadingData(false); setLoadingPend(false); });
  }, [token, accesos, oposicionActiva?.id, oposicionActiva?.modoPreparacion]);

  const onContinuar = async (test) => {
    if (continuandoId) return;
    setContinuandoId(test.id);
    try {
      const res = await testApi.getConfig(token, test.id);
      const cfg = res?.data ?? res;
      if (!cfg) return;
      const activeTest = {
        testId:           cfg.id,
        temaId:           cfg.temaId,
        oposicionId:      cfg.oposicionId,
        temaNombre:       test.temaNombre || null,
        oposicionNombre:  test.oposicionNombre || null,
        modo:             cfg.tipoTest,
        dificultad:       'mixto',
        numeroPreguntas:  cfg.numeroPreguntas,
        duracionSegundos: null,
        feedbackInmediato: false,
        preguntas:        cfg.preguntas,
      };
      sessionStorage.setItem('active_test', JSON.stringify(activeTest));
      navigate('/test');
    } catch {
      // silencioso
    } finally {
      setContinuandoId(null);
    }
  };

  const onCerrar = async (testId) => {
    if (cerrandoId) return;
    setCerrandoId(testId);
    try {
      await testApi.cerrar(token, testId);
      setPendientesSim((prev) => prev.filter((t) => t.id !== testId));
    } catch {
      // silencioso
    } finally {
      setCerrandoId(null);
    }
  };

  const loading = loadingData || loadingAccesos;

  const onIniciarProfesor = async (sim) => {
    setActiveSim(sim.id);
    setErroresSim((prev) => ({ ...prev, [sim.id]: null }));
    try {
      const resp = await simulacrosApi.iniciar(token, sim.id);
      const data = resp?.data ?? resp;
      if (data) {
        sessionStorage.setItem('active_test', JSON.stringify(data));
        navigate('/test');
      }
    } catch (err) {
      setErroresSim((prev) => ({
        ...prev,
        [sim.id]: getErrorMessage(err, 'No se pudo iniciar el simulacro'),
      }));
    } finally {
      setActiveSim(null);
    }
  };

  /* ─── Render ─────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: DK, letterSpacing: '-0.02em' }}>Simulacros</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: GL }}>
            Exámenes en condiciones reales. El resultado se muestra al finalizar.
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: OBG, color: O, padding: '4px 12px', borderRadius: 20 }}>
          🎯 Modo examen
        </span>
      </div>

      {/* Info banner */}
      <div style={{ ...CARD, padding: '12px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, background: OBG, border: `1px solid ${OL}40` }}>
        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
        <span style={{ fontSize: '0.82rem', color: G, lineHeight: 1.6 }}>
          <strong style={{ color: DK }}>Sin feedback durante el examen.</strong> No verás si has acertado hasta terminar.
          El simulacro se entrega automáticamente al agotar el tiempo.
        </span>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ══ SECCIÓN 1: Simulacros del profesor ══ */}
          <div style={{ marginBottom: 36 }}>
            <SectionHeader label="Simulacros del profesor" count={simulacrosProfesor.length || null} />
            {simulacrosProfesor.length === 0 ? (
              <div style={{ ...CARD, padding: '2.5rem', textAlign: 'center', background: GR }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📭</div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: DK, fontSize: '0.92rem' }}>Sin simulacros publicados</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>Cuando el profesor publique un simulacro aparecerá aquí, ordenado por fecha de convocatoria.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {simulacrosProfesor.map((sim) => (
                  <SimulacroProfesorCard
                    key={sim.id}
                    sim={sim}
                    onIniciar={onIniciarProfesor}
                    loading={activeSim === sim.id}
                    errorMsg={erroresSim[sim.id] || null}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ══ SECCIÓN 2: Simulacros sin finalizar ══ */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: O, letterSpacing: '-0.01em' }}>⏳ Simulacros sin finalizar</h2>
                {!loadingPend && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: OBG, color: O, borderRadius: 10, padding: '2px 10px', border: '1px solid #fed7aa' }}>
                    {pendientesSim.length}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>Simulacros que empezaste y no enviaste. Puedes continuarlos o cerrarlos.</p>
            </div>
            {loadingPend ? (
              <Spinner />
            ) : pendientesSim.length === 0 ? (
              <div style={{ ...CARD, padding: '1.5rem 1.75rem', background: GR, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: GL }}>No tienes simulacros pendientes. ¡Todo al día!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {pendientesSim.map((t) => (
                  <PendienteSimulacroCard
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

          {/* ══ SECCIÓN 3: Simulacro personalizado ══ */}
          <div style={{ marginBottom: 36 }}>
            <SectionHeader label="Simulacro personalizado" />
            {!mostrarForm ? (
              <div
                style={{ ...CARD, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', cursor: 'pointer' }}
                onClick={() => setMostrarForm(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: OBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>⚙️</div>
                  <div>
                    <div style={{ fontWeight: 700, color: DK, fontSize: '0.9rem' }}>Crear simulacro personalizado</div>
                    <div style={{ fontSize: '0.78rem', color: GL, marginTop: 2 }}>Elige oposición, número de preguntas y tiempo límite</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: O, whiteSpace: 'nowrap' }}>Configurar →</span>
              </div>
            ) : (
              <div style={{ ...CARD, padding: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px 0' }}>
                  <button
                    onClick={() => setMostrarForm(false)}
                    style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: GL, cursor: 'pointer', fontWeight: 600 }}
                  >
                    ✕ Cerrar
                  </button>
                </div>
                <SimulacroForm />
              </div>
            )}
          </div>

          {/* ══ SECCIÓN 4: Mis resultados ══ */}
          <div style={{ marginBottom: 32 }}>
            <SectionHeader label="Mis resultados" count={historial.length || null} />
            {historial.length === 0 ? (
              <div style={{ ...CARD, padding: '2.5rem', textAlign: 'center', background: GR }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: DK, fontSize: '0.92rem' }}>Aún no has completado ningún simulacro</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>Los resultados aparecerán aquí al finalizar.</p>
              </div>
            ) : (
              <div style={{ ...CARD, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <span onClick={() => navigate('/historial')} style={{ fontSize: '0.75rem', color: O, fontWeight: 700, cursor: 'pointer' }}>Ver todo el historial →</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ fontSize: '0.68rem', color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {['Examen', 'Preguntas', 'Resultado', 'Fecha'].map((h, i) => (
                        <th key={h} style={{ fontWeight: 600, textAlign: i === 0 ? 'left' : i < 3 ? 'center' : 'right', padding: '0 0 10px', borderBottom: `1px solid ${BD}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${BD}` }}>
                        <HistorialRow item={h} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CTA sin accesos */}
          {accesos.length === 0 && (
            <div style={{ ...CARD, padding: '24px 26px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: DK, marginBottom: 4 }}>¿Aún no tienes acceso a ninguna oposición?</div>
                <div style={{ fontSize: '0.82rem', color: GL }}>Adquiere un plan para desbloquear simulacros y acceso ilimitado.</div>
              </div>
              <button
                onClick={() => navigate('/planes')}
                style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: O, color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 3px 12px ${O}40` }}
              >
                Ver planes →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
