import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { testApi } from '../../services/testApi';

function PctBar({ pct }) {
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

export default function ProgresoTemasSection() {
  const { token } = useAuth();
  const [progresoTemas, setProgresoTemas] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState('pct_asc');

  useEffect(() => {
    let cancelled = false;
    testApi.getProgresoTemas(token)
      .then((data) => { if (!cancelled) setProgresoTemas(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setProgresoTemas([]); });
    return () => { cancelled = true; };
  }, [token]);

  const oposicionesUnicas = [...new Set((progresoTemas ?? []).map((t) => t.oposicionNombre))];

  const temasFiltrados = [...(progresoTemas ?? [])]
    .filter((t) => !filtro || t.oposicionNombre === filtro)
    .sort((a, b) => {
      const pA = Number(a.porcentajeAcierto ?? 0);
      const pB = Number(b.porcentajeAcierto ?? 0);
      if (orden === 'pct_asc') return pA - pB;
      if (orden === 'pct_desc') return pB - pA;
      return Number(b.totalRespondidas ?? 0) - Number(a.totalRespondidas ?? 0);
    });

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Progreso por tema</h2>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{temasFiltrados.length} temas</span>
      </div>
      <p style={{ color: '#64748b', margin: '4px 0 12px', fontSize: 13 }}>
        Porcentaje de acierto acumulado en cada tema practicado.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151' }}
        >
          <option value="">Todas las oposiciones</option>
          {oposicionesUnicas.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151' }}
        >
          <option value="pct_asc">Peor primero (a reforzar)</option>
          <option value="pct_desc">Mejor primero</option>
          <option value="actividad">M\u00e1s practicado</option>
        </select>
      </div>

      {progresoTemas === null ? (
        <p style={{ color: '#94a3b8' }}>Cargando progreso...</p>
      ) : progresoTemas.length === 0 ? (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>A\u00fan no tienes progreso registrado. Completa algunos tests para ver tus estad\u00edsticas por tema.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {temasFiltrados.map((t) => {
            const pct = Number(t.porcentajeAcierto ?? 0);
            return (
              <div key={t.temaId} style={{
                background: '#fff', borderRadius: 10, padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 16px', alignItems: 'center',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <Link to={`/tema/${t.temaId}`} style={{ fontWeight: 600, fontSize: 14, color: '#111827', textDecoration: 'none' }}>{t.temaNombre}</Link>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>&rsaquo;</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{t.materiaNombre}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>&rsaquo;</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.oposicionNombre}</span>
                  </div>
                  <PctBar pct={pct} />
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.aciertos}A &middot; {t.errores}E &middot; {t.blancos ?? 0}B</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.totalRespondidas} respondidas</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
