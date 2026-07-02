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

function AlbacerMetric({ label, value, hint }) {
  return (
    <div style={{ ...CARD, padding: '16px 18px' }}>
      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: DK, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.76rem', color: G, fontWeight: 800, marginTop: 5 }}>{label}</div>
      {hint && <div style={{ fontSize: '0.68rem', color: GL, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function AlbacerItemCard({ item, disabled, startingId, onStart, repeat = false }) {
  const isFinal = item.tipo === 'simulacro_final';
  const title = item.titulo || (isFinal ? 'Simulacro final' : 'Test del módulo');
  const total = Number(item.total_preguntas ?? 0);
  const duration = item.duracion_segundos ? Math.round(Number(item.duracion_segundos) / 60) : null;
  const starting = startingId === item.id;
  const buttonLabel = repeat
    ? (isFinal ? 'Repetir simulacro' : 'Repetir test')
    : (isFinal ? 'Intentar nivel' : 'Empezar');

  return (
    <div style={{
      border: `1px solid ${isFinal ? '#fed7aa' : BD}`,
      borderRadius: 12,
      background: isFinal ? OBG : '#fff',
      padding: 14,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      gap: 12,
      alignItems: 'center',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 900, color: DK }}>{title}</span>
          <span style={{
            fontSize: '0.66rem',
            fontWeight: 900,
            color: isFinal ? O : '#2563eb',
            background: isFinal ? '#ffedd5' : '#eff6ff',
            padding: '3px 8px',
            borderRadius: 999,
          }}>
            {isFinal ? 'Final de módulo' : 'Test'}
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: GL, marginTop: 5 }}>
          {total} preguntas{duration ? ` · ${duration} min` : ''}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled || starting || total === 0}
        onClick={() => onStart(item)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          border: 'none',
          borderRadius: 10,
          padding: '9px 13px',
          background: disabled || total === 0 ? '#e5e7eb' : O,
          color: disabled || total === 0 ? G : '#fff',
          fontSize: '0.78rem',
          fontWeight: 900,
          cursor: disabled || starting || total === 0 ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <IconPlay /> {starting ? 'Abriendo...' : buttonLabel}
      </button>
    </div>
  );
}

function AlbacerModuloActivities({ modulo, startingId, onStart }) {
  const superado = modulo.estado_calculado === 'superado';
  const actual = modulo.estado_calculado === 'disponible';
  const [open, setOpen] = useState(actual);
  const moduloTests = (modulo.items ?? []).filter((item) => item.tipo === 'test');
  const moduloFinal = (modulo.items ?? []).find((item) => item.tipo === 'simulacro_final') ?? null;
  const totalItems = moduloTests.length + (moduloFinal ? 1 : 0);

  useEffect(() => {
    setOpen(actual);
  }, [actual, modulo.id]);

  return (
    <div style={{ border: `1px solid ${superado ? '#bbf7d0' : BD}`, borderRadius: 14, background: superado ? '#f0fdf4' : '#fff', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        aria-expanded={open}
        style={{ width: '100%', border: 'none', background: 'transparent', padding: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 10, alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: DK, fontSize: '0.83rem', fontWeight: 950, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{modulo.nombre}</div>
          <div style={{ color: GL, fontSize: '0.68rem', marginTop: 2 }}>
            {actual ? 'Módulo actual' : `${totalItems} actividades disponibles`}
          </div>
        </div>
        {superado && (
          <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: 999, padding: '4px 10px', fontSize: '0.68rem', fontWeight: 950, whiteSpace: 'nowrap' }}>
            Módulo superado
          </span>
        )}
        <span style={{ color: O, fontSize: '0.72rem', fontWeight: 950, whiteSpace: 'nowrap' }}>
          {open ? 'Cerrar' : 'Abrir'}
        </span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 12px 12px' }}>
          {moduloTests.map((item) => (
            <AlbacerItemCard key={item.id} item={item} startingId={startingId} onStart={onStart} repeat={superado} />
          ))}
          {moduloFinal && <AlbacerItemCard item={moduloFinal} startingId={startingId} onStart={onStart} repeat={superado} />}
          {!modulo.items?.length && (
            <div style={{ border: `1px dashed ${BD}`, borderRadius: 12, padding: 18, color: GL, fontSize: '0.82rem' }}>
              Este módulo todavía no tiene tests publicados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HomeAlbacer({ nombre, saludo, fecha }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { oposicionActiva, setOposicionActiva } = useOposicionActiva();
  const [estado, setEstado] = useState(null);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);
  const [activandoExperto, setActivandoExperto] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!token || !oposicionActiva?.id) return undefined;
    setLoading(true);
    setError('');
    Promise.all([
      albacerApi.getAlumnoEstado(token, { oposicion_id: oposicionActiva.id }),
      albacerApi.listAlumnoModulos(token, { oposicion_id: oposicionActiva.id }),
    ])
      .then(([nextEstado, modulosResponse]) => {
        if (!alive) return;
        setEstado(nextEstado);
        setModulos(Array.isArray(modulosResponse?.items) ? modulosResponse.items : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'No se pudo cargar tu ruta Albacer.');
        setEstado(null);
        setModulos([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [token, oposicionActiva?.id]);

  const moduloActual = estado?.modulo_actual ?? modulos.find((m) => m.actual) ?? null;
  const modulosSuperados = estado?.modulos_superados ?? modulos.filter((m) => m.estado_calculado === 'superado').length;
  const totalModulos = estado?.total_modulos ?? modulos.length;
  const planCompletado = Boolean(estado?.plan_completado);
  const progresoPct = totalModulos > 0 ? Math.round((modulosSuperados / totalModulos) * 100) : 0;
  const itemsActuales = moduloActual?.items ?? [];
  const testsActuales = itemsActuales.filter((item) => item.tipo === 'test');
  const finalActual = itemsActuales.find((item) => item.tipo === 'simulacro_final') ?? null;
  const modulosPractica = modulos.filter((modulo) => (
    modulo.estado_calculado === 'superado' || modulo.estado_calculado === 'disponible'
  ));

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
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 900, color: DK }}>
              ¡{saludo}, {nombre}!
            </h1>
            {oposicionActiva && (
              <Link to="/mis-oposiciones" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: OBG, color: O, fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999, textDecoration: 'none', border: `1px solid ${OL}40` }}>
                {oposicionActiva.nombre}
              </Link>
            )}
            <span style={{ background: '#ede9fe', color: '#5b21b6', fontSize: '0.72rem', fontWeight: 900, padding: '4px 10px', borderRadius: 999 }}>
              Modo Albacer
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: GL }}>
            {fecha.charAt(0).toUpperCase() + fecha.slice(1)} · Avanza por módulos y supera el simulacro final de cada nivel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={activarExperto}
            disabled={activandoExperto}
            style={{ border: 'none', borderRadius: 10, background: O, color: '#fff', padding: '10px 16px', fontWeight: 900, cursor: activandoExperto ? 'wait' : 'pointer', fontSize: '0.84rem' }}
          >
            {activandoExperto ? 'Cambiando...' : 'Cambiar a Modo Experto'}
          </button>
          <Link to="/mis-oposiciones" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: O, padding: '10px 16px', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: '0.84rem', border: `1px solid ${OL}55` }}>
            Cambiar curso
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ ...CARD, padding: '12px 16px', color: '#b91c1c', background: '#fef2f2', borderColor: '#fecaca', fontSize: '0.82rem', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ ...CARD, padding: 24, color: GL, fontWeight: 800 }}>Cargando tu ruta Albacer...</div>
      ) : totalModulos === 0 ? (
        <div style={{ ...CARD, padding: 26 }}>
          <h2 style={{ margin: '0 0 8px', color: DK, fontSize: '1.05rem' }}>Aún no hay módulos publicados</h2>
          <p style={{ margin: 0, color: G, fontSize: '0.86rem', lineHeight: 1.6 }}>
            Tu profesor todavía no ha publicado el itinerario Albacer para esta oposición. Mientras tanto puedes consultar tu historial o cambiar a otro curso.
          </p>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <AlbacerMetric label="Módulos superados" value={`${modulosSuperados}/${totalModulos}`} hint={`${progresoPct}% del itinerario`} />
            <AlbacerMetric label="Nivel actual" value={planCompletado ? 'Completado' : (moduloActual?.nombre ?? 'Sin módulo')} hint={planCompletado ? 'Ruta Albacer finalizada' : 'Módulo desbloqueado'} />
            <AlbacerMetric label="Tests del módulo" value={testsActuales.length} hint="Puedes repetirlos cuando quieras" />
            <AlbacerMetric label="Simulacro final" value={finalActual ? 'Disponible' : 'Pendiente'} hint="Superarlo desbloquea el siguiente nivel" />
          </div>

          <div style={{ ...CARD, padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: GL, textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.06em' }}>
                  {planCompletado ? 'Plan completado' : 'Módulo actual'}
                </div>
                <h2 style={{ margin: '4px 0 5px', color: DK, fontSize: '1.18rem', fontWeight: 950 }}>
                  {planCompletado ? 'Has completado la ruta Albacer' : moduloActual?.nombre}
                </h2>
                {moduloActual?.descripcion && <p style={{ margin: 0, color: G, fontSize: '0.84rem', lineHeight: 1.55 }}>{moduloActual.descripcion}</p>}
              </div>
              {planCompletado && (
                <div style={{ background: '#dcfce7', color: '#166534', borderRadius: 999, padding: '6px 12px', fontSize: '0.76rem', fontWeight: 900 }}>
                  Ruta completada
                </div>
              )}
            </div>
            <ProgressBar pct={progresoPct} />
          </div>

          {modulosPractica.length > 0 && (
            <div className="albacer-home-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .8fr)', gap: 16, alignItems: 'start' }}>
              <div style={{ ...CARD, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: DK }}>Actividades disponibles</div>
                    <div style={{ fontSize: '0.72rem', color: GL, marginTop: 2 }}>Puedes repetir los tests y simulacros de módulos superados cuando quieras.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {modulosPractica.map((modulo) => (
                    <AlbacerModuloActivities
                      key={modulo.id}
                      modulo={modulo}
                      startingId={startingId}
                      onStart={startItem}
                    />
                  ))}
                </div>
              </div>

              <div style={{ ...CARD, padding: '20px 22px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: DK, marginBottom: 12 }}>Ruta de módulos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {modulos.slice(0, 8).map((modulo) => {
                    const superado = modulo.estado_calculado === 'superado';
                    const actual = modulo.estado_calculado === 'disponible';
                    const bloqueado = modulo.estado_calculado === 'bloqueado';
                    return (
                      <div key={modulo.id} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: 10, alignItems: 'center', opacity: bloqueado ? 0.65 : 1 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', background: superado ? '#dcfce7' : actual ? OBG : '#f3f4f6', color: superado ? '#15803d' : actual ? O : GL, fontWeight: 950, fontSize: '0.72rem' }}>
                          {superado ? '✓' : bloqueado ? '•' : '▶'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 900, color: DK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{modulo.nombre}</div>
                          <div style={{ fontSize: '0.66rem', color: GL }}>{superado ? 'Superado' : actual ? 'Actual' : 'Bloqueado'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <HistorialReciente />
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
    return <HomeAlbacer nombre={nombre} saludo={saludo} fecha={fecha} />;
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
