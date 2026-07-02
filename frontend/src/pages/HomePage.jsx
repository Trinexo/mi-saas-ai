import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { testApi } from '../services/testApi';
import { albacerApi } from '../services/albacerApi';
import { accesosApi } from '../services/accesosApi';
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
const IconBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
);
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 018 0v4"/>
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
  const isAlbacer = oposicionActiva?.modoPreparacion === 'albacer';

  useEffect(() => {
    testApi
      .userStats(token, oposicionActiva?.id, { modo_preparacion: oposicionActiva?.modoPreparacion ?? 'experto' })
      .then(setStats)
      .catch(() => {});
    testApi
      .getRacha(token, oposicionActiva?.id, { modo_preparacion: oposicionActiva?.modoPreparacion ?? 'experto' })
      .then(setRacha)
      .catch(() => {});
  }, [token, oposicionActiva?.id, oposicionActiva?.modoPreparacion]);

  useEffect(() => {
    if (!oposicionActiva?.id || isAlbacer) { setRanking(null); return; }
    testApi.getRanking(token, oposicionActiva.id).then(setRanking).catch(() => setRanking(null));
  }, [token, oposicionActiva?.id, isAlbacer]);

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
      {!isAlbacer && (
        <KpiCard icon={<IconTrophy />} iconBg="#fdf4ff" iconColor="#9333ea"
          value={rankingValue} delta={rankingDelta} label="Ranking oposición" />
      )}
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
  const isAlbacer = oposicionActiva?.modoPreparacion === 'albacer';
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
    if (isAlbacer) {
      navigate('/');
      return;
    }
    if (s.tipo === 'empezar') {
      navigate('/configurar-test');
      return;
    }

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
        <Link to={isAlbacer ? '/' : '/configurar-test'} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: O, color: '#fff', borderRadius: 10,
          padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
          textDecoration: 'none', boxShadow: `0 3px 12px ${O}40`,
        }}>
          <IconPlay /> {isAlbacer ? 'Ver módulos' : 'Empezar a estudiar'}
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
          <Link to={isAlbacer ? '/' : '/configurar-test'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: O, color: '#fff', borderRadius: 10,
            padding: '10px 22px', fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none', boxShadow: `0 3px 12px ${O}40`,
          }}>
            <IconPlay /> {isAlbacer ? 'Ver módulos' : 'Hacer mi primer test'}
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
              <IconPlay />{isLoading ? 'Generando…' : (isAlbacer ? 'Ver módulos' : meta.btnTxt)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Recomendados para ti (datos reales) ─────────────────── */
function RecomendadoParaTi() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const navigate = useNavigate();
  const isAlbacer = oposicionActiva?.modoPreparacion === 'albacer';
  const [temas, setTemas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generandoId, setGenerandoId] = useState(null);

  useEffect(() => {
    if (!oposicionActiva?.id || isAlbacer) { setCargando(false); return; }
    testApi.getProgresoTemasReal(token, oposicionActiva.id, { modo_preparacion: oposicionActiva?.modoPreparacion ?? 'experto' })
      .then((data) => {
        const conActividad = (data || [])
          .filter((t) => (t.preguntasRespondidas ?? t.totalRespondidas ?? t.intentos ?? 0) > 0)
          .sort((a, b) => a.porcentajeAcierto - b.porcentajeAcierto);
        const sinActividad = (data || [])
          .filter((t) => (t.preguntasRespondidas ?? t.totalRespondidas ?? t.intentos ?? 0) === 0 && t.totalPreguntas > 0);
        setTemas([...conActividad, ...sinActividad].slice(0, 4));
      })
      .catch(() => setTemas([]))
      .finally(() => setCargando(false));
  }, [token, oposicionActiva?.id, oposicionActiva?.modoPreparacion, isAlbacer]);

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

  if (!oposicionActiva?.id || isAlbacer) return null;

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
          const respondidas  = tema.preguntasRespondidas ?? tema.totalRespondidas ?? tema.intentos ?? 0;
          const totalTema    = tema.totalPreguntas ?? 0;
          const pct          = respondidas > 0 ? tema.porcentajeAcierto : null;
          const sinPracticar = respondidas === 0;
          const color        = sinPracticar ? '#2563eb' : pct < 50 ? '#dc2626' : pct < 70 ? O : '#16a34a';
          const bg           = sinPracticar ? '#eff6ff' : pct < 50 ? '#fef2f2' : pct < 70 ? OBG : '#f0fdf4';
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color }}>
                  {sinPracticar ? 'Sin practicar aún' : `Acierto: ${pct}%`}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: GL }}>
                  Progreso: {respondidas} / {totalTema} preguntas
                </div>
              </div>
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
      modo_preparacion: oposicionActiva?.modoPreparacion ?? 'experto',
      ...(oposicionActiva?.id ? { oposicion_id: oposicionActiva.id } : {}),
    }).then((h) => setHistory(Array.isArray(h) ? h : [])).catch(() => {});
  }, [token, oposicionActiva?.id, oposicionActiva?.modoPreparacion]);

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

function AlbacerDashboardMetric({ icon, iconBg, iconColor, label, value, hint, progress }) {
  return (
    <div style={{ ...CARD, padding: 22, display: 'grid', gridTemplateColumns: '54px minmax(0, 1fr)', gap: 16, alignItems: 'center', minHeight: 120 }}>
      <div style={{ width: 54, height: 54, borderRadius: 18, background: iconBg, color: iconColor, display: 'grid', placeItems: 'center' }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#475569', fontSize: '.78rem', fontWeight: 850, marginBottom: 7 }}>{label}</div>
        <div style={{ color: DK, fontSize: '1.45rem', lineHeight: 1, fontWeight: 950 }}>{value}</div>
        {progress != null && (
          <div style={{ marginTop: 14 }}>
            <ProgressBar pct={progress} color={iconColor} />
          </div>
        )}
        {hint && <div style={{ color: iconColor, fontSize: '.75rem', fontWeight: 850, marginTop: 10 }}>{hint}</div>}
      </div>
    </div>
  );
}

function AlbacerRouteNode({ title, subtitle, status, isTest, item, startingId, onStart }) {
  const locked = status === 'locked';
  const done = status === 'done';
  const active = status === 'active';
  const color = done ? '#10b981' : active ? O : '#94a3b8';
  const bg = done ? '#ecfdf5' : active ? OBG : '#fff';
  const canStart = item && !locked;
  const starting = item?.id && startingId === item.id;
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 8, minWidth: 118, position: 'relative' }}>
      <button
        type="button"
        disabled={!canStart || starting}
        onClick={() => canStart && onStart(item)}
        title={canStart ? (isTest ? 'Abrir actividad' : 'Abrir tema') : 'Bloqueado'}
        style={{
          width: active ? 70 : 58,
          height: active ? 70 : 58,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          background: bg,
          color,
          display: 'grid',
          placeItems: 'center',
          boxShadow: active ? `0 0 0 7px ${OBG}` : 'none',
          cursor: canStart ? 'pointer' : 'not-allowed',
          opacity: locked ? .72 : 1,
        }}
      >
        {locked ? <IconLock /> : isTest ? <IconClipboard /> : <IconBook />}
      </button>
      <div style={{ textAlign: 'center', maxWidth: 120 }}>
        <div style={{ color: DK, fontSize: '.8rem', fontWeight: 950, lineHeight: 1.25 }}>{title}</div>
        {subtitle && <div style={{ color: '#64748b', fontSize: '.72rem', marginTop: 4, lineHeight: 1.25 }}>{subtitle}</div>}
        {done && <div style={{ color: '#10b981', fontSize: '.92rem', marginTop: 5, letterSpacing: 1 }}>★ ★ ★</div>}
        {active && <div style={{ color: O, fontSize: '.72rem', fontWeight: 950, marginTop: 6 }}>{starting ? 'Abriendo...' : 'En curso'}</div>}
      </div>
    </div>
  );
}

function AlbacerLearningModule({ modulo, index, startingId, onStart }) {
  const done = modulo.estado_calculado === 'superado';
  const active = modulo.estado_calculado === 'disponible';
  const locked = modulo.estado_calculado === 'bloqueado';
  const [open, setOpen] = useState(done || active);
  const tests = (modulo.items ?? []).filter((item) => item.tipo === 'test');
  const final = (modulo.items ?? []).find((item) => item.tipo === 'simulacro_final') ?? null;
  const activityNodes = [
    ...tests.map((item, idx) => ({
      key: `test-${item.id}`,
      title: item.titulo || `Test ${idx + 1}`,
      subtitle: `${item.total_preguntas ?? 0} preguntas`,
      status: done ? 'done' : active ? 'active' : 'locked',
      item,
      isTest: true,
    })),
    ...(final ? [{
      key: `final-${final.id}`,
      title: final.titulo || 'Simulacro final',
      subtitle: `${final.total_preguntas ?? 0} preguntas`,
      status: done ? 'done' : active ? 'active' : 'locked',
      item: final,
      isTest: true,
    }] : []),
  ];
  const topicNodes = (modulo.temas ?? []).slice(0, 4).map((tema, idx) => ({
    key: `tema-${tema.id ?? idx}`,
    title: `Tema ${idx + 1}`,
    subtitle: tema.nombre,
    status: done ? 'done' : locked ? 'locked' : idx === 0 ? 'active' : 'locked',
  }));
  const nodes = activityNodes.length ? activityNodes : topicNodes;

  useEffect(() => {
    setOpen(done || active);
  }, [done, active, modulo.id]);

  const badge = done
    ? { text: 'Completado', bg: '#dcfce7', color: '#047857', icon: '✓' }
    : active
      ? { text: 'En progreso', bg: OBG, color: O, icon: '◌' }
      : { text: 'Bloqueado', bg: '#f1f5f9', color: '#64748b', icon: '·' };

  return (
    <div style={{ ...CARD, padding: 0, overflow: 'hidden', borderColor: active ? `${OL}55` : BD }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{ border: 'none', background: active ? 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' : '#fff', width: '100%', padding: '22px 24px 14px', display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) auto auto', gap: 16, alignItems: 'center', textAlign: 'left', cursor: 'pointer' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: done ? '#10b981' : active ? O : '#94a3b8', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 950 }}>
          {done ? <IconCheck /> : active ? '•' : <IconLock />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#64748b', fontSize: '.72rem', fontWeight: 950, textTransform: 'uppercase', marginBottom: 5 }}>Módulo {index + 1}</div>
          <div style={{ color: DK, fontSize: '1rem', fontWeight: 950 }}>{modulo.nombre}</div>
          {modulo.descripcion && <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: 6, lineHeight: 1.45 }}>{modulo.descripcion}</div>}
        </div>
        <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: '7px 12px', fontSize: '.72rem', fontWeight: 950, whiteSpace: 'nowrap' }}>
          {badge.icon} {badge.text}
        </span>
        <span style={{ color: '#64748b', fontWeight: 950 }}>{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        nodes.length ? (
          <div className="albacer-route-track" style={{ padding: '18px 24px 26px', display: 'grid', gridTemplateColumns: `repeat(${nodes.length}, minmax(112px, 1fr))`, gap: 18, position: 'relative', alignItems: 'start' }}>
            <div style={{ position: 'absolute', left: 86, right: 86, top: 48, height: 3, background: done ? '#10b981' : active ? `${OL}66` : '#e5e7eb', borderRadius: 999 }} />
            {nodes.map((node) => (
              <AlbacerRouteNode
                key={node.key}
                title={node.title}
                subtitle={node.subtitle}
                status={node.status}
                isTest={node.isTest}
                item={node.item}
                startingId={startingId}
                onStart={onStart}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: '0 24px 24px', color: '#64748b', fontSize: '.82rem', lineHeight: 1.5 }}>
            Este módulo todavía no tiene actividades publicadas.
          </div>
        )
      )}
    </div>
  );
}

function AlbacerOppositionCard({ oposicionActiva, progresoPct, modulosSuperados, totalModulos }) {
  return (
    <div style={{ ...CARD, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 22 }}>
        <div style={{ color: DK, fontWeight: 950 }}>Tu oposición</div>
        <Link to="/mis-oposiciones" style={{ color: O, fontSize: '.8rem', fontWeight: 950, textDecoration: 'none' }}>Cambiar</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', gap: 14, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: OBG, color: O, display: 'grid', placeItems: 'center' }}>
          <IconBook />
        </div>
        <div>
          <div style={{ color: DK, fontWeight: 950, lineHeight: 1.35 }}>{oposicionActiva?.nombre ?? 'Oposición activa'}</div>
          <div style={{ color: O, fontWeight: 900, fontSize: '.78rem', marginTop: 8 }}>Modo Albacer</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: DK, fontWeight: 900, fontSize: '.82rem', marginBottom: 10 }}>
        <span>Progreso del temario</span><span>{progresoPct}%</span>
      </div>
      <ProgressBar pct={progresoPct} color={O} />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 800, fontSize: '.78rem', marginTop: 14 }}>
        <span>Módulos completados</span><span>{modulosSuperados} de {totalModulos}</span>
      </div>
    </div>
  );
}

function AlbacerActivityCard({ history }) {
  const rows = (history ?? []).slice(0, 4);
  return (
    <div style={{ ...CARD, padding: 22 }}>
      <div style={{ color: DK, fontSize: '.95rem', fontWeight: 950, marginBottom: 18 }}>Actividad reciente</div>
      {rows.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '.82rem', lineHeight: 1.5 }}>Todavía no hay actividad reciente en esta oposición.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {rows.map((item, index) => (
            <div key={item.id ?? index} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr)', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: index === 0 ? '#dcfce7' : OBG, color: index === 0 ? '#10b981' : O, display: 'grid', placeItems: 'center', fontWeight: 950 }}>
                {index === 0 ? '✓' : index === 1 ? '✎' : '★'}
              </div>
              <div>
                <div style={{ color: DK, fontSize: '.8rem', fontWeight: 900 }}>{item.nombre || item.oposicion_nombre || 'Actividad completada'}</div>
                <div style={{ color: '#64748b', fontSize: '.74rem', marginTop: 4 }}>{item.creado_en ? new Date(item.creado_en).toLocaleDateString('es-ES') : 'Actividad reciente'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/historial" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: O, fontSize: '.82rem', fontWeight: 950, textDecoration: 'none', marginTop: 20 }}>
        Ver toda la actividad <IconArrow />
      </Link>
    </div>
  );
}

function AlbacerWeeklyCard({ weekly, stats }) {
  const raw = Array.isArray(weekly?.items) ? weekly.items : Array.isArray(weekly) ? weekly : [];
  const points = raw.slice(-7);
  const values = points.map((p) => Number(p.porcentaje ?? p.acierto ?? p.media_aciertos ?? p.pct ?? 0));
  const chartValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const width = 280;
  const height = 150;
  const padding = 18;
  const chartPoints = chartValues.map((value, index) => {
    const x = padding + (index * ((width - padding * 2) / Math.max(1, chartValues.length - 1)));
    const y = height - padding - (Math.max(0, Math.min(100, value)) / 100) * (height - padding * 2);
    return { x, y, value };
  });
  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${chartPoints.at(-1)?.x ?? padding} ${height - padding} L ${chartPoints[0]?.x ?? padding} ${height - padding} Z`;
  const avg = stats?.aciertos || stats?.errores || stats?.blancos
    ? Math.round((Number(stats.aciertos ?? 0) / Math.max(1, Number(stats.aciertos ?? 0) + Number(stats.errores ?? 0) + Number(stats.blancos ?? 0))) * 100)
    : (values.at(-1) || 0);
  return (
    <div style={{ ...CARD, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 18 }}>
        <div style={{ color: DK, fontSize: '.95rem', fontWeight: 950 }}>Rendimiento semanal</div>
        <span style={{ color: '#64748b', fontWeight: 950 }}>ⓘ</span>
      </div>
      <div style={{ position: 'relative', height: 190, padding: '4px 0 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfica de rendimiento semanal" style={{ width: '100%', height: 160, display: 'block', overflow: 'visible' }}>
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = height - padding - (tick / 100) * (height - padding * 2);
            return (
              <g key={tick}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x="0" y={y + 4} fill="#94a3b8" fontSize="9" fontWeight="700">{tick}%</text>
              </g>
            );
          })}
          <path d={areaPath} fill={OBG} opacity=".95" />
          <path d={linePath} fill="none" stroke={O} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {chartPoints.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={index === chartPoints.length - 1 ? 5 : 3.5} fill="#fff" stroke={O} strokeWidth="2.5" />
          ))}
        </svg>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chartValues.length}, 1fr)`, color: '#64748b', fontSize: '.68rem', fontWeight: 900, paddingLeft: 22, paddingRight: 12 }}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].slice(0, chartValues.length).map((day) => <span key={day} style={{ textAlign: 'center' }}>{day}</span>)}
        </div>
        <div style={{ position: 'absolute', top: 8, right: 6, background: O, color: '#fff', borderRadius: 8, padding: '4px 8px', fontSize: '.72rem', fontWeight: 950 }}>
          {avg}%
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${BD}`, marginTop: 16 }}>
        {[
          ['Tests realizados', stats?.totalTests ?? 0],
          ['Media de aciertos', `${avg}%`],
          ['Módulos completados', stats?.modulosSuperados ?? '-'],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${BD}`, color: '#334155', fontSize: '.82rem', fontWeight: 850 }}>
            <span>{label}</span><strong style={{ color: DK }}>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeAlbacer({ nombre, saludo }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { oposicionActiva, setOposicionActiva } = useOposicionActiva();
  const [estado, setEstado] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);
  const [activandoExperto, setActivandoExperto] = useState(false);
  const [stats, setStats] = useState(null);
  const [racha, setRacha] = useState(null);
  const [history, setHistory] = useState([]);
  const [weekly, setWeekly] = useState([]);

  useEffect(() => {
    let alive = true;
    if (!token || !oposicionActiva?.id) return undefined;
    setLoading(true);
    setError('');
    const modeQuery = { modo_preparacion: 'albacer' };
    Promise.all([
      albacerApi.getAlumnoEstado(token, { oposicion_id: oposicionActiva.id }),
      albacerApi.listAlumnoModulos(token, { oposicion_id: oposicionActiva.id }),
      testApi.userStats(token, oposicionActiva.id, modeQuery).catch(() => null),
      testApi.getRacha(token, oposicionActiva.id, modeQuery).catch(() => null),
      testApi.history(token, { limit: 4, oposicion_id: oposicionActiva.id, modo_preparacion: 'albacer' }).catch(() => []),
      testApi.getProgresoSemanal(token, oposicionActiva.id, modeQuery).catch(() => []),
    ])
      .then(([nextEstado, modulosResponse, nextStats, nextRacha, nextHistory, nextWeekly]) => {
        if (!alive) return;
        setEstado(nextEstado);
        setModulos(Array.isArray(modulosResponse?.items) ? modulosResponse.items : []);
        setStats(nextStats);
        setRacha(nextRacha);
        setHistory(Array.isArray(nextHistory) ? nextHistory : []);
        setWeekly(nextWeekly);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'No se pudo cargar tu ruta Albacer.');
        setEstado(null);
        setModulos([]);
        setStats(null);
        setRacha(null);
        setHistory([]);
        setWeekly([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [token, oposicionActiva?.id]);

  const modulosSuperados = estado?.modulos_superados ?? modulos.filter((m) => m.estado_calculado === 'superado').length;
  const totalModulos = estado?.total_modulos ?? modulos.length;
  const progresoPct = totalModulos > 0 ? Math.round((modulosSuperados / totalModulos) * 100) : 0;
  const totalRespuestas = Number(stats?.aciertos ?? 0) + Number(stats?.errores ?? 0) + Number(stats?.blancos ?? 0);
  const aciertoPct = totalRespuestas > 0 ? Math.round((Number(stats?.aciertos ?? 0) / totalRespuestas) * 100) : 0;
  const puntos = Math.round((Number(stats?.notaMedia ?? stats?.nota_media ?? 0) * 100) || (aciertoPct * 10));

  const startItem = async (item) => {
    if (!item?.id || startingId) return;
    setStartingId(item.id);
    setError('');
    try {
      const test = await albacerApi.empezarAlumnoItem(token, item.id);
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar esta actividad.');
    } finally {
      setStartingId(null);
    }
  };

  const activarExperto = async () => {
    if (!oposicionActiva?.id || activandoExperto) return;
    setActivandoExperto(true);
    setError('');
    try {
      await accesosApi.updatePreparacion(token, oposicionActiva.id, { modoPreparacion: 'experto' });
      setOposicionActiva({ ...oposicionActiva, modoPreparacion: 'experto' });
    } catch (err) {
      setError(err.message || 'No se pudo activar el Modo Experto.');
    } finally {
      setActivandoExperto(false);
    }
  };

  return (
    <div className="albacer-home-shell" style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 26, alignItems: 'start' }}>
      <main style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <section style={{ ...CARD, padding: '32px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 30 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', color: DK, fontWeight: 950, letterSpacing: 0 }}>
                ¡{saludo}, {nombre}!
              </h1>
              <p style={{ margin: '10px 0 0', color: '#475569', fontSize: '1rem', fontWeight: 750 }}>
                Sigue tu método paso a paso y alcanza tu plaza.
              </p>
            </div>
            <button
              type="button"
              onClick={activarExperto}
              disabled={activandoExperto}
              style={{ border: `1px solid ${OL}55`, background: '#fff', color: O, borderRadius: 10, padding: '10px 14px', fontWeight: 950, cursor: activandoExperto ? 'wait' : 'pointer' }}
            >
              {activandoExperto ? 'Cambiando...' : 'Modo Experto'}
            </button>
          </div>
          <div className="albacer-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
            <AlbacerDashboardMetric icon={<IconTarget />} iconBg={OBG} iconColor={O} label="Racha de estudio" value={`${racha?.rachaActual ?? 0} días`} hint={racha?.estudioHoy ? '¡Sigue así!' : 'Estudia hoy'} />
            <AlbacerDashboardMetric icon={<IconFire />} iconBg="#dcfce7" iconColor="#10b981" label="Progreso global" value={`${progresoPct}%`} progress={progresoPct} />
            <AlbacerDashboardMetric icon={<IconTrophy />} iconBg="#ffedd5" iconColor={O} label="Puntos" value={puntos.toLocaleString('es-ES')} hint="Ver ranking →" />
          </div>
        </section>

        {error && (
          <div style={{ ...CARD, padding: '12px 16px', color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca', fontSize: '0.82rem', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <section id="albacer-ruta-aprendizaje" style={{ ...CARD, padding: '28px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, color: DK, fontSize: '1.1rem', fontWeight: 950 }}>Tu ruta de aprendizaje <span style={{ color: '#64748b' }}>ⓘ</span></h2>
              <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '.86rem', fontWeight: 650 }}>Sigue el camino módulo a módulo para dominar todos los temas.</p>
            </div>
            <button type="button" style={{ border: `1px solid ${OL}55`, background: '#fff', color: O, borderRadius: 10, padding: '9px 13px', fontWeight: 900 }}>
              ▶ ¿Cómo funciona?
            </button>
          </div>

          {loading ? (
            <div style={{ color: '#64748b', padding: 28, textAlign: 'center', fontWeight: 850 }}>Cargando tu ruta Albacer...</div>
          ) : totalModulos === 0 ? (
            <div style={{ border: `1px dashed ${BD}`, borderRadius: 14, padding: 26 }}>
              <h3 style={{ margin: '0 0 8px', color: DK }}>Aún no hay módulos publicados</h3>
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>Tu profesor todavía no ha publicado el itinerario Albacer para esta oposición.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {modulos.slice(0, 6).map((modulo, index) => (
                <AlbacerLearningModule
                  key={modulo.id}
                  modulo={modulo}
                  index={index}
                  startingId={startingId}
                  onStart={startItem}
                />
              ))}
              {modulos.length > 6 && (
                <button type="button" style={{ justifySelf: 'center', border: `1px solid ${BD}`, background: '#fff', color: O, borderRadius: 10, padding: '12px 22px', fontWeight: 950 }}>
                  Ver todos los módulos ⌄
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <AlbacerOppositionCard oposicionActiva={oposicionActiva} progresoPct={progresoPct} modulosSuperados={modulosSuperados} totalModulos={totalModulos} />
        <AlbacerActivityCard history={history} />
        <AlbacerWeeklyCard weekly={weekly} stats={{ ...(stats ?? {}), modulosSuperados }} />
      </aside>
      <style>{`
        @media (max-width: 1120px) {
          .albacer-home-shell { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .albacer-kpi-row { grid-template-columns: 1fr !important; }
          .albacer-route-track { grid-template-columns: 1fr !important; }
          .albacer-route-track > div:first-child { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ── página principal ────────────────────────────────────── */
export default function HomePage() {
  const { user, token } = useAuth();
  const { oposicionActiva, setOposicionActiva } = useOposicionActiva();
  const [cambiandoAlbacer, setCambiandoAlbacer] = useState(false);
  const [modoError, setModoError] = useState('');
  const nombre = user?.nombre?.split(' ')[0] || 'alumno';
  const hour   = new Date().getHours();
  const saludo = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const fecha  = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const isAlbacer = oposicionActiva?.modoPreparacion === 'albacer';

  const activarAlbacer = async () => {
    if (!oposicionActiva?.id || cambiandoAlbacer) return;
    setCambiandoAlbacer(true);
    setModoError('');
    try {
      await accesosApi.updatePreparacion(token, oposicionActiva.id, { modoPreparacion: 'albacer' });
      setOposicionActiva({ ...oposicionActiva, modoPreparacion: 'albacer' });
    } catch (err) {
      setModoError(err.message || 'No se pudo cambiar a Modo Albacer.');
    } finally {
      setCambiandoAlbacer(false);
    }
  };

  if (isAlbacer) {
    return <HomeAlbacer nombre={nombre} saludo={saludo} />;
  }

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
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {oposicionActiva?.id && (
            <button
              type="button"
              onClick={activarAlbacer}
              disabled={cambiandoAlbacer}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${OL}55`, background: '#fff', color: O, padding: '11px 18px', borderRadius: 10, fontWeight: 800, fontSize: '0.86rem', cursor: cambiandoAlbacer ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {cambiandoAlbacer ? 'Cambiando...' : 'Cambiar a Modo Albacer'}
            </button>
          )}
          <Link to="/configurar-test" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: O, color: '#fff', padding: '11px 22px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', boxShadow: `0 3px 12px ${O}45`, whiteSpace: 'nowrap' }}>
            <IconPlay /> Nuevo test
          </Link>
        </div>
      </div>

      {modoError && (
        <div style={{ ...CARD, padding: '12px 16px', color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca', fontSize: '0.82rem', fontWeight: 700 }}>
          {modoError}
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────── */}
      <KpiBar />

      {/* ── Continuar ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        <ContinuarCard />
      </div>

      {/* ── Recomendados ─────────────────────────────────── */}
      <RecomendadoParaTi />

      {/* ── Historial ────────────────────────────────────── */}
      <HistorialReciente />

    </div>
  );
}
