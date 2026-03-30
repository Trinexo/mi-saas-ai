function formatDate(isoDate) {
  if (!isoDate) return null;
  return new Date(isoDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OposicionCard({ op, onNavigate, onPracticar }) {
  const color = op.maestria >= 70 ? '#22c55e' : op.maestria >= 40 ? '#f59e0b' : '#ef4444';
  const pctAcierto = op.respondidas > 0 ? Math.round((op.aciertos / op.respondidas) * 100) : 0;

  return (
    <div
      style={{ background: '#fff', borderRadius: 14, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', cursor: 'pointer', transition: 'box-shadow .15s' }}
      onClick={() => onNavigate(op.oposicionId)}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.08)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{op.nombre}</h2>
          {op.ultimaPractica && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Última práctica: {formatDate(op.ultimaPractica)}
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPracticar(op.oposicionId); }}
          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
        >
          Practicar
        </button>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Maestría</span>
          <span style={{ fontSize: 16, fontWeight: 800, color }}>{op.maestria}%</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${op.maestria}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Preguntas respondidas', value: `${op.respondidas} / ${op.totalPreguntas}` },
          { label: '% Acierto', value: `${pctAcierto}%` },
          { label: 'Tests realizados', value: op.testsRealizados },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#334155' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
