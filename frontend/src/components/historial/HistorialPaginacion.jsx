export default function HistorialPaginacion({ page, total, pageSize, onPrev, onNext }) {
  const totalPages = Math.ceil(total / pageSize);
  if (total <= pageSize) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
      <button onClick={onPrev} disabled={page === 1}>← Anterior</button>
      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Página {page} de {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages}>Siguiente →</button>
    </div>
  );
}
