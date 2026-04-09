import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { catalogApi } from '../../services/catalogApi';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function GenerarTestForm({ modoSugerido = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationStateApplied = useRef(false);
  const { token, user } = useAuth();
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
        const prefId = user?.oposicionPreferidaId ? String(user.oposicionPreferidaId) : null;
        const targetOposicionId = stateOposicionId || prefId;
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
        border: '4px solid #e0e7ff',
        borderTopColor: '#6366f1',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6366f1', fontWeight: 600 }}>Generando tu test…</p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Seleccionando las preguntas más adecuadas para ti</p>
    </div>
  );

  return (
    <section style={SECTION}>
      <h2>Generar test</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.75rem 0' }}>
        <select value={selection.oposicionId} onChange={(e) => onOposicion(e.target.value)} disabled={selection.modo === 'marcadas'}>
          <option value="">{selection.modo === 'marcadas' ? '(no aplica en modo marcadas)' : 'Selecciona oposición'}</option>
          {oposiciones.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
        <select value={selection.materiaId} onChange={(e) => onMateria(e.target.value)} disabled={!selection.oposicionId || selection.modo === 'marcadas'}>
          <option value="">Selecciona materia</option>
          {materias.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
        <select value={selection.temaId} onChange={(e) => setSelection({ ...selection, temaId: e.target.value })} disabled={!selection.materiaId || selection.modo === 'marcadas'}>
          <option value="">Selecciona tema</option>
          {temas.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          max="100"
          value={selection.numeroPreguntas}
          onChange={(e) => setSelection({ ...selection, numeroPreguntas: e.target.value })}
        />
        <select value={selection.modo} onChange={(e) => setSelection({ ...selection, modo: e.target.value })}>
          <option value="adaptativo">Adaptativo (prioriza fallos)</option>
          <option value="normal">Normal (preguntas nuevas)</option>
          <option value="repaso">Repaso (revisión espaciada)</option>
          <option value="marcadas">Desde preguntas marcadas</option>
        </select>
        <select
          value={selection.dificultad}
          onChange={(e) => setSelection({ ...selection, dificultad: e.target.value })}
          disabled={selection.modo === 'repaso' || selection.modo === 'marcadas'}
        >
          <option value="mixto">Mixto (40% media · 30% fácil · 30% difícil)</option>
          <option value="facil">Solo fácil</option>
          <option value="media">Solo media</option>
          <option value="dificil">Solo difícil</option>
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', userSelect: 'none', marginTop: 8 }}>
        <input
          type="checkbox"
          checked={oposicionCompleta}
          disabled={!selection.oposicionId || selection.modo === 'marcadas'}
          onChange={(e) => {
            setOposicionCompleta(e.target.checked);
            if (e.target.checked) setSelection((prev) => ({ ...prev, materiaId: '', temaId: '' }));
          }}
        />
        Oposición completa (sin filtrar por tema)
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', userSelect: 'none', marginTop: 8 }}>
        <input
          type="checkbox"
          checked={feedbackInmediato}
          onChange={(e) => setFeedbackInmediato(e.target.checked)}
        />
        Feedback inmediato (ver respuesta correcta al contestar)
      </label>
      <button
        disabled={(selection.modo !== 'marcadas' && !selection.temaId && !(oposicionCompleta && selection.oposicionId)) || isLoading}
        onClick={onGenerate}
      >
        {isLoading ? 'Generando...' : 'Generar test'}
      </button>
      <button disabled={isLoading} onClick={onGenerateRefuerzo} style={{ marginLeft: '0.5rem' }}>
        {isLoading ? 'Generando...' : 'Hacer test de refuerzo'}
      </button>
    </section>
  );
}
