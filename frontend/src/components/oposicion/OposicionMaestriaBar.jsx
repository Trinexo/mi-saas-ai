export default function OposicionMaestriaBar({ resumen }) {
  const maestriaColor = resumen.maestria >= 70 ? '#22c55e' : resumen.maestria >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Maestría global</span>
        <span style={{ fontWeight: 800, fontSize: 22, color: maestriaColor }}>{resumen.maestria}%</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 999, height: 14, overflow: 'hidden' }}>
        <div style={{ width: `${resumen.maestria}%`, height: '100%', background: maestriaColor, borderRadius: 999, transition: 'width .4s' }} />
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
        {resumen.temasPracticados} de {resumen.totalTemas} temas practicados
      </p>
    </section>
  );
}
