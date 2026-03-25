import { Link } from 'react-router-dom';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };
const DIFICULTAD_LABEL = { mixto: 'Mixto', facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const LINK_SECONDARY = { padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' };
const BADGE_STYLE = { display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600 };

export default function ResultPage() {
  const result = JSON.parse(sessionStorage.getItem('last_result') || 'null');
  const activeTest = JSON.parse(sessionStorage.getItem('active_test') || 'null');

  if (!result) {
    return <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}><p style={{ color: '#64748b' }}>No hay resultados para mostrar.</p></main>;
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
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 20px' }}>Resultado del test</h1>

      <section style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
        {/* Badges de modo/dificultad */}
        {(modoLabel || dificultadLabel) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {modoLabel && <span style={BADGE_STYLE}>{modoLabel}</span>}
            {dificultadLabel && <span style={BADGE_STYLE}>{dificultadLabel}</span>}
          </div>
        )}

        {/* Nota grande */}
        <div style={{ textAlign: 'center', margin: '0 0 24px' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 700, color: notaColor }}>{nota}</span>
          <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>{' '}/ 10</span>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {pctAciertos}% de acierto
            {tiempo && <> · ⏱ {tiempo}</>}
          </p>
        </div>

        {/* Barra visual */}
        {total > 0 && (
          <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ width: `${pctAciertos}%`, background: '#22c55e' }} title={`Aciertos ${pctAciertos}%`} />
            <div style={{ width: `${pctErrores}%`, background: '#ef4444' }} title={`Errores ${pctErrores}%`} />
            <div style={{ width: `${pctBlancos}%`, background: '#d1d5db' }} title={`Blancos ${pctBlancos}%`} />
          </div>
        )}

        {/* Breakdown */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
      </section>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Nuevo test
        </Link>
        {result.testId && (
          <Link to={`/revision/${result.testId}`} style={LINK_SECONDARY}>Ver revisión</Link>
        )}
        {activeTest?.temaId && (
          <Link to={`/tema/${activeTest.temaId}`} style={LINK_SECONDARY}>Ver tema</Link>
        )}
        {activeTest?.oposicionId && !activeTest?.temaId && (
          <Link to={`/oposicion/${activeTest.oposicionId}`} style={LINK_SECONDARY}>Ver oposición</Link>
        )}
        <Link to="/progreso" style={LINK_SECONDARY}>Ver progreso</Link>
        <Link to="/historial" style={LINK_SECONDARY}>Historial</Link>
      </div>
    </main>
  );
}
