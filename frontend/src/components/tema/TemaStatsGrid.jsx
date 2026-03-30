export default function TemaStatsGrid({ tema }) {
  const stats = [
    { label: 'Preguntas totales', value: tema.totalPreguntas },
    { label: 'Respondidas', value: tema.respondidas },
    { label: 'Aciertos', value: tema.aciertos, color: '#22c55e' },
    { label: 'Errores', value: tema.errores, color: '#ef4444' },
    { label: '% Acierto', value: `${tema.porcentajeAcierto}%` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
      {stats.map(({ label, value, color }) => (
        <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: color || '#1e293b' }}>{value}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
