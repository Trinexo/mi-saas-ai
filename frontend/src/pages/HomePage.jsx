import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { testApi } from '../services/testApi';
import { useAsyncAction } from '../hooks/useAsyncAction';

/* ── Paleta ───────────────────────────────────────────────── */
const O   = '#ea580c';
const OL  = '#fb923c';
const OBG = '#fff7ed';
const DK  = '#111827';
const G   = '#6b7280';
const GL  = '#9ca3af';
const SRF = '#ffffff';
const BD  = '#e5e7eb';

/* ── Card blanca base ────────────────────────────────────── */
const CARD = {
  background:   SRF,
  borderRadius: 16,
  border:       `1px solid ${BD}`,
  boxShadow:    '0 1px 4px rgba(0,0,0,.06)',
};

/* ── Iconos SVG ──────────────────────────────────────────── */
const IconDocument = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconClipboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IconFire = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c-3 3-4 6-1 9 .5-2 2-3 3-4-1 3 1 5 1 7a5 5 0 01-10 0c0-5 3-8 7-12z"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/>
    <path d="M7 4H4v6a5 5 0 0010 0V4h-3"/>
    <path d="M7 4a5 5 0 0010 0"/>
  </svg>
);
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ── Barra de progreso ───────────────────────────────────── */
function ProgressBar({ pct, color = O }) {
  return (
    <div style={{ height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct || 0)}%`, background: color, borderRadius: 999, transition: 'width .5s ease' }} />
    </div>
  );
}

/* ── KPI Card ─────────────────────────────────────────────── */
function KpiCard({ icon, iconBg, iconColor, value, delta, label }) {
  return (
    <div style={{ ...CARD, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: DK, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
        {delta && <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginTop: 2 }}>{delta}</div>}
        <div style={{ fontSize: '0.75rem', color: GL, marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── KPI Bar ──────────────────────────────────────────────── */
function KpiBar() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [racha, setRacha] = useState(null);

  useEffect(() => {
    testApi.userStats(token).then(setStats).catch(() => {});
    testApi.getRacha(token).then(setRacha).catch(() => {});
  }, [token]);

  const total = (stats?.aciertos || 0) + (stats?.errores || 0) + (stats?.blancos || 0);
  const pctAciertos = total > 0 ? Math.round((stats.aciertos / total) * 100) : null;

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <KpiCard icon={<IconDocument />} iconBg={OBG} iconColor={O}
        value={stats?.totalTests ?? '—'}
        delta={stats?.totalTests > 0 ? `+${Math.max(1, Math.round(stats.totalTests * 0.15))} esta semana` : null}
        label="Tests realizados" />
      <KpiCard icon={<IconTarget />} iconBg="#f0fdf4" iconColor="#16a34a"
        value={pctAciertos != null ? `${pctAciertos}%` : '—'}
        delta={pctAciertos != null ? '+6% vs semana pasada' : null}
        label="Aciertos medios" />
      <KpiCard icon={<IconClipboard />} iconBg="#eff6ff" iconColor="#2563eb"
        value={stats?.simulacros ?? '—'} label="Simulacros" />
      <KpiCard icon={<IconFire />} iconBg={OBG} iconColor={O}
        value={racha?.rachaActual != null ? `${racha.rachaActual} días` : '—'}
        delta={racha?.estudioHoy ? '🔥 Racha activa' : null}
        label="Racha actual" />
      <KpiCard icon={<IconTrophy />} iconBg="#fdf4ff" iconColor="#9333ea"
        value="Top 8%" delta="Entre 24.532 opositores" label="Posición global" />
    </div>
  );
}

/* ── Continuar donde lo dejaste ──────────────────────────── */
function ContinuarCard() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const [ultimo, setUltimo] = useState(null);
  const [recom, setRecom]   = useState(null);
  const [hov, setHov]       = useState(false);

  useEffect(() => {
    testApi.history(token, { limit: 1 })
      .then((h) => { if (Array.isArray(h) && h.length) setUltimo(h[0]); })
      .catch(() => {});
    testApi.getRecommended(token).then(setRecom).catch(() => {});
  }, [token]);

  const onContinuar = async () => {
    if (!recom) return;
    let test;
    if (recom.modo === 'refuerzo') {
      const p = { numeroPreguntas: Number(recom.numeroPreguntas || 10) };
      if (recom.temaId) p.temaId = Number(recom.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, p));
    } else {
      const p = { modo: recom.modo || 'adaptativo', numeroPreguntas: Number(recom.numeroPreguntas || 10), dificultad: recom.dificultad || 'mixto' };
      if (recom.temasMix?.length) p.temasMix = recom.temasMix;
      else if (recom.temaId) p.temaId = Number(recom.temaId);
      if (recom.oposicionId) p.oposicionId = Number(recom.oposicionId);
      test = await runAction(() => testApi.generate(token, p));
    }
    if (test) { sessionStorage.setItem('active_test', JSON.stringify(test)); navigate('/test'); }
  };

  const titulo = ultimo?.oposicion_nombre || ultimo?.nombre || recom?.oposicionNombre || 'Test personalizado';
  const pct    = ultimo ? Math.round(((ultimo.respondidas || 0) / (ultimo.total || 1)) * 100) : null;
  const resp   = ultimo?.respondidas || 0;
  const tot    = ultimo?.total || recom?.numeroPreguntas || 10;

  return (
    <div style={{ ...CARD, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: OBG, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: O }}>
          <IconPlay />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Continuar donde lo dejaste</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: DK, marginTop: 1 }}>{titulo}</div>
        </div>
      </div>

      {pct != null && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: G }}>{pct}% completado</span>
            <span style={{ fontSize: '0.8rem', color: GL }}>{resp}/{tot} preguntas</span>
          </div>
          <ProgressBar pct={pct} />
        </div>
      )}

      {recom?.motivo && <div style={{ fontSize: '0.82rem', color: G, lineHeight: 1.5 }}>{recom.motivo}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          disabled={isLoading}
          onClick={onContinuar}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: hov ? '#c2410c' : O, color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
            boxShadow: `0 3px 12px ${O}40`, transition: 'all .15s',
          }}
        >
          <IconPlay />{isLoading ? 'Generando…' : 'Continuar test'}
        </button>
        <Link to="/configurar-test" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
          border: `1.5px solid ${BD}`, color: G, fontWeight: 600, fontSize: '0.88rem', background: SRF,
        }}>
          Nuevo test
        </Link>
      </div>
    </div>
  );
}

/* ── Plan de estudio semanal ──────────────────────────────── */
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MATERIAS_DEMO = ['Derecho Constitucional', 'Derecho Administrativo', 'Unión Europea', 'Gestión Pública', 'Informática', null, null];

function PlanSemanal() {
  const { token } = useAuth();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    testApi.getProgresoSemanal(token).then(setPlan).catch(() => setPlan(null));
  }, [token]);

  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

  const sesiones = (plan?.dias && Array.isArray(plan.dias))
    ? plan.dias
    : DIAS.map((dia, i) => ({ dia, materia: MATERIAS_DEMO[i], completado: i < todayIdx, esHoy: i === todayIdx }));

  const completadas = sesiones.filter((s) => s.completado).length;

  return (
    <div style={{ ...CARD, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Plan de estudio</div>
          <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>{completadas}/7 sesiones esta semana</div>
        </div>
        <Link to="/mis-oposiciones" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none' }}>Ver plan</Link>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {sesiones.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: s.completado ? '#16a34a' : s.esHoy ? O : '#e5e7eb' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sesiones.slice(0, 5).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, background: s.esHoy ? OBG : 'transparent', border: s.esHoy ? `1px solid ${OL}40` : '1px solid transparent' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.completado ? '#f0fdf4' : s.esHoy ? OBG : '#f3f4f6', color: s.completado ? '#16a34a' : s.esHoy ? O : GL, border: `1.5px solid ${s.completado ? '#86efac' : s.esHoy ? OL : BD}` }}>
              {s.completado ? <IconCheck /> : s.esHoy ? <IconPlay /> : null}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: s.esHoy ? 700 : 500, color: s.esHoy ? DK : G, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.dia}</div>
              {s.materia && <div style={{ fontSize: '0.68rem', color: s.completado ? '#16a34a' : GL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.materia}</div>}
            </div>
            {s.completado && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 7px', borderRadius: 20 }}>✓</span>}
            {s.esHoy && !s.completado && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: O, background: OBG, padding: '2px 7px', borderRadius: 20 }}>Hoy</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Recomendados ─────────────────────────────────────────── */
const RECOMENDADOS = [
  { to: '/configurar-test', label: 'Simulacro General',      desc: '100 preguntas · 90 min', meta: 'Ideal para ti',       pct: null, color: O,         bg: OBG        },
  { to: '/configurar-test', label: 'Derecho Administrativo', desc: '56 preguntas',            meta: 'Difícil · 72%',       pct: 72,   color: '#16a34a', bg: '#f0fdf4'  },
  { to: '/configurar-test', label: 'Ley 39/2015',            desc: '40 preguntas',            meta: 'Medio · 67%',         pct: 67,   color: '#2563eb', bg: '#eff6ff'  },
  { to: '/configurar-test', label: 'Constitución Española',  desc: '50 preguntas',            meta: 'Fácil · 81%',         pct: 81,   color: '#9333ea', bg: '#fdf4ff'  },
];

function RecomendadoCard({ to, label, desc, meta, pct, color, bg }) {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
      <div style={{ ...CARD, padding: '18px 16px', transform: hov ? 'translateY(-3px)' : 'none', boxShadow: hov ? `0 8px 24px ${color}20` : CARD.boxShadow, borderColor: hov ? `${color}40` : BD, transition: 'all .18s ease', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconClipboard />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: DK, lineHeight: 1.3, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: '0.72rem', color: GL }}>{desc}</div>
        </div>
        {pct != null && <ProgressBar pct={pct} color={color} />}
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: hov ? color : GL, display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', transition: 'color .15s' }}>
          {meta}{hov && <IconArrow />}
        </div>
      </div>
    </Link>
  );
}

/* ── Historial reciente ───────────────────────────────────── */
function HistorialReciente() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    testApi.history(token, { limit: 4 }).then((h) => setHistory(Array.isArray(h) ? h : [])).catch(() => {});
  }, [token]);

  if (!history.length) return null;

  return (
    <div style={{ ...CARD, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Historial reciente</span>
        <Link to="/historial" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver todos <IconArrow />
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ fontSize: '0.68rem', color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {['Test', 'Preguntas', 'Resultado', 'Fecha'].map((h) => (
              <th key={h} style={{ fontWeight: 600, textAlign: 'left', padding: '0 0 10px', borderBottom: `1px solid ${BD}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => {
            const resp  = h.respondidas || h.total || 0;
            const acie  = h.aciertos || 0;
            const pct   = resp > 0 ? Math.round((acie / resp) * 100) : null;
            const fecha = h.creado_en ? new Date(h.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
            return (
              <tr key={i} style={{ borderTop: `1px solid ${BD}` }}>
                <td style={{ padding: '10px 0', fontSize: '0.82rem', color: DK, fontWeight: 500, maxWidth: 220 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.oposicion_nombre || h.nombre || 'Test personalizado'}</div>
                </td>
                <td style={{ padding: '10px 0', fontSize: '0.82rem', color: G }}>{resp}</td>
                <td style={{ padding: '10px 0' }}>
                  {pct != null && <span style={{ fontSize: '0.78rem', fontWeight: 700, color: pct >= 70 ? '#16a34a' : pct >= 50 ? O : '#dc2626' }}>{pct}%</span>}
                </td>
                <td style={{ padding: '10px 0', fontSize: '0.78rem', color: GL }}>{fecha}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── página principal ────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const nombre = user?.nombre?.split(' ')[0] || 'alumno';
  const hour   = new Date().getHours();
  const saludo = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const fecha  = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Saludo ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: DK, letterSpacing: '-0.03em' }}>
              ¡{saludo}, {nombre}! 👋
            </h1>
            {oposicionActiva && (
              <Link
                to="/mis-oposiciones"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: OBG, color: O, fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, textDecoration: 'none', border: `1px solid ${OL}40`, whiteSpace: 'nowrap' }}
              >
                🎯 {oposicionActiva.nombre}
              </Link>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: GL }}>
            {fecha.charAt(0).toUpperCase() + fecha.slice(1)} — Prepara. Practica. Consigue.
          </p>
        </div>
        <Link to="/configurar-test" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: O, color: '#fff', padding: '11px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', boxShadow: `0 3px 12px ${O}45`, whiteSpace: 'nowrap' }}>
          <IconPlay /> Nuevo test
        </Link>
      </div>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <KpiBar />

      {/* ── Continuar + Plan ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16, alignItems: 'start' }}>
        <ContinuarCard />
        <PlanSemanal />
      </div>

      {/* ── Recomendados ─────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Recomendados para ti</span>
          <Link to="/catalogo" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todos <IconArrow />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {RECOMENDADOS.map((r) => <RecomendadoCard key={r.label} {...r} />)}
        </div>
      </div>

      {/* ── Historial ────────────────────────────────────── */}
      <HistorialReciente />

    </div>
  );
}