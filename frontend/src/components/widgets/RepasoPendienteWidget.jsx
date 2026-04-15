import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUserPlan } from '../../hooks/useUserPlan';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function RepasoPendienteWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction, setErrorMessage } = useAsyncAction();
  const { hasAccess, loading: planLoading } = useUserPlan();
  const [data, setData] = useState(null);

  const tienePro = hasAccess('pro');

  useEffect(() => {
    if (planLoading || !tienePro) return;
    testApi.getRepasoPendientes(token, 20)
      .then(setData)
      .catch(() => setData({ totalPendientes: 0, temaIdSugerido: null, items: [] }));
  }, [token, tienePro, planLoading]);

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

  // Plan free → estado bloqueado
  if (!planLoading && !tienePro) {
    return (
      <div style={{ ...SECTION, background: '#f9fafb', border: '1px dashed #d1d5db' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#6b7280' }}>🔒 Repaso espaciado</h2>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 12px' }}>
          La repetición espaciada activa el repaso inteligente basado en tus fallos a lo largo del tiempo.
        </p>
        <button
          onClick={() => navigate('/planes')}
          style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #1d4ed8', background: '#fff', color: '#1d4ed8', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Desbloquear con Pro
        </button>
      </div>
    );
  }

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Repaso pendiente hoy</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {data?.totalPendientes
          ? `Tienes ${data.totalPendientes} preguntas pendientes de repetición espaciada.`
          : 'No tienes preguntas pendientes hoy.'}
      </p>
      <button
        disabled={!data?.totalPendientes || isLoading}
        onClick={onStart}
        style={{ marginTop: 8, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (!data?.totalPendientes || isLoading) ? 'not-allowed' : 'pointer', opacity: (!data?.totalPendientes || isLoading) ? 0.5 : 1 }}
      >
        {isLoading ? 'Generando...' : 'Empezar repaso'}
      </button>
    </div>
  );
}
