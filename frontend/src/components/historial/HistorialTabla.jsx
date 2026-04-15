import { Link } from 'react-router-dom';

const MODO_LABEL = {
  adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso',
  marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo',
};
const MODO_COLOR = {
  adaptativo: { bg: '#ede9fe', color: '#6d28d9' },
  normal: { bg: '#dbeafe', color: '#1d4ed8' },
  repaso: { bg: '#fef9c3', color: '#854d0e' },
  marcadas: { bg: '#fce7f3', color: '#9d174d' },
  simulacro: { bg: '#fee2e2', color: '#991b1b' },
  refuerzo: { bg: '#dcfce7', color: '#166534' },
};

function NotaBadge({ nota }) {
  const n = Number(nota ?? 0);
  const ok = n >= 5;
  return (
    <span style={{
      fontWeight: 800, fontSize: 16,
      color: ok ? '#16a34a' : '#dc2626',
    }}>
      {n.toFixed(2)}
    </span>
  );
}

function ModoBadge({ modo }) {
  const cfg = MODO_COLOR[modo] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999, fontSize: 11,
      fontWeight: 700, background: cfg.bg, color: cfg.color,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {MODO_LABEL[modo] ?? modo}
    </span>
  );
}

const BTN_SECONDARY = {
  padding: '5px 12px', borderRadius: 7, border: '1px solid #e5e7eb',
  background: '#fff', color: '#374151', fontWeight: 600, fontSize: 12, cursor: 'pointer',
};
const BTN_LINK = {
  padding: '5px 12px', borderRadius: 7, border: 'none',
  background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 12,
  cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
};

export default function HistorialTabla({ itemsOrdenados, onReintentar }) {
  if (itemsOrdenados.length === 0) {
    return <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>No hay tests con los filtros activos.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      {itemsOrdenados.map((t) => {
        const total = Number(t.aciertos ?? 0) + Number(t.errores ?? 0) + Number(t.blancos ?? 0);
        const pct = total > 0 ? Math.round((Number(t.aciertos ?? 0) / total) * 100) : 0;
        const mins = t.tiempoSegundos ? Math.round(Number(t.tiempoSegundos) / 60) : null;
        return (
          <div key={t.id} style={{
            background: '#fff', borderRadius: 12, padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,.07)',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            {/* Nota */}
            <div style={{ minWidth: 52, textAlign: 'center' }}>
              <NotaBadge nota={t.nota} />
            </div>

            {/* Info principal */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                <ModoBadge modo={t.tipoTest} />
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {mins !== null && (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{mins} min</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#111827', fontWeight: 500 }}>
                {t.oposicionNombre ? (
                  <Link to={`/oposicion/${t.oposicionId}`} style={{ color: '#64748b', textDecoration: 'none' }}>{t.oposicionNombre}</Link>
                ) : null}
                {t.materiaNombre ? <span style={{ color: '#94a3b8' }}> &rsaquo; {t.materiaNombre}</span> : null}
                {t.temaId ? (
                  <> &rsaquo; <Link to={`/tema/${t.temaId}`} style={{ color: '#374151', fontWeight: 600, textDecoration: 'none' }}>{t.temaNombre}</Link></>
                ) : (t.temaNombre ? <span> &rsaquo; {t.temaNombre}</span> : null)}
              </p>
            </div>

            {/* Resultado */}
            <div style={{ fontSize: 13, color: '#475569', minWidth: 140, textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{t.aciertos}A</span>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>{t.errores}E</span>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{t.blancos}B</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', width: 120, margin: '0 auto' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 50 ? '#22c55e' : '#ef4444', borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}% acierto</span>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Link to={`/revision/${t.id}`} style={BTN_LINK}>Revisar</Link>
              <button onClick={() => onReintentar(t.id)} style={BTN_SECONDARY}>Repetir</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
