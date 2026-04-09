const BTN = (disabled) => ({
  padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
  background: disabled ? '#f8fafc' : '#fff', color: disabled ? '#cbd5e1' : '#334155',
  fontWeight: 600, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
});

export default function HistorialPaginacion({ page, total, pageSize, onPrev, onNext }) {
  const totalPages = Math.ceil(total / pageSize);
  if (total <= pageSize) return null;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: '1.5rem', justifyContent: 'center' }}>
      <button onClick={onPrev} disabled={page === 1} style={BTN(page === 1)}>← Anterior</button>
      <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600, minWidth: 100, textAlign: 'center' }}>
        Página {page} de {totalPages}
      </span>
      <button onClick={onNext} disabled={page >= totalPages} style={BTN(page >= totalPages)}>Siguiente →</button>
    </div>
  );
}
