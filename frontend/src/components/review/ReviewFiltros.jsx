const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'errores', label: 'Solo errores' },
  { value: 'correctas', label: 'Solo correctas' },
  { value: 'blancos', label: 'Solo en blanco' },
];

export default function ReviewFiltros({ filtro, setFiltro, filtradosCount, totalCount }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
      {FILTROS.map((f) => (
        <button
          key={f.value}
          onClick={() => setFiltro(f.value)}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: 20,
            border: '1px solid #d1d5db',
            background: filtro === f.value ? '#2563eb' : '#fff',
            color: filtro === f.value ? '#fff' : '#374151',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {f.label}
        </button>
      ))}
      {filtro !== 'todas' && (
        <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
          Mostrando {filtradosCount} de {totalCount}
        </span>
      )}
    </div>
  );
}
