export default function ReviewReportDialog({ dialogRef, reportMotivo, setReportMotivo, reportError, onSubmit, onClose }) {
  return (
    <dialog ref={dialogRef} style={{ borderRadius: '8px', padding: '1.5rem', maxWidth: '460px', width: '90%', border: '1px solid #ccc' }}>
      <h3 style={{ marginTop: 0 }}>Reportar pregunta</h3>
      <p style={{ fontSize: '0.9rem', color: '#555' }}>Describe el error o problema encontrado (mín. 5 caracteres):</p>
      <textarea
        value={reportMotivo}
        onChange={(e) => { setReportMotivo(e.target.value); }}
        maxLength={500}
        rows={4}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '0.9rem' }}
        placeholder="Ejemplo: la respuesta correcta marcada es incorrecta..."
      />
      {reportError && <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px', background: '#fef2f2', borderRadius: 7, color: '#dc2626', fontSize: '0.85rem', margin: '4px 0' }}><span>⚠️</span>{reportError}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
        <button
          style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
        >
          Enviar reporte
        </button>
      </div>
    </dialog>
  );
}
