import { Link } from 'react-router-dom';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };
const DIFICULTAD_LABEL = { mixto: 'Mixto', facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ResultPage() {
  const result = JSON.parse(sessionStorage.getItem('last_result') || 'null');
  const activeTest = JSON.parse(sessionStorage.getItem('active_test') || 'null');

  if (!result) {
    return <p>No hay resultados para mostrar.</p>;
  }

  const total = (result.aciertos ?? 0) + (result.errores ?? 0) + (result.blancos ?? 0);
  const pctAciertos = total > 0 ? Math.round((result.aciertos / total) * 100) : 0;
  const pctErrores = total > 0 ? Math.round((result.errores / total) * 100) : 0;
  const pctBlancos = total > 0 ? 100 - pctAciertos - pctErrores : 0;

  const nota = Number(result.nota ?? 0).toFixed(2);
  const notaColor = result.nota >= 5 ? '#22c55e' : '#ef4444';

  const tiempo = formatTime(result.tiempoSegundos);
  const modoLabel = MODO_LABEL[activeTest?.modo] ?? activeTest?.modo ?? null;
  const dificultadLabel = DIFICULTAD_LABEL[activeTest?.dificultad] ?? activeTest?.dificultad ?? null;

  return (
    <section className="card">
      <h2>Resultado del test</h2>

      {/* Badges de modo/dificultad */}
      {(modoLabel || dificultadLabel) && (
        <div className="badges" style={{ marginBottom: '1rem' }}>
          {modoLabel && <span className="badge">{modoLabel}</span>}
          {dificultadLabel && <span className="badge">{dificultadLabel}</span>}
        </div>
      )}

      {/* Nota grande */}
      <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
        <span style={{ fontSize: '3.5rem', fontWeight: 700, color: notaColor }}>{nota}</span>
        <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>{' '}/ 10</span>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
          {pctAciertos}% de acierto
          {tiempo && <> · ⏱ {tiempo}</>}
        </p>
      </div>

      {/* Barra visual */}
      {total > 0 && (
        <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ width: `${pctAciertos}%`, background: '#22c55e' }} title={`Aciertos ${pctAciertos}%`} />
          <div style={{ width: `${pctErrores}%`, background: '#ef4444' }} title={`Errores ${pctErrores}%`} />
          <div style={{ width: `${pctBlancos}%`, background: '#d1d5db' }} title={`Blancos ${pctBlancos}%`} />
        </div>
      )}

      {/* Breakdown */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{result.aciertos ?? 0}</span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Aciertos</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{result.errores ?? 0}</span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Errores</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9ca3af' }}>{result.blancos ?? 0}</span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>En blanco</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>{total}</span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Total</p>
        </div>
      </div>

      <div className="actions">
        <Link to="/">Nuevo test</Link>
        <Link to="/progreso">Ver progreso</Link>
        {result.testId && <Link to={`/revision/${result.testId}`}>Ver revisión</Link>}
        {activeTest?.temaId && <Link to={`/tema/${activeTest.temaId}`}>Ver tema</Link>}
        {activeTest?.oposicionId && !activeTest?.temaId && <Link to={`/oposicion/${activeTest.oposicionId}`}>Ver oposición</Link>}
        <Link to="/historial">Historial</Link>
      </div>
    </section>
  );
}
