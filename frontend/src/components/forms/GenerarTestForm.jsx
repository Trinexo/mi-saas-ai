import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUserPlan } from '../../hooks/useUserPlan';
import { useUserAccesos } from '../../hooks/useUserAccesos';
import { catalogApi } from '../../services/catalogApi';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, borderTop: '3px solid #10b981' };
const SEL = { width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', color: '#374151', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const LBL = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 };
const SUBHEAD = { fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 };
const DIVIDER = { height: 1, background: '#e5e7eb', margin: '12px 0 14px' };

const MODO_OPTIONS = [
  { value: 'adaptativo', label: 'Adaptativo (prioriza fallos)',    minPlan: 'free' },
  { value: 'normal',     label: 'Normal (preguntas nuevas)',       minPlan: 'free' },
  { value: 'repaso',     label: 'Repaso (revisión espaciada)',     minPlan: 'pro'  },
  { value: 'marcadas',   label: 'Desde preguntas marcadas',       minPlan: 'free' },
];

export default function GenerarTestForm({ modoSugerido = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationStateApplied = useRef(false);
  const { token } = useAuth();
  const { hasAccess: hasPlanAccess } = useUserPlan();
  const { tieneAcceso, loading: loadingAccesos } = useUserAccesos();
  const { error, isLoading, clearError, runAction, setErrorMessage } = useAsyncAction();
  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState({ oposicionId: '', materiaId: '', temaId: '', numeroPreguntas: 10, modo: modoSugerido ?? 'adaptativo', dificultad: 'mixto' });
  const [oposicionCompleta, setOposicionCompleta] = useState(false);
  const [feedbackInmediato, setFeedbackInmediato] = useState(false);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .getOposiciones()
      .then(async (ops) => {
        if (cancelled) return;
        setOposiciones(ops);
        const stateOposicionId = location.state?.oposicionId ? String(location.state.oposicionId) : null;
        const targetOposicionId = stateOposicionId;
        if (targetOposicionId && !cancelled) {
          setSelection((prev) => ({ ...prev, oposicionId: targetOposicionId, materiaId: '', temaId: '' }));
          const materiasData = await catalogApi.getMaterias(targetOposicionId);
          if (!cancelled) {
            setMaterias(materiasData);
            const stateMateriaId = location.state?.materiaId ? String(location.state.materiaId) : null;
            if (stateMateriaId && !locationStateApplied.current) {
              setSelection((prev) => ({ ...prev, materiaId: stateMateriaId, temaId: '' }));
              const temasData = await catalogApi.getTemas(stateMateriaId);
              if (!cancelled) {
                setTemas(temasData);
                const stateTemaId = location.state?.temaId ? String(location.state.temaId) : null;
                if (stateTemaId) setSelection((prev) => ({ ...prev, temaId: stateTemaId }));
              }
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

  const onOposicion = async (id) => {
    setSelection({ ...selection, oposicionId: id, materiaId: '', temaId: '' });
    setMaterias([]);
    setTemas([]);
    clearError();
    if (!id) return;
    try {
      const data = await catalogApi.getMaterias(id);
      setMaterias(data);
    } catch (e) {
      setErrorMessage(e, 'No se pudieron cargar las materias');
    }
  };

  const onMateria = async (id) => {
    setSelection({ ...selection, materiaId: id, temaId: '' });
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

  const onGenerate = async () => {
    clearError();
    const numeroPreguntas = Number(selection.numeroPreguntas);
    if (!Number.isInteger(numeroPreguntas) || numeroPreguntas < 1 || numeroPreguntas > 100) {
      setErrorMessage('Indica un número de preguntas entre 1 y 100');
      return;
    }
    const payload = { numeroPreguntas, modo: selection.modo, dificultad: selection.dificultad, feedbackInmediato };
    if (selection.modo !== 'marcadas') {
      if (oposicionCompleta && selection.oposicionId && !selection.temaId) {
        payload.oposicionId = Number(selection.oposicionId);
      } else {
        payload.temaId = Number(selection.temaId);
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
    const numeroPreguntas = Number(selection.numeroPreguntas);
    if (!Number.isInteger(numeroPreguntas) || numeroPreguntas < 1 || numeroPreguntas > 100) {
      setErrorMessage('Indica un número de preguntas entre 1 y 100');
      return;
    }
    const payload = { numeroPreguntas };
    if (selection.temaId) payload.temaId = Number(selection.temaId);
    const test = await runAction(() => testApi.generateRefuerzo(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  if (loading) return <p>Cargando catálogo...</p>;
  if (error) return <p style={{ color: '#dc2626', padding: '1rem' }}>{error}</p>;

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '1.25rem' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '4px solid #dbeafe',
        borderTopColor: '#1d4ed8',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#1d4ed8', fontWeight: 600 }}>Generando tu test…</p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Seleccionando las preguntas más adecuadas para ti</p>
    </div>
  );

  return (
    <div style={SECTION}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <div style={{ background: '#10b981', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📋</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Práctica personalizada</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5 }}>Elige oposición, tema, modo y dificultad para tu sesión.</p>
        </div>
      </div>

      {/* Grupo: Contenido */}
      <div style={SUBHEAD}>Contenido</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: 10 }}>
        <div>
          <label style={LBL}>Oposición</label>
          <select
            value={selection.oposicionId}
            onChange={(e) => onOposicion(e.target.value)}
            disabled={selection.modo === 'marcadas'}
            style={{ ...SEL, opacity: selection.modo === 'marcadas' ? 0.5 : 1 }}
          >
            <option value="">{selection.modo === 'marcadas' ? '(no aplica)' : 'Selecciona oposición'}</option>
            {oposiciones.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
          {/* Gate: aviso si la oposición no tiene acceso completo */}
          {!loadingAccesos && selection.oposicionId && !tieneAcceso(Number(selection.oposicionId)) && selection.modo !== 'marcadas' && (
            <div style={{ marginTop: 8, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Modo demo</strong> — Las preguntas estarán limitadas. Para acceso completo, <a href="/catalogo" style={{ color: '#1d4ed8', fontWeight: 600 }}>compra el curso</a>.
            </div>
          )}
        </div>
        <div>
          <label style={LBL}>Materia</label>
          <select
            value={selection.materiaId}
            onChange={(e) => onMateria(e.target.value)}
            disabled={!selection.oposicionId || selection.modo === 'marcadas'}
            style={{ ...SEL, opacity: (!selection.oposicionId || selection.modo === 'marcadas') ? 0.5 : 1 }}
          >
            <option value="">Selecciona materia</option>
            {materias.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LBL}>Tema</label>
          <select
            value={selection.temaId}
            onChange={(e) => setSelection({ ...selection, temaId: e.target.value })}
            disabled={!selection.materiaId || selection.modo === 'marcadas' || oposicionCompleta}
            style={{ ...SEL, opacity: (!selection.materiaId || selection.modo === 'marcadas' || oposicionCompleta) ? 0.5 : 1 }}
          >
            <option value="">Selecciona tema</option>
            {temas.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none', color: '#374151', marginBottom: 2 }}>
        <input
          type="checkbox"
          checked={oposicionCompleta}
          disabled={!selection.oposicionId || selection.modo === 'marcadas'}
          onChange={(e) => {
            setOposicionCompleta(e.target.checked);
            if (e.target.checked) setSelection((prev) => ({ ...prev, materiaId: '', temaId: '' }));
          }}
        />
        Usar toda la oposición (sin filtrar por tema)
      </label>

      <div style={DIVIDER} />

      {/* Grupo: Parámetros */}
      <div style={SUBHEAD}>Parámetros</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: 10 }}>
        <div>
          <label style={LBL}>Nº preguntas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(máx. 100)</span></label>
          <input
            type="number"
            min="1"
            max="100"
            value={selection.numeroPreguntas}
            onChange={(e) => setSelection({ ...selection, numeroPreguntas: e.target.value })}
            style={SEL}
          />
        </div>
        <div>
          <label style={LBL}>Modo</label>
          <select
            value={selection.modo}
            onChange={(e) => {
              const opt = MODO_OPTIONS.find((o) => o.value === e.target.value);
              if (opt && !hasPlanAccess(opt.minPlan)) {
                navigate('/planes');
                return;
              }
              setSelection({ ...selection, modo: e.target.value });
            }}
            style={SEL}
          >
            {MODO_OPTIONS.map((opt) => {
              const bloqueado = !hasPlanAccess(opt.minPlan);
              return (
                <option key={opt.value} value={opt.value}>
                  {bloqueado ? `🔒 ${opt.label} (Pro)` : opt.label}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label style={LBL}>Dificultad</label>
          <select
            value={selection.dificultad}
            onChange={(e) => setSelection({ ...selection, dificultad: e.target.value })}
            disabled={selection.modo === 'repaso' || selection.modo === 'marcadas'}
            style={{ ...SEL, opacity: (selection.modo === 'repaso' || selection.modo === 'marcadas') ? 0.5 : 1 }}
        >
          <option value="mixto">Mixto (40% media · 30% fácil · 30% difícil)</option>
          <option value="facil">Solo fácil</option>
          <option value="media">Solo media</option>
          <option value="dificil">Solo difícil</option>
          </select>
        </div>
      </div>

      <div style={DIVIDER} />

      {/* Opciones */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none', color: '#374151', marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={feedbackInmediato}
          onChange={(e) => setFeedbackInmediato(e.target.checked)}
        />
        Ver respuesta correcta al contestar (feedback inmediato)
      </label>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          disabled={(selection.modo !== 'marcadas' && !selection.temaId && !(oposicionCompleta && selection.oposicionId)) || isLoading}
          onClick={onGenerate}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer',
            opacity: ((selection.modo !== 'marcadas' && !selection.temaId && !(oposicionCompleta && selection.oposicionId)) || isLoading) ? 0.5 : 1,
          }}
        >
          {isLoading ? 'Generando…' : '▷ Generar test'}
        </button>
        {hasPlanAccess('pro') ? (
          <button
            disabled={isLoading}
            onClick={onGenerateRefuerzo}
            style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.9rem',
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Generando…' : '🔁 Test de refuerzo'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/planes')}
            style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid #e5e7eb',
              background: '#f9fafb', color: '#9ca3af', fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer',
            }}
            title="Disponible en Plan Pro"
          >
            🔒 Test de refuerzo (Pro)
          </button>
        )}
      </div>
    </div>
  );
}
