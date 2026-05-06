import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { catalogApi } from '../services/catalogApi';
import { testApi } from '../services/testApi';

/* ── Paleta ─────────────────────────────────────────── */
const O    = '#ea580c';
const OBG  = '#fff7ed';
const OL   = '#fb923c';
const BD   = '#e5e7eb';
const DK   = '#111827';
const G    = '#374151';
const GL   = '#6b7280';
const BL   = '#2563eb';
const BLBG = '#eff6ff';

const CARD = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};

/* ── Spinner ──────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', gap: 12 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `4px solid ${OBG}`, borderTopColor: O, animation: 'spin .8s linear infinite' }} />
      <span style={{ fontSize: '0.82rem', color: GL }}>Cargando…</span>
    </div>
  );
}

/* ── Badge de modo ────────────────────────────────── */
function Badge({ text, bg, color }) {
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: bg, color, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

/* ── Card oposición ───────────────────────────────── */
function OposicionCard({ op, tieneAcceso, onIniciar, loading }) {
  const [hov, setHov] = useState(false);
  const mins = op.tiempo_limite_minutos;
  const preguntas = 100; // estándar de simulacro

  return (
    <div
      style={{
        ...CARD,
        padding: '22px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 24px rgba(0,0,0,.10)' : CARD.boxShadow,
        transition: 'all .18s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: tieneAcceso ? OBG : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
          🎯
        </div>
        {tieneAcceso
          ? <Badge text="Acceso activo" bg="#f0fdf4" color="#16a34a" />
          : <Badge text="Sin acceso" bg="#f3f4f6" color={GL} />}
      </div>

      {/* Nombre */}
      <div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: DK, lineHeight: 1.35 }}>{op.nombre}</div>
        {op.descripcion && (
          <div style={{ fontSize: '0.75rem', color: GL, marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {op.descripcion}
          </div>
        )}
      </div>

      {/* Metadatos */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: G }}>
          <span>📝</span>
          <span><strong style={{ color: DK }}>{preguntas}</strong> preguntas</span>
        </div>
        {mins && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: G }}>
            <span>⏱</span>
            <span><strong style={{ color: DK }}>{mins}</strong> min</span>
          </div>
        )}
      </div>

      {/* Botón */}
      <button
        onClick={() => onIniciar(op)}
        disabled={!tieneAcceso || loading}
        style={{
          marginTop: 'auto',
          padding: '10px 0', borderRadius: 10, border: 'none',
          background: tieneAcceso ? (hov ? '#c2410c' : O) : '#e5e7eb',
          color: tieneAcceso ? '#fff' : GL,
          fontWeight: 700, fontSize: '0.88rem',
          cursor: tieneAcceso && !loading ? 'pointer' : 'not-allowed',
          transition: 'background .15s',
          boxShadow: tieneAcceso ? `0 3px 10px ${O}30` : 'none',
        }}
      >
        {loading ? 'Generando…' : tieneAcceso ? 'Iniciar simulacro' : 'Requiere acceso'}
      </button>
    </div>
  );
}

/* ── Fila historial ───────────────────────────────── */
function HistorialRow({ item }) {
  const pct = item.total > 0 ? Math.round(((item.aciertos || 0) / item.total) * 100) : null;
  const fecha = item.creado_en
    ? new Date(item.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';
  const color = pct == null ? GL : pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <tr>
      <td style={{ padding: '10px 0', fontSize: '0.82rem', color: G }}>{item.oposicion_nombre || item.nombre || 'Simulacro'}</td>
      <td style={{ padding: '10px 0', fontSize: '0.82rem', color: GL, textAlign: 'center' }}>{item.total}</td>
      <td style={{ padding: '10px 0', fontWeight: 700, fontSize: '0.85rem', color, textAlign: 'center' }}>
        {pct != null ? `${pct}%` : '—'}
      </td>
      <td style={{ padding: '10px 0', fontSize: '0.78rem', color: GL, textAlign: 'right' }}>{fecha}</td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════
   SimulacrosPage
   ══════════════════════════════════════════════════ */
export default function SimulacrosPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { accesos, loading: loadingAccesos, tieneAcceso } = useUserAccesos();
  const { oposicionActiva } = useOposicionActiva();
  const { isLoading, runAction } = useAsyncAction();

  const [oposiciones, setOposiciones] = useState([]);
  const [historial,   setHistorial  ] = useState([]);
  const [loadingData, setLoadingData ] = useState(true);
  const [activeOp,    setActiveOp   ] = useState(null);

  useEffect(() => {
    Promise.all([
      catalogApi.getOposiciones().catch(() => []),
      testApi.history(token, { limit: 6, modo: 'simulacro' }).catch(() => []),
    ]).then(([ops, hist]) => {
      let lista = Array.isArray(ops) ? ops : (ops?.data ?? []);
      // Filtrar por oposición activa si hay una seleccionada
      if (oposicionActiva?.id) {
        lista = lista.filter((op) => Number(op.id) === Number(oposicionActiva.id));
      }
      setOposiciones(lista);
      setHistorial(Array.isArray(hist) ? hist.filter((h) => h.tipo_test === 'simulacro' || h.modo === 'simulacro') : []);
    }).finally(() => setLoadingData(false));
  }, [token, oposicionActiva]);

  const onIniciar = async (op) => {
    setActiveOp(op.id);
    const payload = {
      oposicionId: Number(op.id),
      numeroPreguntas: 100,
      modo: 'simulacro',
    };
    if (op.tiempo_limite_minutos) {
      payload.duracionSegundos = op.tiempo_limite_minutos * 60;
    }
    const test = await runAction(() => testApi.generate(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
    setActiveOp(null);
  };

  const loading = loadingData || loadingAccesos;

  /* ─── Render ─────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: DK, letterSpacing: '-0.02em' }}>Simulacros</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: GL }}>
            Exámenes completos en condiciones reales de tiempo y pregunta.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, background: BLBG, color: BL, padding: '4px 12px', borderRadius: 20 }}>
            🎯 Modo simulacro
          </span>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ ...CARD, padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14, background: OBG, border: `1px solid ${OL}40` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>ℹ️</div>
        <div style={{ fontSize: '0.82rem', color: G, lineHeight: 1.6 }}>
          <strong style={{ color: DK }}>Sin feedback inmediato.</strong> Las respuestas correctas se muestran solo al finalizar, replicando las condiciones reales del examen.
          El tiempo se descuenta automáticamente y el test se envía al expirar.
        </div>
      </div>

      {/* Grid de oposiciones */}
      {loading ? (
        <Spinner />
      ) : oposiciones.length === 0 ? (
        <div style={{ ...CARD, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📚</div>
          <p style={{ margin: 0, fontWeight: 600, color: DK }}>No hay oposiciones en el catálogo todavía</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            {oposiciones.length} oposición{oposiciones.length !== 1 ? 'es' : ''} disponible{oposiciones.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 36 }}>
            {oposiciones.map((op) => (
              <OposicionCard
                key={op.id}
                op={op}
                tieneAcceso={tieneAcceso(op.id)}
                onIniciar={onIniciar}
                loading={isLoading && activeOp === op.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Sin accesos: CTA */}
      {!loading && accesos.length === 0 && (
        <div style={{ ...CARD, padding: '24px 26px', marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, color: DK, marginBottom: 4 }}>¿Aún no tienes acceso a ninguna oposición?</div>
            <div style={{ fontSize: '0.82rem', color: GL }}>Adquiere un plan para desbloquear simulacros completos y acceso ilimitado.</div>
          </div>
          <button
            onClick={() => navigate('/planes')}
            style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: O, color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: `0 3px 12px ${O}40` }}
          >
            Ver planes →
          </button>
        </div>
      )}

      {/* Historial de simulacros */}
      {historial.length > 0 && (
        <div style={{ ...CARD, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: DK }}>Historial de simulacros</span>
            <span
              onClick={() => navigate('/historial')}
              style={{ fontSize: '0.75rem', color: O, fontWeight: 700, cursor: 'pointer' }}
            >Ver todos →</span>
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
  );
}
