import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { testApi } from '../services/testApi';
import { planEstudioApi } from '../services/planEstudioApi';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useBreakpoint } from '../hooks/useBreakpoint';

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
    <div className="kpi-card" style={{ ...CARD, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div className="kpi-icon" style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-value" style={{ fontSize: '1.65rem', fontWeight: 800, color: DK, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
        {delta && <div className="kpi-delta" style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600, marginTop: 2 }}>{delta}</div>}
        <div className="kpi-label" style={{ fontSize: '0.75rem', color: GL, marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── KPI Bar ──────────────────────────────────────────────── */
function KpiBar() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const [stats, setStats] = useState(null);
  const [racha, setRacha] = useState(null);
  const [ranking, setRanking] = useState(null);

  useEffect(() => {
    testApi.userStats(token, oposicionActiva?.id).then(setStats).catch(() => {});
    testApi.getRacha(token, oposicionActiva?.id).then(setRacha).catch(() => {});
  }, [token, oposicionActiva?.id]);

  useEffect(() => {
    if (!oposicionActiva?.id) { setRanking(null); return; }
    testApi.getRanking(token, oposicionActiva.id).then(setRanking).catch(() => setRanking(null));
  }, [token, oposicionActiva?.id]);

  const total = (stats?.aciertos || 0) + (stats?.errores || 0) + (stats?.blancos || 0);
  const pctAciertos = total > 0 ? Math.round((stats.aciertos / total) * 100) : null;

  const rankingValue = ranking?.miPosicion != null && ranking?.totalParticipantes > 0
    ? `#${ranking.miPosicion}/${ranking.totalParticipantes}`
    : '—';
  const rankingDelta = ranking?.totalParticipantes > 0 ? 'Ranking de esta oposición' : null;

  return (
    <div className="kpi-grid">
      <KpiCard icon={<IconDocument />} iconBg={OBG} iconColor={O}
        value={stats?.totalTests ?? '—'}
        delta={stats?.totalTests > 0 ? `+${Math.max(1, Math.round(stats.totalTests * 0.15))} esta semana` : null}
        label="Tests realizados" />
      <KpiCard icon={<IconTarget />} iconBg="#f0fdf4" iconColor="#16a34a"
        value={pctAciertos != null ? `${pctAciertos}%` : '—'}
        delta={null}
        label="Aciertos medios" />
      <KpiCard icon={<IconClipboard />} iconBg="#eff6ff" iconColor="#2563eb"
        value={stats?.simulacros ?? '—'} label="Simulacros" />
      <KpiCard icon={<IconFire />} iconBg={OBG} iconColor={O}
        value={racha?.rachaActual != null ? `${racha.rachaActual} días` : '—'}
        delta={racha?.estudioHoy ? '🔥 Racha activa' : null}
        label="Racha actual" />
      <KpiCard icon={<IconTrophy />} iconBg="#fdf4ff" iconColor="#9333ea"
        value={rankingValue} delta={rankingDelta} label="Ranking oposición" />
    </div>
  );
}

/* ── Continuar donde lo dejaste ──────────────────────────── */
const TIPO_META = {
  retomar:   { etiqueta: '🔄 Pendiente',  labelCard: 'Retomar test incompleto', btnTxt: 'Continuar test'  },
  mejorar:   { etiqueta: null,             labelCard: 'Tema a mejorar',          btnTxt: 'Practicar ahora' },
  siguiente: { etiqueta: '✨ Sin iniciar', labelCard: 'Siguiente en el plan',    btnTxt: 'Empezar tema'    },
  repaso:    { etiqueta: '⭐ Al 90%+',     labelCard: '¡Gran nivel!',            btnTxt: 'Hacer repaso'    },
  empezar:   { etiqueta: null,             labelCard: 'Empieza a estudiar',      btnTxt: null              },
};

function ContinuarCard() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const { isLoading, runAction } = useAsyncAction();
  const [sugerencia, setSugerencia] = useState(undefined); // undefined=cargando
  const [hov, setHov] = useState(false);

  useEffect(() => {
    setSugerencia(undefined);
    testApi.getContinuar(token, oposicionActiva?.id).then(setSugerencia).catch(() => setSugerencia(null));
  }, [token, oposicionActiva?.id]);

  const onAccion = async () => {
    const s = sugerencia;
    if (!s) return;

    if (s.tipo === 'retomar') {
      const activeTest = {
        testId: s.config.id,
        temaId: s.config.temaId,
        oposicionId: s.config.oposicionId,
        temaNombre: s.subtitulo || null,
        oposicionNombre: s.titulo || null,
        modo: s.config.tipoTest,
        dificultad: 'mixto',
        numeroPreguntas: s.config.numeroPreguntas,
        duracionSegundos: null,
        feedbackInmediato: false,
        preguntas: s.config.preguntas,
      };
      sessionStorage.setItem('active_test', JSON.stringify(activeTest));
      navigate('/test');
      return;
    }
    if (s.tipo === 'empezar') { navigate('/configurar-test'); return; }

    const params = { modo: 'normal', numeroPreguntas: 10, dificultad: 'mixto' };
    if (s.temaId) params.temaId = s.temaId;
    else if (s.oposicionId) params.oposicionId = s.oposicionId;

    const test = await runAction(() => testApi.generate(token, params));
    if (test) { sessionStorage.setItem('active_test', JSON.stringify(test)); navigate('/test'); }
  };

  /* ── Loading ──────────────────────────────────────────── */
  if (sugerencia === undefined) {
    return (
      <div style={{ ...CARD, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 14, minHeight: 120 }}>
        <div style={{ width: 36, height: 36, background: '#f3f4f6', borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: 120, background: '#f3f4f6', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ height: 10, width: 200, background: '#f9fafb', borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────── */
  if (!sugerencia) {
    return (
      <div style={{ ...CARD, padding: '24px 26px' }}>
        <Link to="/configurar-test" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: O, color: '#fff', borderRadius: 10,
          padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
          textDecoration: 'none', boxShadow: `0 3px 12px ${O}40`,
        }}>
          <IconPlay /> Empezar a estudiar
        </Link>
      </div>
    );
  }

  const { tipo, titulo, motivo, pctAciertos } = sugerencia;
  const meta  = TIPO_META[tipo] || TIPO_META.siguiente;
  const badge = tipo === 'mejorar' ? `${pctAciertos}% aciertos` : meta.etiqueta;

  return (
    <div style={{ ...CARD, padding: 'clamp(14px, 4vw, 24px) clamp(14px, 4vw, 26px)', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'hidden' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, background: OBG, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: O, flexShrink: 0 }}>
          <IconPlay />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {meta.labelCard}
            </span>
            {badge && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700,
                background: tipo === 'mejorar' ? '#fef2f2' : OBG,
                color:      tipo === 'mejorar' ? '#dc2626' : O,
                borderRadius: 8, padding: '1px 8px',
              }}>
                {badge}
              </span>
            )}
          </div>
          <div style={{
            fontSize: '0.92rem', fontWeight: 700, color: DK, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {tipo === 'empezar' ? 'Aún no has hecho ningún test' : titulo}
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div style={{ fontSize: '0.82rem', color: G, lineHeight: 1.5 }}>{motivo}</div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tipo === 'empezar' ? (
          <Link to="/configurar-test" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: O, color: '#fff', borderRadius: 10,
            padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none', boxShadow: `0 3px 12px ${O}40`,
          }}>
            <IconPlay /> Hacer mi primer test
          </Link>
        ) : (
          <>
            <button
              disabled={isLoading}
              onClick={onAccion}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: hov ? '#c2410c' : O, color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                boxShadow: `0 3px 12px ${O}40`, transition: 'background .15s',
              }}
            >
              <IconPlay />{isLoading ? 'Generando…' : meta.btnTxt}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Plan de estudio semanal ──────────────────────────────── */
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function PlanSemanal() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { oposicionActiva } = useOposicionActiva();
  const [plan, setPlan] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [startingId, setStartingId] = useState(null);
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    testApi.getProgresoSemanal(token, oposicionActiva?.id).then(setPlan).catch(() => setPlan(null));
  }, [token, oposicionActiva?.id]);

  useEffect(() => {
    if (!token || !oposicionActiva?.id) {
      setActividades([]);
      return;
    }
    planEstudioApi.list(token, oposicionActiva.id)
      .then((res) => setActividades(Array.isArray(res?.items) ? res.items.slice(0, 4) : []))
      .catch(() => setActividades([]));
  }, [token, oposicionActiva?.id]);

  const handleEmpezarPlan = async (item) => {
    if (!item?.id || startingId) return;
    setStartingId(item.id);
    setPlanError('');
    try {
      const test = await planEstudioApi.empezar(token, item.id);
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    } catch (error) {
      setPlanError(error.message || 'No se pudo iniciar esta actividad.');
    } finally {
      setStartingId(null);
    }
  };

  if (actividades.length > 0) {
    return (
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Plan de estudio</div>
            <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>Recomendado por tu profesor</div>
          </div>
          <Link to="/plan-estudio" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none' }}>Ver todo</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actividades.map((item) => {
            const date = item.fecha_inicio
              ? new Date(item.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
              : 'Próximo';
            const estado = item.estado_alumno || 'proximo';
            const enabled = estado === 'disponible';
            const completado = estado === 'completado';
            const loading = startingId === item.id;
            const nota = item.mi_mejor_nota != null ? Number(item.mi_mejor_nota) : null;
            const estadoLabel = enabled
              ? 'Disponible'
              : completado
                ? (nota != null ? `${nota.toFixed(1)} pts` : 'Completado')
                : estado === 'cerrado'
                  ? 'Cerrado'
                  : 'Próximo';
            return (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '9px 10px', borderRadius: 10, border: `1px solid ${BD}`, background: enabled ? OBG : '#fff' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: DK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titulo}</div>
                  <div style={{ fontSize: '0.68rem', color: GL, marginTop: 2 }}>
                    {date} · {completado ? 'Completado' : estadoLabel}
                  </div>
                </div>
                {enabled ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleEmpezarPlan(item)}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#fff',
                      background: O,
                      borderRadius: 8,
                      padding: '6px 9px',
                      border: 'none',
                      cursor: loading ? 'wait' : 'pointer',
                      opacity: loading ? 0.75 : 1,
                    }}
                  >
                    {loading ? 'Abriendo...' : 'Empezar'}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: completado ? '#15803d' : O, background: completado ? '#dcfce7' : OBG, padding: '4px 8px', borderRadius: 20 }}>
                    {estadoLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {planError && <div style={{ color: '#dc2626', fontSize: '0.72rem', marginTop: 10 }}>{planError}</div>}
      </div>
    );
  }

  if (!plan?.dias || !Array.isArray(plan.dias) || plan.dias.length === 0) {
    return (
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Plan de estudio</div>
            <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>Aún no hay actividades programadas</div>
          </div>
          <Link to="/plan-estudio" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none' }}>Ver plan</Link>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {DIAS.map((dia) => (
            <div key={dia} style={{ flex: 1, height: 4, borderRadius: 999, background: '#e5e7eb' }} />
          ))}
        </div>
        <div style={{ padding: '14px 10px', borderRadius: 10, border: `1px dashed ${BD}`, background: '#fff', color: GL, fontSize: '0.78rem', lineHeight: 1.45 }}>
          Tu profesor podrá publicar aquí simulacros, tests recomendados o temas para repasar.
        </div>
      </div>
    );
  }

  const sesiones = plan.dias;

  const completadas = sesiones.filter((s) => s.completado).length;

  return (
    <div style={{ ...CARD, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Plan de estudio</div>
          <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>{completadas}/7 sesiones esta semana</div>
        </div>
        <Link to="/plan-estudio" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none' }}>Ver plan</Link>
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

/* ── Recomendados para ti (datos reales) ─────────────────── */
function RecomendadoParaTi() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();
  const [temas, setTemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generandoId, setGenerandoId] = useState(null);

  useEffect(() => {
    if (!oposicionActiva?.id) { setCargando(false); return; }
    testApi.getProgresoTemasReal(token, oposicionActiva.id)
      .then((data) => {
        const conActividad = (data || [])
          .filter((t) => t.intentos > 0)
          .sort((a, b) => a.porcentajeAcierto - b.porcentajeAcierto);
        const sinActividad = (data || [])
          .filter((t) => t.intentos === 0 && t.totalPreguntas > 0);
        setTemas([...conActividad, ...sinActividad].slice(0, 4));
      })
      .catch(() => setTemas([]))
      .finally(() => setCargando(false));
  }, [token, oposicionActiva?.id]);

  const onPracticar = async (tema) => {
    if (generandoId) return;
    setGenerandoId(tema.temaId);
    try {
      const test = await testApi.generate(token, {
        modo: 'normal',
        numeroPreguntas: 10,
        dificultad: 'mixto',
        temaId: tema.temaId,
        ...(oposicionActiva?.id ? { oposicionId: oposicionActiva.id } : {}),
      });
      if (test) { sessionStorage.setItem('active_test', JSON.stringify(test)); navigate('/test'); }
    } catch { /* silencioso */ } finally {
      setGenerandoId(null);
    }
  };

  if (!oposicionActiva?.id) return null;

  if (cargando) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Recomendados para ti</span>
        </div>
        <div className="temas-carousel">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="tema-card" style={{ ...CARD, padding: '18px 16px', height: 150, background: '#f9fafb', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!temas.length) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Recomendados para ti</span>
          <Link to="/mis-oposiciones" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver temario <IconArrow />
          </Link>
        </div>
        <div style={{ ...CARD, padding: '20px 24px', color: GL, fontSize: '0.82rem', lineHeight: 1.6 }}>
          Empieza a hacer tests para ver aquí tus temas más débiles y recibir recomendaciones personalizadas.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Recomendados para ti</span>
          <span style={{ fontSize: '0.72rem', color: GL, marginLeft: 8 }}>temas que necesitan refuerzo</span>
        </div>
        <Link to="/progreso" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver estadísticas <IconArrow />
        </Link>
      </div>
      <div className="temas-carousel">
        {temas.map((tema) => {
          const pct          = tema.intentos > 0 ? tema.porcentajeAcierto : null;
          const sinPracticar = tema.intentos === 0;
          const color        = sinPracticar ? '#2563eb' : pct < 50 ? '#dc2626' : pct < 70 ? O : '#16a34a';
          const bg           = sinPracticar ? '#eff6ff' : pct < 50 ? '#fef2f2' : pct < 70 ? OBG : '#f0fdf4';
          const meta         = sinPracticar
            ? 'Sin practicar aún'
            : `${pct}% aciertos · ${tema.intentos} intentos`;
          const isGen        = generandoId === tema.temaId;
          return (
            <div key={tema.temaId} className="tema-card" style={{ ...CARD, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconClipboard />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: DK, lineHeight: 1.3, marginBottom: 3 }}>{tema.temaNombre}</div>
                <div style={{ fontSize: '0.72rem', color: GL }}>{tema.totalPreguntas} preguntas disponibles</div>
              </div>
              {pct != null && <ProgressBar pct={pct} color={color} />}
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color }}>{meta}</div>
              <button
                disabled={!!generandoId}
                onClick={() => onPracticar(tema)}
                style={{
                  padding: '7px 0', borderRadius: 8, border: `1.5px solid ${color}30`,
                  background: isGen ? '#f3f4f6' : bg, color: isGen ? GL : color,
                  fontWeight: 700, fontSize: '0.78rem',
                  cursor: generandoId ? 'not-allowed' : 'pointer',
                  transition: 'all .15s',
                }}
              >
                {isGen ? 'Generando…' : sinPracticar ? 'Empezar' : 'Practicar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Historial reciente ───────────────────────────────────── */
function HistorialReciente() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    testApi.history(token, {
      limit: 4,
      ...(oposicionActiva?.id ? { oposicion_id: oposicionActiva.id } : {}),
    }).then((h) => setHistory(Array.isArray(h) ? h : [])).catch(() => {});
  }, [token, oposicionActiva?.id]);

  if (!history.length) return null;

  return (
    <div style={{ ...CARD, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: DK }}>Historial reciente</span>
        <Link to="/historial" style={{ fontSize: '0.75rem', color: O, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver todos <IconArrow />
        </Link>
      </div>
      <div className="table-responsive">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ fontSize: '0.68rem', color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {['Test', 'Preguntas', 'Resultado'].map((h) => (
              <th key={h} style={{ fontWeight: 600, textAlign: 'left', padding: '0 0 10px', borderBottom: `1px solid ${BD}` }}>{h}</th>
            ))}
            <th className="col-hide-mobile" style={{ fontWeight: 600, textAlign: 'left', padding: '0 0 10px', borderBottom: `1px solid ${BD}` }}>Fecha</th>
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
                <td className="col-hide-mobile" style={{ padding: '10px 0', fontSize: '0.78rem', color: GL }}>{fecha}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/* ── página principal ────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const { isMobile, isTablet } = useBreakpoint();
  const nombre = user?.nombre?.split(' ')[0] || 'alumno';
  const hour   = new Date().getHours();
  const saludo = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const fecha  = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Saludo ───────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 800, color: DK, letterSpacing: '-0.03em' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 310px', gap: 16, alignItems: 'start' }}>
        <ContinuarCard />
        {!isMobile && !isTablet && <PlanSemanal />}
      </div>

      {/* ── Recomendados ─────────────────────────────────── */}
      <RecomendadoParaTi />

      {/* ── Historial ────────────────────────────────────── */}
      <HistorialReciente />

    </div>
  );
}
