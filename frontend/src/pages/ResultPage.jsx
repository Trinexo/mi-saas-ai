import ResultCard from '../components/result/ResultCard';
import ResultAcciones from '../components/result/ResultAcciones';
import ResultErroresPreview from '../components/result/ResultErroresPreview';

export default function ResultPage() {
  const result = JSON.parse(sessionStorage.getItem('last_result') || 'null');
  const activeTest = JSON.parse(sessionStorage.getItem('active_test') || 'null');

  if (!result) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
        <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>No hay resultados para mostrar</p>
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>Completa un test primero.</p>
      </div>
    );
  }

  const temaNombre = activeTest?.temaNombre ?? null;
  const oposicionNombre = activeTest?.oposicionNombre ?? null;
  const contexto = temaNombre ?? oposicionNombre ?? null;

  const aprobado = Number(result?.nota ?? 0) >= 5;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0,
          background: aprobado ? '#dcfce7' : '#fee2e2',
        }}>
          {aprobado ? '🏆' : '💪'}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>
            {aprobado ? '¡Bien hecho!' : 'Sigue practicando'}
          </h2>
          {contexto && (
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
              {temaNombre && oposicionNombre
                ? <>{temaNombre} <span style={{ color: '#cbd5e1' }}>&middot;</span> {oposicionNombre}</>
                : contexto}
            </p>
          )}
        </div>
      </div>
      <ResultCard result={result} activeTest={activeTest} />
      <ResultErroresPreview result={result} activeTest={activeTest} />
      <ResultAcciones activeTest={activeTest} />
    </div>
  );
}