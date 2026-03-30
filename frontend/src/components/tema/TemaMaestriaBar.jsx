export default function TemaMaestriaBar({ tema }) {
  const maestriaColor = tema.maestria >= 70 ? '#22c55e' : tema.maestria >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Maestría</span>
        <span style={{ fontWeight: 800, fontSize: 20, color: maestriaColor }}>{tema.maestria}%</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 999, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${tema.maestria}%`, height: '100%', background: maestriaColor, borderRadius: 999, transition: 'width .4s' }} />
      </div>
      {tema.ultimaPractica && (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
          Última práctica: {new Date(tema.ultimaPractica).toLocaleDateString('es-ES')}
        </p>
      )}
    </section>
  );
}
