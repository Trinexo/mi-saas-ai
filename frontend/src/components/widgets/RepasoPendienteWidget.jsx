import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function RepasoPendienteWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction, setErrorMessage } = useAsyncAction();
  const [data, setData] = useState(null);

  useEffect(() => {
    testApi.getRepasoPendientes(token, 20)
      .then(setData)
      .catch(() => setData({ totalPendientes: 0, temaIdSugerido: null, items: [] }));
  }, [token]);

  const onStart = async () => {
    const temaId = data?.temaIdSugerido;
    const totalPendientes = Number(data?.totalPendientes || 0);
    if (!temaId || totalPendientes < 1) {
      setErrorMessage('No tienes repaso pendiente hoy');
      return;
    }
    const payload = {
      modo: 'repaso',
      temaId,
      numeroPreguntas: Math.min(20, Math.max(5, totalPendientes)),
      dificultad: 'mixto',
    };
    const test = await runAction(() => testApi.generate(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  return (
    <section style={SECTION}>
      <h2>Repaso pendiente hoy</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {data?.totalPendientes
          ? `Tienes ${data.totalPendientes} preguntas pendientes de repetición espaciada.`
          : 'No tienes preguntas pendientes hoy.'}
      </p>
      <button disabled={!data?.totalPendientes || isLoading} onClick={onStart}>
        {isLoading ? 'Generando...' : 'Empezar repaso'}
      </button>
    </section>
  );
}
