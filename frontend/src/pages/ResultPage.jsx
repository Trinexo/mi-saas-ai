import { Link } from 'react-router-dom';
import ResultCard from '../components/result/ResultCard';
import ResultAcciones from '../components/result/ResultAcciones';

export default function ResultPage() {
  const result = JSON.parse(sessionStorage.getItem('last_result') || 'null');
  const activeTest = JSON.parse(sessionStorage.getItem('active_test') || 'null');

  if (!result) {
    return <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}><p style={{ color: '#64748b' }}>No hay resultados para mostrar.</p></main>;
  }

  const temaNombre = activeTest?.temaNombre ?? null;
  const oposicionNombre = activeTest?.oposicionNombre ?? null;
  const contexto = temaNombre ?? oposicionNombre ?? null;

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Resultado del test</h1>
      {contexto && (
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          {temaNombre && oposicionNombre
            ? <>{temaNombre} <span style={{ color: '#cbd5e1' }}>&middot;</span> {oposicionNombre}</>
            : contexto}
        </p>
      )}
      {!contexto && <div style={{ marginBottom: 20 }} />}
      <ResultCard result={result} activeTest={activeTest} />
      <ResultAcciones activeTest={activeTest} />
    </main>
  );
}