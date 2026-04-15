import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function FocoHoyWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getFocoHoy(token)
      .then(setData)
      .catch(() => setData({ modo: 'adaptativo', temaId: null, numeroPreguntas: 10, motivo: 'Activa tu sesión con 10 preguntas' }));
  }, [token]);

  const onStart = async () => {
    const foco = await runAction(() => testApi.getFocoHoy(token));
    if (!foco) return;
    setData(foco);
    let test;
    if (foco.modo === 'refuerzo') {
      const payload = { numeroPreguntas: Number(foco.numeroPreguntas || 10) };
      if (foco.temaId) payload.temaId = Number(foco.temaId);
      test = await runAction(() => testApi.generateRefuerzo(token, payload));
    } else {
      const payload = {
        modo: foco.modo || 'adaptativo',
        numeroPreguntas: Number(foco.numeroPreguntas || 10),
        dificultad: 'mixto',
      };
      if (foco.temaId) payload.temaId = Number(foco.temaId);
      test = await runAction(() => testApi.generate(token, payload));
    }
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Foco de hoy</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
        {data?.motivo || 'Activa tu sesión con 10 preguntas'}
      </p>
      <button
        disabled={isLoading}
        onClick={onStart}
        style={{ marginTop: 8, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
      >
        {isLoading ? 'Generando...' : 'Empezar foco'}
      </button>
    </div>
  );
}
