const ESTADO_CLASE = {
  correcta: 'review-option correct',
  incorrecta: 'review-option incorrect',
  elegida_blanco: 'review-option blank-chosen',
  neutra: 'review-option',
  correcta_no_elegida: 'review-option correct-missed',
};

function getOptionClass(opcion, respuestaUsuarioId, esCorrecta) {
  const esElegida = respuestaUsuarioId !== null && opcion.id === respuestaUsuarioId;
  const esLaCorrecta = opcion.correcta;

  if (esElegida && esCorrecta) return ESTADO_CLASE.correcta;
  if (esElegida && !esCorrecta) return ESTADO_CLASE.incorrecta;
  if (!esElegida && esLaCorrecta) return ESTADO_CLASE.correcta_no_elegida;
  return ESTADO_CLASE.neutra;
}

export default function ReviewPreguntaCard({ pregunta, idx, marcadas, reportadas, onToggleMarcada, onOpenReport }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, flex: 1, fontWeight: 500, fontSize: 14, color: '#1e293b' }}>
          <strong>{idx + 1}.</strong> {pregunta.enunciado}
        </p>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onToggleMarcada(pregunta.preguntaId)}
            title={marcadas.has(pregunta.preguntaId) ? 'Quitar marca' : 'Marcar para estudiar'}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            {marcadas.has(pregunta.preguntaId) ? '★' : '☆'}
          </button>
          <button
            onClick={() => onOpenReport(pregunta.preguntaId)}
            disabled={reportadas.has(pregunta.preguntaId)}
            title={reportadas.has(pregunta.preguntaId) ? '✓ Reportada' : 'Reportar pregunta errónea'}
            style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: reportadas.has(pregunta.preguntaId) ? 'default' : 'pointer', opacity: reportadas.has(pregunta.preguntaId) ? 0.4 : 1 }}
          >
            ⚑
          </button>
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pregunta.opciones.map((opcion) => {
          const cls = getOptionClass(opcion, pregunta.respuestaUsuarioId, pregunta.esCorrecta);
          const bg = cls === 'review-option correcta' || cls === 'review-option correcta_no_elegida'
            ? '#f0fdf4' : cls === 'review-option incorrecta' ? '#fef2f2' : '#f8fafc';
          const border = cls === 'review-option correcta' || cls === 'review-option correcta_no_elegida'
            ? '1px solid #bbf7d0' : cls === 'review-option incorrecta' ? '1px solid #fecaca' : '1px solid #e2e8f0';
          return (
            <li key={opcion.id} style={{ padding: '8px 12px', borderRadius: 8, background: bg, border, fontSize: 13, color: '#334155' }}>
              {opcion.texto}
              {opcion.correcta && <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 700 }}> ✓</span>}
              {pregunta.respuestaUsuarioId === opcion.id && !pregunta.esCorrecta && (
                <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 600 }}> ✗ (tu respuesta)</span>
              )}
              {pregunta.respuestaUsuarioId === opcion.id && pregunta.esCorrecta && (
                <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 600 }}> ✓ (tu respuesta)</span>
              )}
            </li>
          );
        })}
        {pregunta.respuestaUsuarioId === null && (
          <li style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
            En blanco
          </li>
        )}
      </ul>

      {pregunta.explicacion && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, fontSize: 13, color: '#0369a1', border: '1px solid #bae6fd' }}>
          <strong>Explicación:</strong> {pregunta.explicacion}
        </div>
      )}

      {pregunta.referenciaNormativa && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>📖 {pregunta.referenciaNormativa}</p>
      )}
    </div>
  );
}
