import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useUserPlan } from '../../hooks/useUserPlan';
import { testApi } from '../../services/testApi';

const O  = '#ea580c';
const OL = '#fb923c';
const DK = '#111827';
const DM = '#1f2937';

export default function TemasDebilesWidget() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { hasAccess } = useUserPlan();
  const [data, setData] = useState([]);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    testApi.getTemasDebiles(token)
      .then((d) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  }, [token]);

  const onRefuerzo = () => {
    const top = data[0];
    if (!top?.temaId) return;
    navigate('/configurar-test', { state: { oposicionId: top.oposicionId, materiaId: top.materiaId, temaId: top.temaId } });
  };

  const top = data[0];
  const pct = top ? Number(top.porcentajeAcierto) : null;

  return (
    <div style={{
      background:   `linear-gradient(135deg, ${DK} 0%, ${DM} 100%)`,
      borderRadius: 20,
      padding:      '24px 28px 20px',
      boxShadow:    '0 4px 20px rgba(0,0,0,.22)',
      marginBottom: 16,
      borderLeft:   `4px solid ${top ? O : '#374151'}`,
      position:     'relative',
      overflow:     'hidden',
    }}>
      <div style={{ position: 'absolute', right: -20, top: -20, width: 150, height: 150, borderRadius: '50%', background: `${O}0D`, pointerEvents: 'none' }} />

      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: top ? OL : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        Tema a reforzar
      </div>

      {top ? (
        <>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 8, maxWidth: 500 }}>
            {top.temaNombre}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ background: 'rgba(255,255,255,.08)', color: '#d1d5db', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{top.materiaNombre}</span>
            <span style={{ background: 'rgba(255,255,255,.08)', color: '#d1d5db', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>{top.oposicionNombre}</span>
            <span style={{
              background: pct < 50 ? 'rgba(220,38,38,.2)' : 'rgba(234,88,12,.18)',
              color:      pct < 50 ? '#fca5a5' : OL,
              padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
            }}>
              {pct}% acierto Â· {top.aciertos}A / {top.errores}E
            </span>
          </div>
          <button
            disabled={!top?.temaId}
            onClick={onRefuerzo}
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
              cursor:       top?.temaId ? 'pointer' : 'not-allowed',
              boxShadow:    `0 4px 14px ${O}40`,
              transition:   'all .15s',
            }}
          >
            â–· Practicar este tema
          </button>
          {!hasAccess('pro') && (
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 10 }}>
              ðŸ”’ Modo refuerzo automÃ¡tico requiere Pro
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: 4 }}>
          AÃºn no hay datos suficientes para identificar un tema dÃ©bil.
        </div>
      )}
    </div>
  );
}


