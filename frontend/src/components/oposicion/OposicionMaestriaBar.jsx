export default function OposicionMaestriaBar({ resumen }) {
  const color = resumen.dominio >= 70 ? '#22c55e' : resumen.dominio >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Dominio</span>
        <span style={{ fontWeight: 800, fontSize: 22, color }}>{resumen.dominio}%</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 999, height: 12, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${Math.min(resumen.dominio, 100)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        {resumen.dominadas} de {resumen.totalPreguntas} preguntas dominadas
      </span>
    </div>
  );
}
