import MarcadasPreguntaCard from './MarcadasPreguntaCard';

export default function MarcadasLista({ preguntas, preguntasFiltradas, filtroTema, onDesmarcar }) {
  if (preguntas.length === 0) {
    return (
      <p style={{ color: '#6b7280' }}>
        No tienes preguntas marcadas. Puedes marcar preguntas desde la pantalla de revisión de un test.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {preguntasFiltradas.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Ningún resultado para «{filtroTema}». Prueba con otro término.</p>
      ) : (
        preguntasFiltradas.map((pregunta) => (
          <MarcadasPreguntaCard key={pregunta.id} pregunta={pregunta} onDesmarcar={onDesmarcar} />
        ))
      )}
    </div>
  );
}
