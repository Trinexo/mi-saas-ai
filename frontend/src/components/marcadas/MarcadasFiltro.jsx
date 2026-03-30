export default function MarcadasFiltro({ preguntas, filtroTema, onFiltroChange }) {
  if (preguntas.length === 0) return null;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="Filtrar por tema..."
        value={filtroTema}
        onChange={(e) => onFiltroChange(e.target.value)}
        style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', width: '100%', maxWidth: 320, boxSizing: 'border-box' }}
      />
    </div>
  );
}
