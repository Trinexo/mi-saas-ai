import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUserPlan } from '../../hooks/useUserPlan';
import { testApi } from '../../services/testApi';

const MODOS_PRO = ['refuerzo', 'repaso', 'simulacro'];

const MODO_LABEL = {
  repaso: 'Repaso espaciado',
  adaptativo: 'Test adaptativo',
  normal: 'Test de presentación',
  refuerzo: 'Test de refuerzo',
  simulacro: 'Simulacro',
};

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };
const BADGE = { display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', marginBottom: 10 };
const META = { display: 'flex', gap: 16, marginBottom: 12 };
const META_ITEM = { fontSize: 13, color: '#374151' };
const META_LABEL = { color: '#9ca3af', marginRight: 4 };

export default function TestRecomendadoWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const { hasAccess } = useUserPlan();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getRecommended(token)
      .then(setData)
      .catch(() => setData({ modo: 'adaptativo', temaId: null, oposicionId: null, oposicionNombre: null, numeroPreguntas: 10, motivo: 'Empieza con un test rápido de 10 preguntas' }));
  }, [token]);

  const onStart = async () => {
    const suggestion = data;
    if (!suggestion) return;

    // Si el modo recomendado requiere Pro y el usuario es free → fallback a adaptativo
    const modoEfectivo = (MODOS_PRO.includes(suggestion.modo) && !hasAccess('pro')) ? 'adaptativo' : suggestion.modo;

    let test;
    if (modoEfectivo === 'refuerzo') {
      const payload = { numeroPreguntas: Number(suggestion.numeroPreguntas || 10) };
      if (suggestion.temaId) payload.temaId = Number(suggestion.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, payload));
    } else {
      const payload = {
        modo: modoEfectivo || 'adaptativo',
        numeroPreguntas: Number(suggestion.numeroPreguntas || 10),
        dificultad: suggestion.dificultad || 'mixto',
      };
      if (suggestion.temasMix?.length > 0) {
        payload.temasMix = suggestion.temasMix;
      } else if (suggestion.temaId) {
        payload.temaId = Number(suggestion.temaId);
      }
      if (suggestion.oposicionId) payload.oposicionId = Number(suggestion.oposicionId);
      test = await runAction(() => testApi.generate(token, payload));
    }
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const sinAcceso = !data?.oposicionId;

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Test recomendado</h2>

      {data?.oposicionNombre && (
        <div style={BADGE}>{data.oposicionNombre}</div>
      )}

      {data && (
        <div style={META}>
          <span style={META_ITEM}>
            <span style={META_LABEL}>Modo</span>
            {MODO_LABEL[data.modo] ?? data.modo}
          </span>
          <span style={META_ITEM}>
            <span style={META_LABEL}>Preguntas</span>
            {data.numeroPreguntas}
          </span>
        </div>
      )}

      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 14px' }}>
        {data?.motivo || 'Cargando sugerencia...'}
      </p>

      {sinAcceso ? (
        <button
          onClick={() => navigate('/catalogo')}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #1d4ed8', background: '#fff', color: '#1d4ed8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          Ver oposiciones
        </button>
      ) : (
        <button
          disabled={isLoading || !data}
          onClick={onStart}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (isLoading || !data) ? 'not-allowed' : 'pointer', opacity: (isLoading || !data) ? 0.7 : 1 }}
        >
          {isLoading ? 'Generando...' : 'Hacer test ahora'}
        </button>
      )}
    </div>
  );
}
