export default function TemaMaestriaBar({ tema }) {
  const color = tema.dominio >= 70 ? '#22c55e' : tema.dominio >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Dominio</span>
        <span style={{ fontWeight: 800, fontSize: 22, color }}>{tema.dominio}%</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 999, height: 12, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${Math.min(tema.dominio, 100)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        {tema.dominadas} de {tema.totalPreguntas} preguntas dominadas
      </span>
    </div>
  );
}
