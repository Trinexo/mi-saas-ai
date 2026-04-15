import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function TestRecomendadoWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getRecommended(token)
      .then(setData)
      .catch(() => setData({ modo: 'adaptativo', temaId: null, numeroPreguntas: 10, motivo: 'Empieza con un test rápido de 10 preguntas' }));
  }, [token]);

  const onStart = async () => {
    const suggestion = await runAction(() => testApi.getRecommended(token));
    if (!suggestion) return;
    setData(suggestion);
    let test;
    if (suggestion.modo === 'refuerzo') {
      const payload = { numeroPreguntas: Number(suggestion.numeroPreguntas || 10) };
      if (suggestion.temaId) payload.temaId = Number(suggestion.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, payload));
    } else {
      const payload = {
        modo: suggestion.modo || 'adaptativo',
        numeroPreguntas: Number(suggestion.numeroPreguntas || 10),
        dificultad: suggestion.dificultad || 'mixto',
      };
      if (suggestion.temaId) payload.temaId = Number(suggestion.temaId);
      if (suggestion.oposicionId) payload.oposicionId = Number(suggestion.oposicionId);
      test = await runAction(() => testApi.generate(token, payload));
    }
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Test recomendado</h2>
      <button
        disabled={isLoading}
        onClick={onStart}
        style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
      >
        {isLoading ? 'Generando...' : 'Hacer test ahora'}
      </button>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
        {data?.motivo || 'Empieza con un test rápido de 10 preguntas'}
      </p>
    </div>
  );
}
