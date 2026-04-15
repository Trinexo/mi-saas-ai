import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { authApi } from '../../services/authApi';
import { catalogApi } from '../../services/catalogApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, borderLeft: '4px solid #f59e0b' };

export default function ConfigurarOposicionWidget() {
  const { token, refreshUser } = useAuth();
  const [oposiciones, setOposiciones] = useState([]);
  const [selectorId, setSelectorId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
  }, []);

  const onGuardar = async () => {
    if (!selectorId) return;
    setSaving(true);
    try {
      const res = await authApi.patchOposicionPreferida(token, Number(selectorId));
      if (res?.data) refreshUser(res.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={SECTION}>
      <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Configura tu oposición</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Selecciona la oposición a la que te preparas para personalizar tu experiencia.</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
        <select
          value={selectorId}
          onChange={(e) => setSelectorId(e.target.value)}
          disabled={saving || oposiciones.length === 0}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, color: '#374151', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">-- Selecciona oposición --</option>
          {oposiciones.map((op) => (
            <option key={op.id} value={String(op.id)}>{op.nombre}</option>
          ))}
        </select>
        <button
          onClick={onGuardar}
          disabled={saving || !selectorId}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (saving || !selectorId) ? 'not-allowed' : 'pointer', opacity: (saving || !selectorId) ? 0.5 : 1 }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
