const PLANES = [
  {
    nombre: 'Gratuito',
    precio: '0€',
    periodo: 'para siempre',
    badge: null,
    color: '#6b7280',
    bg: 'white',
    border: '#e5e7eb',
    features: [
      'Acceso a 100 preguntas de muestra',
      'Genera tests de hasta 10 preguntas',
      'Historial de los ultimos 5 tests',
      'Sin repeticion espaciada',
    ],
    cta: 'Empezar gratis',
    ctaBg: '#f3f4f6',
    ctaColor: '#374151',
  },
  {
    nombre: 'Pro',
    precio: '9,99€',
    periodo: 'mes',
    badge: 'Mas popular',
    color: '#4f46e5',
    bg: '#faf5ff',
    border: '#a78bfa',
    features: [
      'Acceso completo al banco de preguntas',
      'Tests ilimitados por materia y tema',
      'Simulacros de examen cronometrados',
      'Repeticion espaciada inteligente',
      'Historial y estadisticas completas',
      'Refuerzo de preguntas falladas',
    ],
    cta: 'Empezar con Pro',
    ctaBg: '#4f46e5',
    ctaColor: 'white',
  },
  {
    nombre: 'Elite',
    precio: '19,99€',
    periodo: 'mes',
    badge: 'Maximo rendimiento',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fcd34d',
    features: [
      'Todo lo incluido en Pro',
      'Aprendizaje adaptativo avanzado',
      'Analiticas de rendimiento detalladas',
      'Soporte prioritario',
      'Acceso anticipado a nuevas oposiciones',
      'Exportacion de resultados en PDF',
    ],
    cta: 'Empezar con Elite',
    ctaBg: '#b45309',
    ctaColor: 'white',
  },
];

export default function PlanesPage() {
  return (
    <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>Elige tu plan</h2>
        <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '0.95rem' }}>Accede al banco de preguntas que necesitas para superar tu oposicion</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
        {PLANES.map((plan) => (
          <div
            key={plan.nombre}
            style={{
              background: plan.bg,
              border: `2px solid ${plan.border}`,
              borderRadius: 16,
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              position: 'relative',
            }}
          >
            {plan.badge && (
              <div style={{
                position: 'absolute',
                top: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: plan.color,
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '4px 14px',
                borderRadius: 20,
                whiteSpace: 'nowrap',
              }}>{plan.badge}</div>
            )}
            <div style={{ color: plan.color, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{plan.nombre}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>{plan.precio}</span>
              {plan.periodo !== 'para siempre' && <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>/ {plan.periodo}</span>}
              {plan.periodo === 'para siempre' && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>para siempre</span>}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#374151' }}>
                  <span style={{ color: plan.color, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              style={{
                marginTop: 'auto',
                background: plan.ctaBg,
                color: plan.ctaColor,
                border: 'none',
                borderRadius: 8,
                padding: '10px 0',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                width: '100%',
              }}
              onClick={() => alert('Proximamente disponible')}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: 32 }}>
        Precios sin IVA. Puedes cancelar en cualquier momento.
      </p>
    </div>
  );
}
