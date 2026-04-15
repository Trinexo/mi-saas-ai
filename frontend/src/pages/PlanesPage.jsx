import { useEffect, useState } from 'react';
import { subscriptionApi } from '../services/subscriptionApi';
import { useAuth } from '../state/auth';

const PLANES = [
  {
    key: 'free',
    nombre: 'Gratuito',
    precio: '0€',
    periodo: 'para siempre',
    badge: null,
    highlight: false,
    accentColor: '#6b7280',
    bg: '#fff',
    border: '#e5e7eb',
    features: [
      { text: 'Acceso a 100 preguntas de muestra', ok: true },
      { text: 'Tests de hasta 10 preguntas', ok: true },
      { text: 'Historial de los últimos 5 tests', ok: true },
      { text: 'Repetición espaciada', ok: false },
      { text: 'Simulacros de examen', ok: false },
    ],
    cta: 'Empezar gratis',
    ctaBg: '#f3f4f6',
    ctaColor: '#374151',
  },
  {
    key: 'pro',
    nombre: 'Pro',
    precio: '9,99€',
    periodo: 'mes',
    badge: '⭐ Más popular',
    highlight: true,
    accentColor: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
    features: [
      { text: 'Banco de preguntas completo', ok: true },
      { text: 'Tests ilimitados por materia y tema', ok: true },
      { text: 'Simulacros cronometrados', ok: true },
      { text: 'Repetición espaciada inteligente', ok: true },
      { text: 'Historial y estadísticas completas', ok: true },
      { text: 'Refuerzo de preguntas falladas', ok: true },
    ],
    cta: 'Empezar con Pro',
    ctaBg: '#1d4ed8',
    ctaColor: '#fff',
  },
  {
    key: 'elite',
    nombre: 'Elite',
    precio: '19,99€',
    periodo: 'mes',
    badge: '🏆 Máximo rendimiento',
    highlight: false,
    accentColor: '#b45309',
    bg: '#fffbeb',
    border: '#fcd34d',
    features: [
      { text: 'Todo lo incluido en Pro', ok: true },
      { text: 'Aprendizaje adaptativo avanzado', ok: true },
      { text: 'Analíticas de rendimiento detalladas', ok: true },
      { text: 'Soporte prioritario', ok: true },
      { text: 'Acceso anticipado a nuevas oposiciones', ok: true },
      { text: 'Exportación de resultados en PDF', ok: true },
    ],
    cta: 'Empezar con Elite',
    ctaBg: '#b45309',
    ctaColor: '#fff',
  },
];

const GARANTIAS = [
  { icon: '🔓', label: 'Sin permanencia', desc: 'Cancela en cualquier momento sin coste.' },
  { icon: '🔒', label: 'Pago seguro', desc: 'Procesado mediante Stripe con cifrado SSL.' },
  { icon: '↩️', label: '7 días de prueba', desc: 'Reembolso completo si no estás satisfecho.' },
];

export default function PlanesPage() {
  const { token } = useAuth();
  const [planActual, setPlanActual] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    subscriptionApi.getMyPlan(token)
      .then((res) => setPlanActual(res?.data?.planActual ?? 'free'))
      .catch(() => setPlanActual('free'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-block', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', marginBottom: 12 }}>
          Planes y precios
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
          Elige el plan para tu oposición
        </h2>
        <p style={{ margin: '0 auto', color: '#6b7280', fontSize: '0.95rem', maxWidth: 480 }}>
          Accede al banco de preguntas, simulacros y aprendizaje adaptativo. Sin permanencia.
        </p>
        {!loading && planActual && (
          <div style={{ marginTop: 14, fontSize: '0.85rem', color: '#374151' }}>
            Tu plan actual: <strong style={{ color: '#1d4ed8', textTransform: 'capitalize' }}>{planActual}</strong>
          </div>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {PLANES.map((plan) => {
          const esPlanActual = !loading && planActual === plan.key;
          return (
            <div
              key={plan.nombre}
              style={{
                background: plan.bg,
                border: esPlanActual ? `2px solid ${plan.accentColor}` : `2px solid ${plan.border}`,
                borderRadius: 16,
                padding: '32px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.highlight
                  ? '0 8px 32px rgba(29,78,216,.18)'
                  : '0 1px 4px rgba(0,0,0,.06)',
                transform: plan.highlight ? 'scale(1.03)' : 'none',
                zIndex: plan.highlight ? 1 : 0,
              }}
            >
              {/* Badge de plan actual (tiene prioridad sobre badge de marketing) */}
              {esPlanActual ? (
                <div style={{
                  position: 'absolute',
                  top: -15,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.accentColor,
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 16px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.03em',
                }}>Tu plan actual</div>
              ) : plan.badge ? (
                <div style={{
                  position: 'absolute',
                  top: -15,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.accentColor,
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 16px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.03em',
                }}>{plan.badge}</div>
              ) : null}

              {/* Nombre + precio */}
              <div style={{ color: plan.accentColor, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.nombre}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{plan.precio}</span>
                {plan.periodo !== 'para siempre'
                  ? <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>/ {plan.periodo}</span>
                  : <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>para siempre</span>}
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '14px 0 16px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9, flexGrow: 1 }}>
                {plan.features.map((f) => (
                  <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: f.ok ? '#374151' : '#9ca3af' }}>
                    <span style={{ color: f.ok ? '#16a34a' : '#d1d5db', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{f.ok ? '✓' : '✕'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {esPlanActual ? (
                <div style={{
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: 8,
                  padding: '11px 0',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textAlign: 'center',
                }}>
                  Plan activo
                </div>
              ) : (
                <button
                  style={{
                    background: plan.ctaBg,
                    color: plan.ctaColor,
                    border: 'none',
                    borderRadius: 8,
                    padding: '11px 0',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    width: '100%',
                    letterSpacing: '0.01em',
                  }}
                  onClick={() => alert('La integración con pagos estará disponible próximamente.')}
                >
                  {plan.cta} →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Garantías */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: 40, padding: '20px 24px', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        {GARANTIAS.map((g) => (
          <div key={g.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{g.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{g.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{g.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', marginTop: 20 }}>
        Precios sin IVA. Renovación automática. Cancela en cualquier momento.
      </p>
    </div>
  );
}
