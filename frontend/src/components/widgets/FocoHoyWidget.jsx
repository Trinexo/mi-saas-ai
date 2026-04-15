import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { testApi } from '../../services/testApi';

const O  = '#ea580c';
const OL = '#fb923c';
const DK = '#111827';
const DM = '#1f2937';

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

export default function FocoHoyWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction } = useAsyncAction();
  const [data, setData] = useState(null);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    testApi.getFocoHoy(token)
      .then(setData)
      .catch(() => setData({ modo: 'adaptativo', temaId: null, numeroPreguntas: 10, motivo: 'Activa tu sesion con 10 preguntas' }));
  }, [token]);

  const onStart = async () => {
    const foco = data;
    if (!foco) return;
    const payload = { modo: 'adaptativo', numeroPreguntas: Number(foco.numeroPreguntas || 10), dificultad: 'mixto' };
    if (foco.temasMix?.length > 0) payload.temasMix = foco.temasMix;
    else if (foco.temaId) payload.temaId = Number(foco.temaId);
    else if (foco.oposicionId) payload.oposicionId = Number(foco.oposicionId);
    const test = await runAction(() => testApi.generate(token, payload));
    if (test) { sessionStorage.setItem('active_test', JSON.stringify(test)); navigate('/test'); }
  };

  return (
    <div style={{
      background:   `linear-gradient(135deg, ${DK} 0%, ${DM} 100%)`,
      borderRadius: 20,
      padding:      '24px 24px 20px',
      boxShadow:    '0 4px 20px rgba(0,0,0,.22)',
      marginBottom: 16,
      marginRight:  8,
      borderLeft:   `4px solid ${O}`,
      position:     'relative',
      overflow:     'hidden',
    }}>
      <div style={{ position: 'absolute', right: -16, top: -16, width: 120, height: 120, borderRadius: '50%', background: `${O}10`, pointerEvents: 'none' }} />
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: OL, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        Foco de hoy
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 16, maxWidth: 280 }}>
        {data?.motivo || 'Activa tu sesion con 10 preguntas'}
      </div>
      <button
        disabled={isLoading}
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
          cursor:       isLoading ? 'not-allowed' : 'pointer',
          opacity:      isLoading ? 0.7 : 1,
          boxShadow:    `0 4px 14px ${O}40`,
          transition:   'all .15s',
        }}
      >
        <IconPlay /> {isLoading ? 'Generando...' : 'Empezar foco'}
      </button>
    </div>
  );
}


