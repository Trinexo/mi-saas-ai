import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useUserPlan } from '../../hooks/useUserPlan';
import { testApi } from '../../services/testApi';

const O  = '#ea580c';
const OL = '#fb923c';
const DK = '#111827';
const DM = '#1f2937';

const CARD_DARK = {
  background:   `linear-gradient(135deg, ${DK} 0%, ${DM} 100%)`,
  borderRadius: 20,
  padding:      '24px 24px 20px',
  boxShadow:    '0 4px 20px rgba(0,0,0,.22)',
  marginBottom: 16,
  marginLeft:   8,
  position:     'relative',
  overflow:     'hidden',
};

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default function RepasoPendienteWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction, setErrorMessage } = useAsyncAction();
  const { hasAccess, loading: planLoading } = useUserPlan();
  const [data, setData] = useState(null);
  const [hov, setHov] = useState(false);

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
    if (!temaId || totalPendientes < 1) { setErrorMessage('No tienes repaso pendiente hoy'); return; }
    const payload = { modo: 'repaso', temaId, numeroPreguntas: Math.min(20, Math.max(5, totalPendientes)), dificultad: 'mixto' };
    const test = await runAction(() => testApi.generate(token, payload));
    if (test) { sessionStorage.setItem('active_test', JSON.stringify(test)); navigate('/test'); }
  };

  if (!planLoading && !tienePro) {
    return (
      <div style={{ ...CARD_DARK, borderLeft: '4px solid #374151' }}>
        <div style={{ position: 'absolute', right: -16, top: -16, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          Repaso espaciado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 800, color: '#9ca3af', lineHeight: 1.35, marginBottom: 16 }}>
          <IconLock /> Disponible en plan Pro
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
          Repaso inteligente basado en tus fallos a lo largo del tiempo.
        </p>
        <button
          onClick={() => navigate('/planes')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: OL, border: `1.5px solid ${O}`, borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Desbloquear con Pro
        </button>
      </div>
    );
  }

  const pendientes = Number(data?.totalPendientes || 0);

  return (
    <div style={{ ...CARD_DARK, borderLeft: `4px solid ${pendientes > 0 ? O : '#374151'}` }}>
      <div style={{ position: 'absolute', right: -16, top: -16, width: 120, height: 120, borderRadius: '50%', background: `${O}10`, pointerEvents: 'none' }} />
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: pendientes > 0 ? OL : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        Repaso pendiente hoy
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 16, maxWidth: 260 }}>
        {pendientes > 0
          ? `${pendientes} preguntas listas para repasar`
          : 'Sin repaso pendiente hoy'}
      </div>
      <button
        disabled={!pendientes || isLoading}
        onClick={onStart}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background:   !pendientes ? 'rgba(255,255,255,.08)' : hov ? '#c2410c' : O,
          color:        !pendientes ? '#6b7280' : '#fff',
          border:       'none',
          borderRadius: 10,
          padding:      '10px 22px',
          fontWeight:   800,
          fontSize:     '0.88rem',
          cursor:       (!pendientes || isLoading) ? 'not-allowed' : 'pointer',
          opacity:      (!pendientes || isLoading) ? 0.6 : 1,
          boxShadow:    pendientes ? `0 4px 14px ${O}40` : 'none',
          transition:   'all .15s',
        }}
      >
        <IconPlay /> {isLoading ? 'Generando...' : 'Empezar repaso'}
      </button>
    </div>
  );
}