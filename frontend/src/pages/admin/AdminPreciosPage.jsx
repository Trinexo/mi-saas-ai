import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { catalogApi } from '../../services/catalogApi';
import { adminApi } from '../../services/adminApi';

const CARD = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };
const INPUT = { padding: '7px 10px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: '0.875rem', width: 110 };
const BTN = { padding: '7px 16px', borderRadius: 7, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' };

export default function AdminPreciosPage() {
  const { token } = useAuth();
  const [oposiciones, setOposiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [precios, setPrecios] = useState({}); // { [id]: precioEuros }
  const [guardando, setGuardando] = useState({}); // { [id]: bool }
  const [mensajes, setMensajes] = useState({}); // { [id]: string }

  useEffect(() => {
    catalogApi
      .getOposiciones()
      .then((data) => {
        const items = Array.isArray(data) ? data : (data?.data ?? []);
        setOposiciones(items);
        // Inicializar precios con centavos → euros
        const init = {};
        items.forEach((op) => {
          init[op.id] = op.precio_mensual_cents != null ? (op.precio_mensual_cents / 100).toFixed(2) : '29.00';
        });
        setPrecios(init);
      })
      .catch(() => setOposiciones([]))
      .finally(() => setLoading(false));
  }, [token]);

  const onGuardar = async (oposicionId) => {
    const euros = parseFloat(precios[oposicionId]);
    if (isNaN(euros) || euros <= 0) {
      setMensajes((p) => ({ ...p, [oposicionId]: '❌ Precio inválido' }));
      return;
    }
    setGuardando((p) => ({ ...p, [oposicionId]: true }));
    try {
      await adminApi.setPrecioOposicion(token, oposicionId, euros);
      setMensajes((p) => ({ ...p, [oposicionId]: '✓ Guardado' }));
      setTimeout(() => setMensajes((p) => ({ ...p, [oposicionId]: '' })), 3000);
    } catch {
      setMensajes((p) => ({ ...p, [oposicionId]: '❌ Error al guardar' }));
    } finally {
      setGuardando((p) => ({ ...p, [oposicionId]: false }));
    }
  };

  if (loading) return <p style={{ color: '#6b7280' }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Precios por oposición</h1>
      <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: '#6b7280' }}>
        Configura el precio mensual (en euros) de cada oposición. Los usuarios pagarán este precio para obtener 30 días de acceso completo.
      </p>

      {oposiciones.length === 0 && (
        <p style={{ color: '#9ca3af' }}>No hay oposiciones en el catálogo.</p>
      )}

      {oposiciones.map((op) => (
        <div key={op.id} style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{op.nombre}</div>
              {op.descripcion && (
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{op.descripcion}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>€ / mes</span>
              <input
                type="number"
                min="0.50"
                step="0.50"
                style={INPUT}
                value={precios[op.id] ?? ''}
                onChange={(e) => setPrecios((p) => ({ ...p, [op.id]: e.target.value }))}
              />
              <button
                style={{ ...BTN, opacity: guardando[op.id] ? 0.6 : 1 }}
                disabled={guardando[op.id]}
                onClick={() => onGuardar(op.id)}
              >
                {guardando[op.id] ? '…' : 'Guardar'}
              </button>
              {mensajes[op.id] && (
                <span style={{ fontSize: '0.8rem', color: mensajes[op.id].startsWith('✓') ? '#16a34a' : '#dc2626' }}>
                  {mensajes[op.id]}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{ ...CARD, background: '#fffbeb', border: '1px solid #fcd34d', marginTop: 8 }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f' }}>
          <strong>Nota Stripe:</strong> Para que el pago funcione necesitas añadir <code>STRIPE_SECRET_KEY</code> y <code>STRIPE_WEBHOOK_SECRET</code> al fichero <code>backend/.env</code>. Obtén las claves en{' '}
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>dashboard.stripe.com/apikeys</a>.
        </p>
      </div>
    </div>
  );
}
