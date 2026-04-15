import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { catalogApi } from '../services/catalogApi';
import { billingApi } from '../services/billingApi';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { useUserPlan } from '../hooks/useUserPlan';

const CARD = {
  background: '#fff',
  borderRadius: 14,
  padding: '22px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  position: 'relative',
};

export default function CatalogoPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { tieneAcceso, loading: loadingAccesos } = useUserAccesos();
  const { plan } = useUserPlan();
  const [oposiciones, setOposiciones] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [comprando, setComprando] = useState(null); // oposicionId en proceso de pago

  const onComprar = async (oposicionId) => {
    if (!token) { navigate('/login'); return; }
    setComprando(oposicionId);
    try {
      const res = await billingApi.crearCheckout(token, oposicionId);
      const url = res?.url;
      if (url) {
        window.location.href = url;
      } else {
        alert('No se pudo iniciar el proceso de pago. Inténtalo de nuevo.');
      }
    } catch {
      alert('Error al iniciar el pago. Inténtalo de nuevo.');
    } finally {
      setComprando(null);
    }
  };

  useEffect(() => {
    catalogApi.getOposiciones()
      .then((data) => setOposiciones(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => setOposiciones([]))
      .finally(() => setLoadingCatalogo(false));
  }, []);

  const loading = loadingCatalogo || loadingAccesos;

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando catálogo…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Catálogo de cursos</h2>
        <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
          Compra acceso al banco de preguntas de la oposición que quieres preparar. Con cualquier curso obtienes acceso completo a sus preguntas; las funcionalidades avanzadas (simulacros, repaso espaciado, refuerzo) dependen de tu plan.
        </p>
      </div>

      {/* Banner plan */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.85rem', color: '#374151' }}>
          Tu plan actual: <strong style={{ textTransform: 'capitalize', color: plan === 'elite' ? '#b45309' : plan === 'pro' ? '#1d4ed8' : '#6b7280' }}>{plan === 'elite' ? '🏆 Elite' : plan === 'pro' ? '⭐ Pro' : '◯ Gratuito'}</strong>
          {plan === 'free' && <span style={{ color: '#6b7280', marginLeft: 8 }}>— Puedes hacer tests de demo de cualquier oposición</span>}
          {plan === 'pro' && <span style={{ color: '#6b7280', marginLeft: 8 }}>— Simulacros, repaso y refuerzo incluidos</span>}
          {plan === 'elite' && <span style={{ color: '#6b7280', marginLeft: 8 }}>— Todas las funcionalidades incluidas</span>}
        </div>
        {plan === 'free' && (
          <button
            onClick={() => navigate('/planes')}
            style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}
          >
            Ver planes →
          </button>
        )}
      </div>

      {/* Grid de oposiciones */}
      {oposiciones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📚</div>
          <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>No hay oposiciones disponibles en este momento</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {oposiciones.map((op) => {
            const comprado = tieneAcceso(op.id);
            return (
              <div key={op.id} style={CARD}>
                {/* Badge estado */}
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  {comprado ? (
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                      ✓ Acceso activo
                    </span>
                  ) : (
                    <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                      Demo disponible
                    </span>
                  )}
                </div>

                {/* Icono + nombre */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: comprado ? '#eff6ff' : '#f9fafb', border: `1px solid ${comprado ? '#bfdbfe' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    📋
                  </div>
                  <div style={{ flex: 1, paddingRight: 80 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', lineHeight: 1.3 }}>{op.nombre}</div>
                    {op.descripcion && (
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>{op.descripcion}</div>
                    )}
                  </div>
                </div>

                {/* Lo que incluye */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem' }}>
                  <div style={{ color: comprado ? '#374151' : '#9ca3af', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: comprado ? '#16a34a' : '#d1d5db', fontWeight: 700 }}>{comprado ? '✓' : '✕'}</span>
                    Banco de preguntas completo
                  </div>
                  <div style={{ color: '#374151', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                    <span style={{ color: '#6b7280' }}>Tests de demo (10 preguntas)</span>
                  </div>
                  <div style={{ color: plan !== 'free' && comprado ? '#374151' : '#9ca3af', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: plan !== 'free' && comprado ? '#16a34a' : '#d1d5db', fontWeight: 700 }}>{plan !== 'free' && comprado ? '✓' : '✕'}</span>
                    Simulacros, repaso y refuerzo (requiere plan)
                  </div>
                </div>

                {/* CTA */}
                {comprado ? (
                  <button
                    onClick={() => navigate('/', { state: { oposicionId: op.id } })}
                    style={{ marginTop: 4, padding: '9px 0', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
                  >
                    ▷ Practicar ahora
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => navigate('/', { state: { oposicionId: op.id } })}
                      style={{ padding: '8px 0', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', width: '100%' }}
                    >
                      Probar demo (10 preguntas)
                    </button>
                    <button
                      onClick={() => onComprar(op.id)}
                      disabled={comprando === op.id}
                      style={{ padding: '9px 0', borderRadius: 8, border: 'none', background: comprando === op.id ? '#9ca3af' : '#111827', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: comprando === op.id ? 'not-allowed' : 'pointer', width: '100%' }}
                    >
                      {comprando === op.id ? 'Redirigiendo…' : 'Comprar acceso completo →'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Nota aclaratoria */}
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', marginTop: 32 }}>
        El acceso a cada curso es independiente del plan. Una vez comprado, tienes el banco de preguntas completo de esa oposición. Las funcionalidades de aprendizaje avanzado (simulacros, repaso espaciado, refuerzo) requieren adicionalmente un plan Pro o Elite.
      </p>
    </div>
  );
}
