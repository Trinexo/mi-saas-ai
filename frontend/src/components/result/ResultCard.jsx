const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };
const DIFICULTAD_LABEL = { mixto: 'Mixto', facil: 'Fácil', media: 'Media', dificil: 'Difícil' };
const BADGE_STYLE = { display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600 };

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ResultCard({ result, activeTest }) {
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
    <section style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 20 }}>
      {(modoLabel || dificultadLabel) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {modoLabel && <span style={BADGE_STYLE}>{modoLabel}</span>}
          {dificultadLabel && <span style={BADGE_STYLE}>{dificultadLabel}</span>}
        </div>
      )}
      <div style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <span style={{ fontSize: '3.5rem', fontWeight: 700, color: notaColor }}>{nota}</span>
        <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>{' '}/ 10</span>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
          {pctAciertos}% de acierto
          {tiempo && <> · ⏱ {tiempo}</>}
        </p>
      </div>
      {total > 0 && (
        <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ width: `${pctAciertos}%`, background: '#22c55e' }} title={`Aciertos ${pctAciertos}%`} />
          <div style={{ width: `${pctErrores}%`, background: '#ef4444' }} title={`Errores ${pctErrores}%`} />
          <div style={{ width: `${pctBlancos}%`, background: '#d1d5db' }} title={`Blancos ${pctBlancos}%`} />
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { value: result.aciertos ?? 0, label: 'Aciertos', color: '#22c55e' },
          { value: result.errores ?? 0, label: 'Errores', color: '#ef4444' },
          { value: result.blancos ?? 0, label: 'En blanco', color: '#9ca3af' },
          { value: total, label: 'Total', color: '#374151' },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</span>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
