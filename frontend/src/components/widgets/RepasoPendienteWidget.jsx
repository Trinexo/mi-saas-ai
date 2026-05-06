import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MIN_PENDIENTES = 5;

export default function RepasoPendienteWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { hasAccess, loading: planLoading } = useUserPlan();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [hov, setHov]         = useState(false);

  const tienePro = hasAccess('pro');

  useEffect(() => {
    if (planLoading || !tienePro) return;
    testApi.getRepasoPendientes(token, 20)
      .then(setData)
      .catch(() => setData({ totalPendientes: 0, temaIdSugerido: null, items: [] }));
  }, [token, tienePro, planLoading]);

  const onStart = async () => {
    setLoading(true);
    try {
      const payload = {
        modo: 'repaso',
        numeroPreguntas: Math.min(20, Number(data?.totalPendientes || 0)),
        dificultad: 'mixto',
      };
      const test = await testApi.generate(token, payload);
      if (test) {
        sessionStorage.setItem('active_test', JSON.stringify(test));
        navigate('/test');
      }
    } catch {
      // Si falla, refrescar pendientes para que el widget se auto-desactive
      testApi.getRepasoPendientes(token, 20)
        .then(setData)
        .catch(() => setData({ totalPendientes: 0, temaIdSugerido: null, items: [] }));
    } finally {
      setLoading(false);
    }
  };

  // --- Estado: plan insuficiente ---
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
  const suficientes = pendientes >= MIN_PENDIENTES;

  // --- Estado: pocos datos (menos de 5 preguntas pendientes) ---
  if (data !== null && !suficientes) {
    return (
      <div style={{ ...CARD_DARK, borderLeft: '4px solid #374151' }}>
        <div style={{ position: 'absolute', right: -16, top: -16, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
          Repaso pendiente hoy
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9ca3af', lineHeight: 1.35, marginBottom: 8 }}>
          {pendientes === 0 ? 'Sin repaso pendiente hoy' : `Solo ${pendientes} pregunta${pendientes > 1 ? 's' : ''} pendiente`}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 14px', lineHeight: 1.5 }}>
          Completa mas tests para que el repaso espaciado se active automaticamente.
        </p>
        <button
          disabled
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.06)', color: '#4b5563', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 800, fontSize: '0.88rem', cursor: 'not-allowed' }}
        >
          <IconLock /> Empezar repaso
        </button>
      </div>
    );
  }

  // --- Estado: activo (suficientes pendientes) ---
  return (
    <div style={{ ...CARD_DARK, borderLeft: `4px solid ${suficientes ? O : '#374151'}` }}>
      <div style={{ position: 'absolute', right: -16, top: -16, width: 120, height: 120, borderRadius: '50%', background: `${O}10`, pointerEvents: 'none' }} />
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: OL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        Repaso pendiente hoy
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 16, maxWidth: 260 }}>
        {pendientes} preguntas listas para repasar
      </div>
      <button
        disabled={loading}
        onClick={onStart}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background:   hov ? '#c2410c' : O,
          color:        '#fff',
          border:       'none',
          borderRadius: 10,
          padding:      '10px 22px',
          fontWeight:   800,
          fontSize:     '0.88rem',
          cursor:       loading ? 'not-allowed' : 'pointer',
          opacity:      loading ? 0.7 : 1,
          boxShadow:    `0 4px 14px ${O}40`,
          transition:   'all .15s',
        }}
      >
        <IconPlay /> {loading ? 'Generando...' : 'Empezar repaso'}
      </button>
    </div>
  );
}