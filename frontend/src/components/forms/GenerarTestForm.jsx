import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUserPlan } from '../../hooks/useUserPlan';
import { useUserAccesos } from '../../hooks/useUserAccesos';
import { useOposicionActiva } from '../../state/oposicionActiva.jsx';
import { catalogApi } from '../../services/catalogApi';
import { testApi } from '../../services/testApi';
import { repasoApi } from '../../services/repasoApi';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const O = '#ea580c';
const CARD = {
  background: '#fff', borderRadius: 16,
  border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
  padding: '24px',
};
const LBL = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 };
const INP = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem',
  color: '#111827', outline: 'none',
};
const SEL = INP;
const DIVIDER = { height: 1, background: '#f1f5f9', margin: '16px 0' };
const LABEL_GREY = { fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: 4 };

function ToggleSwitch({ value, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: value ? O : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background .2s' }}
      >
        <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  );
}

const MODO_OPTIONS = [
  { value: 'adaptativo', label: 'Adaptativo', desc: 'Prioriza tus fallos recientes', minPlan: 'free' },
  { value: 'normal',     label: 'Normal',     desc: 'Preguntas nuevas sin ver',      minPlan: 'free' },
  { value: 'repaso',     label: 'Repaso',     desc: 'Revisión espaciada (Anki)',     minPlan: 'pro'  },
  { value: 'marcadas',   label: 'Marcadas',   desc: 'Solo preguntas favoritas',      minPlan: 'free' },
];

const DIF_OPTIONS = [
  { key: 'facil',   label: 'Fácil',   color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  { key: 'media',   label: 'Media',   color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'dificil', label: 'Difícil', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
];

function buildTemasMixEqual(ids) {
  const base = Math.floor(100 / ids.length);
  let used = 0;
  return ids.map((temaId, i) => {
    const pct = i === ids.length - 1 ? 100 - used : base;
    used += pct;
    return { temaId, pct };
  });
}

export default function GenerarTestForm({ modoSugerido = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationStateApplied = useRef(false);
  const { token } = useAuth();
  const { hasAccess: hasPlanAccess } = useUserPlan();
  const { tieneAcceso, loading: loadingAccesos } = useUserAccesos();
  const { oposicionActiva } = useOposicionActiva();
  const { isMobile } = useBreakpoint();
  const usandoOposicionActiva = !!oposicionActiva && !location.state?.oposicionId;
  const { error: asyncError, isLoading, clearError, runAction, setErrorMessage } = useAsyncAction();

  // Catálogo
  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del formulario
  const [oposicionId, setOposicionId] = useState('');
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);
  const [oposicionCompleta, setOposicionCompleta] = useState(false);
  const [modo, setModo] = useState(modoSugerido ?? 'adaptativo');
  const [dificultades, setDificultades] = useState({ facil: true, media: true, dificil: true });
  const [numeroPreguntas, setNumeroPreguntas] = useState(10);
  const [feedbackInmediato, setFeedbackInmediato] = useState(false);
  const [repasoDisponible, setRepasoDisponible] = useState(false);
  const [adaptativoDisponible, setAdaptativoDisponible] = useState(false);

  // Comprobar si hay pendientes de repaso al montar (solo para usuarios pro/elite/admin)
  useEffect(() => {
    if (!token || !hasPlanAccess('pro')) return;
    repasoApi.getPendientes(token, 1)
      .then((data) => setRepasoDisponible((data?.totalPendientes ?? 0) > 0))
      .catch(() => setRepasoDisponible(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Comprobar si el usuario tiene suficiente historial para el modo adaptativo (>= 3 tests)
  useEffect(() => {
    if (!token) return;
    testApi.userStats(token)
      .then((data) => setAdaptativoDisponible((data?.totalTests ?? 0) >= 3))
      .catch(() => setAdaptativoDisponible(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculados
  const difActivas = DIF_OPTIONS.filter((d) => dificultades[d.key]);
  const dificultadBackend = difActivas.length === 1 ? difActivas[0].key : 'mixto';
  const efectivoOposicionId = oposicionId || (oposicionActiva?.id ? String(oposicionActiva.id) : '');
  const oposicionNombre = usandoOposicionActiva
    ? oposicionActiva.nombre
    : oposiciones.find((o) => String(o.id) === String(oposicionId))?.nombre ?? '';

  // Modos visibles según datos disponibles
  const modoOptionsVisibles = MODO_OPTIONS.filter((opt) => {
    if (opt.value === 'repaso')      return repasoDisponible;
    if (opt.value === 'adaptativo') return adaptativoDisponible;
    return true;
  });

  // Si el modo activo deja de estar disponible, caer a 'normal'
  useEffect(() => {
    if (modo === 'adaptativo' && !adaptativoDisponible) setModo('normal');
    if (modo === 'repaso'      && !repasoDisponible)    setModo('normal');
  }, [adaptativoDisponible, repasoDisponible, modo]);

  const canGenerate = !isLoading && (
    modo === 'marcadas' ||
    (oposicionCompleta && !!efectivoOposicionId) ||
    temasSeleccionados.length >= 1
  );

  // Cargar catálogo
  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getOposiciones()
      .then(async (ops) => {
        if (cancelled) return;
        setOposiciones(ops);
        const stateOposId = location.state?.oposicionId ? String(location.state.oposicionId) : null;
        const activaId = oposicionActiva?.id ? String(oposicionActiva.id) : null;
        const targetId = stateOposId ?? activaId;
        if (targetId && !cancelled) {
          setOposicionId(targetId);
          const temasData = await catalogApi.getTemas(targetId);
          if (!cancelled) {
            setTemas(temasData);
            const stateTemaId = location.state?.temaId ? String(location.state.temaId) : null;
            if (stateTemaId && !locationStateApplied.current) {
              setTemasSeleccionados([stateTemaId]);
            } else if (location.state?.oposicionId && !stateTemaId) {
              // Llegó desde el catálogo con solo oposicionId → activar "Toda la oposición"
              // para que el botón "Crear test" esté habilitado de inmediato
              setOposicionCompleta(true);
            }
          }
        }
        locationStateApplied.current = true;
      })
      .catch((e) => setErrorMessage(e, 'No se pudo cargar el catálogo'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeOposicion = async (id) => {
    setOposicionId(id);
    setTemasSeleccionados([]);
    setOposicionCompleta(false);
    setTemas([]);
    clearError();
    if (!id) return;
    try {
      const data = await catalogApi.getTemas(id);
      setTemas(data);
    } catch (e) {
      setErrorMessage(e, 'No se pudieron cargar los temas');
    }
  };

  const toggleTema = (id) => {
    setTemasSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodos = () => setTemasSeleccionados(temas.map((t) => String(t.id)));
  const deseleccionarTodos = () => setTemasSeleccionados([]);

  const toggleDificultad = (key) => {
    setDificultades((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.facil && !next.media && !next.dificil) return prev;
      return next;
    });
  };

  const onGenerate = async () => {
    clearError();
    const n = Number(numeroPreguntas);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      setErrorMessage('Indica un número de preguntas entre 1 y 100');
      return;
    }
    const realOposicionId = Number(efectivoOposicionId) || undefined;
    const payload = { numeroPreguntas: n, modo, dificultad: dificultadBackend, feedbackInmediato };
    if (modo !== 'marcadas') {
      if (oposicionCompleta && realOposicionId) {
        payload.oposicionId = realOposicionId;
      } else if (temasSeleccionados.length >= 2) {
        payload.temasMix = buildTemasMixEqual(temasSeleccionados.map(Number));
        if (realOposicionId) payload.oposicionId = realOposicionId;
      } else if (temasSeleccionados.length === 1) {
        payload.temaId = Number(temasSeleccionados[0]);
        if (realOposicionId) payload.oposicionId = realOposicionId;
      }
    }
    const test = await runAction(() => testApi.generate(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const onGenerateRefuerzo = async () => {
    clearError();
    const payload = { numeroPreguntas: Number(numeroPreguntas) };
    if (temasSeleccionados.length === 1) payload.temaId = Number(temasSeleccionados[0]);
    const test = await runAction(() => testApi.generateRefuerzo(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <style>{`@keyframes gtspin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `4px solid #fff7ed`, borderTopColor: O, animation: 'gtspin .8s linear infinite' }} />
    </div>
  );

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '1.25rem' }}>
      <style>{`@keyframes gtspin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `4px solid #fff7ed`, borderTopColor: O, animation: 'gtspin 0.8s linear infinite' }} />
      <p style={{ margin: 0, color: O, fontWeight: 600 }}>Generando tu test…</p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Seleccionando las preguntas más adecuadas para ti</p>
    </div>
  );

  return (
    <div style={{ width: '100%', paddingBottom: 40 }}>

      {/* ── Layout 2 columnas ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 1.35fr) minmax(250px, 1fr)', gap: 20, alignItems: 'stretch' }}>

        {/* ─── Card 1: Contenido ────────────────────────────────────────────── */}
        <div className="gtf-card" style={{ ...CARD, minWidth: 0, overflow: 'hidden' }}>

          {/* Oposición */}
          <h2 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Oposición</h2>
          {usandoOposicionActiva ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid #fed7aa', borderRadius: 10, background: '#fff7ed', fontSize: '0.875rem', color: '#92400e', fontWeight: 600, marginBottom: 20 }}>
              <span>🎯</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oposicionActiva.nombre}</span>
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <select
                value={oposicionId}
                onChange={(e) => onChangeOposicion(e.target.value)}
                disabled={modo === 'marcadas'}
                style={{ ...INP, color: oposicionId ? '#111827' : '#9ca3af', opacity: modo === 'marcadas' ? 0.5 : 1 }}
              >
                <option value="">{modo === 'marcadas' ? '(no aplica en modo marcadas)' : 'Selecciona una oposición…'}</option>
                {oposiciones.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </select>
              {!loadingAccesos && oposicionId && !tieneAcceso(Number(oposicionId)) && modo !== 'marcadas' && (
                <div style={{ marginTop: 8, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                  <strong>Modo demo</strong> — Las preguntas estarán limitadas. Para acceso completo, <a href="/catalogo" style={{ color: '#1d4ed8', fontWeight: 600 }}>compra el curso</a>.
                </div>
              )}
            </div>
          )}

          <div style={DIVIDER} />

          {/* Temas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Temas</h2>
              {temas.length > 0 && !oposicionCompleta && modo !== 'marcadas' && (
                <button
                  onClick={temasSeleccionados.length === temas.length ? deseleccionarTodos : seleccionarTodos}
                  style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: O, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  {temasSeleccionados.length === temas.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>
            {modo === 'marcadas' ? (
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 10, fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                No aplica en modo marcadas
              </div>
            ) : temas.length === 0 ? (
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 10, fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                No hay temas disponibles
              </div>
            ) : (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: oposicionCompleta ? '#fff7ed' : '#f8fafc', border: `1px solid ${oposicionCompleta ? '#fed7aa' : '#e2e8f0'}`, fontSize: '0.875rem', color: '#374151', cursor: 'pointer', marginBottom: 6, fontWeight: oposicionCompleta ? 700 : 400 }}>
                  <input type="checkbox" checked={oposicionCompleta} onChange={(e) => { setOposicionCompleta(e.target.checked); if (e.target.checked) setTemasSeleccionados([]); }} style={{ accentColor: O }} />
                  <span style={{ flex: 1 }}>Toda la oposición</span>
                  {oposicionCompleta && <span style={{ fontSize: '0.68rem', color: O, fontWeight: 700, background: '#fed7aa', padding: '2px 6px', borderRadius: 4 }}>ACTIVO</span>}
                </label>
                <div style={{ maxHeight: 240, overflowY: 'auto', overflowX: 'hidden', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px', width: '100%' }}>
                  {temas.map((t) => {
                    const checked = temasSeleccionados.includes(String(t.id));
                    const blocked = !oposicionCompleta && !checked && temasSeleccionados.length >= 10;
                    return (
                      <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 6, cursor: oposicionCompleta || blocked ? 'not-allowed' : 'pointer', background: checked ? '#fff7ed' : 'transparent', marginBottom: 1, minWidth: 0 }}>
                        <input type="checkbox" checked={checked} disabled={oposicionCompleta || blocked} onChange={() => toggleTema(String(t.id))} style={{ accentColor: O }} />
                        <span style={{ fontSize: '0.875rem', color: oposicionCompleta ? '#94a3b8' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.nombre}</span>
                      </label>
                    );
                  })}
                </div>
                {temasSeleccionados.length >= 2 && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>{temasSeleccionados.length} temas · distribución equitativa</p>
                )}
                {temasSeleccionados.length >= 10 && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>Máximo 10 temas en modo mezcla</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── Card 2: Parámetros ───────────────────────────────────────────── */}
        <div className="gtf-card" style={{ ...CARD, minWidth: 0, overflow: 'hidden' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Parámetros del test</h2>

          {/* Nº preguntas inline */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <label style={{ ...LBL, margin: 0 }}>Número de preguntas</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setNumeroPreguntas((n) => Math.max(1, n - 1))} style={{ width: 32, height: 34, borderRadius: '7px 0 0 7px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <input type="number" min="1" max="100" value={numeroPreguntas} onChange={(e) => setNumeroPreguntas(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} style={{ width: 68, height: 34, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: '#111827', outline: 'none', background: '#fff', MozAppearance: 'textfield' }} />
              <button onClick={() => setNumeroPreguntas((n) => Math.min(100, n + 1))} style={{ width: 32, height: 34, borderRadius: '0 7px 7px 0', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          <div style={DIVIDER} />

          {/* Dificultad como chips en fila */}
          <label style={{ ...LBL, marginBottom: 8 }}>Dificultad</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
            {DIF_OPTIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDificultad(d.key)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', border: `1.5px solid ${dificultades[d.key] ? d.border : '#e2e8f0'}`,
                  background: dificultades[d.key] ? d.bg : '#f8fafc',
                  color: dificultades[d.key] ? d.color : '#94a3b8',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div style={DIVIDER} />

          {/* Modo de práctica en grid 2 cols */}
          <label style={{ ...LBL, marginBottom: 8 }}>Modo de práctica</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {modoOptionsVisibles.map((opt) => {
              const locked = !hasPlanAccess(opt.minPlan);
              const sel = modo === opt.value;
              return (
                <label key={opt.value} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 8, cursor: locked ? 'not-allowed' : 'pointer', border: `1.5px solid ${sel ? '#fed7aa' : '#e2e8f0'}`, background: sel ? '#fff7ed' : '#f8fafc', opacity: locked ? 0.6 : 1 }}>
                  <input type="radio" name="modo" value={opt.value} checked={sel} onChange={() => locked ? navigate('/planes') : setModo(opt.value)} style={{ display: 'none' }} />
                  <strong style={{ fontSize: '0.8rem', color: sel ? '#92400e' : '#111827' }}>{locked ? `🔒 ${opt.label}` : opt.label}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>{opt.desc}</span>
                </label>
              );
            })}
          </div>

          <div style={DIVIDER} />

          <ToggleSwitch
            value={feedbackInmediato}
            onChange={setFeedbackInmediato}
            label="Feedback inmediato"
            desc="Ver la respuesta correcta al contestar"
          />
        </div>
      </div>

      {/* ─── Card Resumen (full-width) ────────────────────────────────────── */}
      <div style={{ ...CARD, marginTop: 20, display: 'flex', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 24, flexWrap: 'wrap' }}>

        {/* Datos en fila */}
        <div style={{ flex: 1, display: 'flex', gap: 0, flexWrap: 'wrap', minWidth: 0 }}>
          {[
            ['Oposición', oposicionNombre || '—'],
            ['Temas', modo === 'marcadas' ? 'Tus marcadas' : oposicionCompleta ? 'Toda la oposición' : temasSeleccionados.length > 0 ? `${temasSeleccionados.length} tema${temasSeleccionados.length > 1 ? 's' : ''}` : '—'],
            ['Modo', MODO_OPTIONS.find((m) => m.value === modo)?.label ?? '—'],
            ['Preguntas', String(numeroPreguntas)],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '0 20px 0 0', borderRight: '1px solid #f1f5f9', marginRight: 20, marginBottom: 8 }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
          ))}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>Dificultad</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {difActivas.map((d) => (
                <span key={d.key} style={{ background: d.bg, color: d.color, border: `1px solid ${d.border}`, borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180, flexShrink: 0 }}>
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: canGenerate ? O : '#f1f5f9', color: canGenerate ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '0.9rem', cursor: canGenerate ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            Crear test <span>→</span>
          </button>
          {hasPlanAccess('pro') ? (
            <button onClick={onGenerateRefuerzo} disabled={isLoading} style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              🔁 Test de refuerzo
            </button>
          ) : (
            <button onClick={() => navigate('/planes')} style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              🔒 Test de refuerzo (Pro)
            </button>
          )}
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4, textAlign: 'center' }}>
            Las preguntas se seleccionan según tus criterios
          </p>
        </div>
      </div>

      {/* Error */}
      {asyncError && !isLoading && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '12px 16px', fontSize: '0.875rem', marginTop: 16, border: '1px solid #fecaca' }}>
          <span style={{ flexShrink: 0 }}>⚠️</span><span>{asyncError}</span>
        </div>
      )}
    </div>
  );
}
