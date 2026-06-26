import { useLocation, useNavigate } from 'react-router-dom';
import GenerarTestForm from '../components/forms/GenerarTestForm';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';

export default function ConfigurarTestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const modoSugerido = location.state?.modoSugerido ?? null;
  const { tieneAlgunAcceso, loading } = useUserAccesos();
  const { oposicionActiva } = useOposicionActiva();
  const isAlbacer = oposicionActiva?.modoPreparacion === 'albacer';

  // Usuario free: puede ver la página pero no puede crear tests
  const esFree = !loading && !tieneAlgunAcceso;

  if (isAlbacer) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Modo Albacer
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 900, color: '#111827' }}>
            El generador libre no esta disponible
          </h2>
          <p style={{ margin: '0 0 18px', color: '#6b7280', lineHeight: 1.6 }}>
            En esta oposicion los tests y simulacros se realizan desde los modulos Albacer para mantener separado el progreso del plan de estudio.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ border: 'none', background: '#6d28d9', color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 800, cursor: 'pointer' }}
          >
            Ver modulos Albacer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>Crear nuevo test personalizado</h2>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>Configura los criterios de tu test y practica exactamente lo que necesitas</p>
      </div>

      {esFree && (
        <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>Plan gratuito — modo vista previa</div>
            <div style={{ fontSize: '0.82rem', color: '#b45309', marginTop: 2 }}>Para crear tests personalizados necesitas comprar acceso a una oposición.</div>
          </div>
          <button
            onClick={() => navigate('/planes')}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#d97706', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0 }}
          >
            Ver planes →
          </button>
        </div>
      )}

      <div style={esFree ? { pointerEvents: 'none', opacity: 0.55, userSelect: 'none' } : {}}>
        <GenerarTestForm modoSugerido={modoSugerido} />
      </div>
    </div>
  );
}
