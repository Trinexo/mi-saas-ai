export default function OposicionStatsGrid({ resumen }) {
  const stats = [
    { label: 'Temas totales', value: resumen.totalTemas },
    { label: 'Temas practicados', value: resumen.temasPracticados },
    { label: 'Preguntas respondidas', value: resumen.totalRespondidas },
    { label: 'Tests realizados', value: resumen.testsRealizados },
    { label: '% Acierto medio', value: `${resumen.porcentajeAcierto}%` },
    { label: 'Nota media', value: resumen.notaMedia.toFixed(2) },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
      {stats.map(({ label, value }) => (
        <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '20px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>{value}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
