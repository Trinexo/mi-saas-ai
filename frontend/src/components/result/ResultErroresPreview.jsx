const MAX_PREVIEW = 5;

function getTextoOpcion(opciones = [], opcionId) {
  const found = opciones.find((o) => o.id === opcionId);
  return found ? found.texto : null;
}

export default function ResultErroresPreview({ result, activeTest }) {
  const erroneas = result?.preguntasErroneas;
  if (!erroneas || erroneas.length === 0) return null;

  const preguntasMap = new Map((activeTest?.preguntas ?? []).map((p) => [p.id, p]));
  const items = erroneas.slice(0, MAX_PREVIEW);

  return (
    <section style={{ background: '#fff', borderRadius: 12, padding: '20px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#1e293b' }}>
        Preguntas erróneas
        <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 13, color: '#64748b' }}>({erroneas.length} en total)</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(({ preguntaId, respuestaId }) => {
          const pregunta = preguntasMap.get(preguntaId);
          if (!pregunta) return null;
          const tuRespuesta = getTextoOpcion(pregunta.opciones, respuestaId);
          const correcta = pregunta.opciones?.find((o) => o.id === pregunta.opcionCorrectaId);
          return (
            <div key={preguntaId} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{pregunta.enunciado}</p>
              {tuRespuesta && (
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#dc2626' }}>
                  <strong>Tu respuesta:</strong> {tuRespuesta}
                </p>
              )}
              {correcta && (
                <p style={{ margin: 0, fontSize: 13, color: '#15803d' }}>
                  <strong>Correcta:</strong> {correcta.texto}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {erroneas.length > MAX_PREVIEW && (
        <p style={{ margin: '14px 0 0', fontSize: 13, color: '#64748b' }}>
          …y {erroneas.length - MAX_PREVIEW} más. Revisa todas en la revisión completa.
        </p>
      )}
    </section>
  );
}
