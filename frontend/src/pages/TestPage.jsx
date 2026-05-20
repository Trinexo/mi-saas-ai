import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../services/api';
import { testApi } from '../services/testApi';
import { marcadasApi } from '../services/marcadasApi';
import { reportarApi } from '../services/reportarApi';
import { useAuth } from '../state/auth.jsx';
import TestNavGrid from '../components/test/TestNavGrid';
import TestPregunta from '../components/test/TestPregunta';
import ReviewReportDialog from '../components/review/ReviewReportDialog';

/* ——— Paleta ——————————————————————————————————————————————— */
const O    = '#ea580c';
const OBG  = '#fff7ed';
const BD   = '#e5e7eb';
const DK   = '#111827';
const G    = '#374151';
const GL   = '#6b7280';
const BL   = '#2563eb';
const BLBG = '#eff6ff';

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* ——— Header sticky ———————————————————————————————————————— */
function TestHeader({ index, total, answered, elapsed, remaining, duracion, modo }) {
  const isUrgent  = remaining != null && remaining <= 300 && remaining > 60;
  const isWarning = remaining != null && remaining <= 60  && remaining > 0;
  const isExpired = remaining === 0;
  const timerColor = (isExpired || isWarning) ? '#dc2626' : isUrgent ? '#d97706' : GL;
  const timerBg    = (isExpired || isWarning) ? '#fef2f2' : isUrgent ? '#fffbeb' : '#f3f4f6';
  const pulse      = (isWarning || isExpired) ? { animation: 'timerPulse .8s ease-in-out infinite' } : {};
  const label      = remaining != null ? fmt(remaining) : fmt(elapsed);
  const pctResp    = total > 0 ? Math.round((answered / total) * 100) : 0;
  const pctTime    = duracion > 0 && remaining != null ? Math.max(0, Math.round((remaining / duracion) * 100)) : null;
  const BADGE = {
    simulacro:  { bg: BLBG,      color: BL,        icon: '🎯', text: 'SIMULACRO'  },
    refuerzo:   { bg: OBG,       color: O,          icon: '🔁', text: 'REFUERZO'   },
    adaptativo: { bg: '#f0fdf4', color: '#16a34a',  icon: '🧠', text: 'ADAPTATIVO' },
  };
  const badge = BADGE[modo];
  return (
    <>
      <style>{`@keyframes timerPulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ background: '#fff', borderBottom: `1px solid ${BD}`, position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="test-header-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {badge && (
            <span className="test-badge" style={{ fontSize: '0.68rem', fontWeight: 700, background: badge.bg, color: badge.color, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {badge.icon} {badge.text}
            </span>
          )}
          <span style={{ fontSize: '0.82rem', color: G, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <strong style={{ color: DK }}>{index + 1}</strong> / {total}
          </span>
          <div style={{ flex: 1, height: 4, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden', minWidth: 48 }}>
            <div style={{ height: '100%', width: `${pctResp}%`, background: '#22c55e', borderRadius: 999, transition: 'width .3s' }} />
          </div>
          <span className="test-resp-count" style={{ fontSize: '0.72rem', color: GL, whiteSpace: 'nowrap', flexShrink: 0 }}>{answered}/{total} resp.</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', background: timerBg, color: timerColor, padding: '5px 11px', borderRadius: 8, letterSpacing: '0.03em', flexShrink: 0, ...pulse }}>
            ⏱ {label}
          </span>
        </div>
        {pctTime !== null && (
          <div style={{ height: 2, background: '#e5e7eb' }}>
            <div style={{ height: '100%', width: `${pctTime}%`, background: (isExpired || isWarning) ? '#dc2626' : isUrgent ? '#f59e0b' : BL, transition: 'width 1s linear' }} />
          </div>
        )}
        {isWarning && !isExpired && (
          <div style={{ background: '#fef2f2', color: '#dc2626', borderTop: '1px solid #fecaca', padding: '6px 28px', fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', ...pulse }}>
            🚨 ¡Menos de 1 minuto! El test se enviará automáticamente.
          </div>
        )}
        {isUrgent && !isWarning && !isExpired && (
          <div style={{ background: '#fffbeb', color: '#d97706', borderTop: '1px solid #fde68a', padding: '6px 28px', fontSize: '0.78rem', fontWeight: 600, textAlign: 'center' }}>
            ⚠ Menos de 5 minutos. El test se enviará automáticamente al terminar.
          </div>
        )}
      </div>
    </>
  );
}

/* ——— Panel izquierdo (solo desktop) ——————————————————————— */
function LeftPanel({ preguntas, answers, index, setIndex, marcadas, answered }) {
  const total = preguntas.length;
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#fff', borderRadius: 16, border: `1px solid ${BD}`,
      boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '18px 14px',
      position: 'sticky', top: 64, alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GL, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Navegación</div>
        <div style={{ fontSize: '0.75rem', color: G, marginTop: 3 }}>
          <strong style={{ color: DK }}>{answered}</strong> / {total} respondidas
        </div>
      </div>
      <TestNavGrid preguntas={preguntas} answers={answers} index={index} setIndex={setIndex} marcadas={marcadas} />
      <div style={{ paddingTop: 14, marginTop: 12, borderTop: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          { color: BL,        bg: BLBG,      label: 'Actual'        },
          { color: '#15803d', bg: '#dcfce7',  label: 'Respondida'    },
          { color: '#d97706', bg: '#fffbeb',  label: 'Marcada'       },
          { color: GL,        bg: '#f9fafb',  label: 'Sin responder' },
        ].map(({ color, bg, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: bg, border: `1.5px solid ${color}`, flexShrink: 0 }} />
            <span style={{ fontSize: '0.71rem', color: G }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ——— Controles —————————————————————————————————————————— */
function Controls({ index, total, onPrev, onNext, onSubmit, submitting, answered, error, feedbackMode }) {
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const [hovSub,  setHovSub ] = useState(false);
  const isFirst = index === 0;
  const isLast  = index === total - 1;
  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BD}` }}>
        {!feedbackMode && (
          <button
            disabled={isFirst}
            onClick={onPrev}
            onMouseEnter={() => setHovPrev(true)}
            onMouseLeave={() => setHovPrev(false)}
            style={{
              padding: '10px 20px', borderRadius: 10,
              border: `1.5px solid ${BD}`, background: (hovPrev && !isFirst) ? '#f3f4f6' : '#fff',
              color: isFirst ? GL : G, fontWeight: 600, fontSize: '0.88rem',
              cursor: isFirst ? 'not-allowed' : 'pointer', opacity: isFirst ? 0.5 : 1, transition: 'all .15s',
            }}
          >← Anterior</button>
        )}
        <div style={{ flex: 1 }} />
        {(!feedbackMode || !isLast) && (
          <button
            onClick={onNext}
            disabled={!feedbackMode && isLast}
            onMouseEnter={() => setHovNext(true)}
            onMouseLeave={() => setHovNext(false)}
            style={{
              padding: '10px 20px', borderRadius: 10,
              border: `1.5px solid ${BD}`, background: (hovNext && !(isLast && !feedbackMode)) ? '#f3f4f6' : '#fff',
              color: (isLast && !feedbackMode) ? GL : G, fontWeight: 600, fontSize: '0.88rem',
              cursor: (isLast && !feedbackMode) ? 'not-allowed' : 'pointer',
              opacity: (isLast && !feedbackMode) ? 0.5 : 1, transition: 'all .15s',
            }}
          >Siguiente →</button>
        )}
        {(!feedbackMode || isLast) && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            onMouseEnter={() => setHovSub(true)}
            onMouseLeave={() => setHovSub(false)}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: (hovSub && !submitting) ? '#c2410c' : O,
              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              boxShadow: `0 3px 12px ${O}40`, transition: 'all .15s',
            }}
          >
            {submitting ? 'Enviando…' : feedbackMode ? 'Ver resultado' : `Enviar (${answered}/${total})`}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', gap: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: '0.875rem', alignItems: 'flex-start' }}>
          <span style={{ flexShrink: 0 }}>⚠️</span> {error}
        </div>
      )}
    </>
  );
}

export default function TestPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const test = useMemo(() => JSON.parse(sessionStorage.getItem('active_test') || 'null'), []);
  const feedbackMode = test?.feedbackInmediato === true;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmed, setConfirmed] = useState({}); // preguntaId → true cuando comprobada
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const [marcadas, setMarcadas] = useState(new Set());
  const [reportPreguntaId, setReportPreguntaId] = useState(null);
  const [reportMotivo, setReportMotivo] = useState('');
  const [reportError, setReportError] = useState('');
  const dialogRef = useRef(null);

  const duracion = test?.duracionSegundos ?? null;
  const remaining = duracion != null ? Math.max(0, duracion - elapsed) : null;
  const isExpired = remaining === 0;

  const onSubmit = useCallback(async (answersSnapshot, { timeout = false } = {}) => {
    setError('');
    setSubmitting(true);
    try {
      const tiempoSegundos = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const payload = {
        testId: Number(test.testId),
        tiempoSegundos,
        respuestas: test.preguntas.map((item) => ({
          preguntaId: Number(item.id),
          respuestaId: answersSnapshot[item.id] != null ? Number(answersSnapshot[item.id]) : null,
        })),
      };

      const result = await testApi.submit(token, payload);
      sessionStorage.setItem('last_result', JSON.stringify({ ...result, timeoutSubmit: timeout }));
      navigate('/resultado');
    } catch (e) {
      setError(getErrorMessage(e));
      setSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, test]);

  useEffect(() => {
    marcadasApi.getMarcadas(token)
      .then((data) => setMarcadas(new Set((data || []).map((m) => m.id))))
      .catch(() => {});
  }, [token]);

  const toggleMarcada = async (preguntaId) => {
    try {
      if (marcadas.has(preguntaId)) {
        await marcadasApi.desmarcar(token, preguntaId);
        setMarcadas((prev) => { const next = new Set(prev); next.delete(preguntaId); return next; });
      } else {
        await marcadasApi.marcar(token, preguntaId);
        setMarcadas((prev) => new Set([...prev, preguntaId]));
      }
    } catch { /* silent */ }
  };

  const openReport = (preguntaId) => {
    setReportPreguntaId(preguntaId);
    setReportMotivo('');
    setReportError('');
    dialogRef.current?.showModal();
  };

  const closeReport = () => {
    dialogRef.current?.close();
    setReportPreguntaId(null);
  };

  const submitReport = async () => {
    if (reportMotivo.trim().length < 5) {
      setReportError('El motivo debe tener al menos 5 caracteres.');
      return;
    }
    try {
      await reportarApi.reportar(token, reportPreguntaId, reportMotivo.trim());
      closeReport();
    } catch {
      setReportError('Error al enviar el reporte. Inténtalo de nuevo.');
    }
  };

  // Referencia estable a answers para el auto-submit
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit cuando el countdown llega a 0
  useEffect(() => {
    if (isExpired && !submitting) {
      onSubmit(answersRef.current, { timeout: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  if (!test) {
    return <p>No hay test activo.</p>;
  }

  const question = test.preguntas[index];
  const isCurrentConfirmed = !!confirmed[question.id];

  const selectAnswer = (preguntaId, opcionId) => {
    if (feedbackMode && confirmed[preguntaId]) return;
    setAnswers((prev) => ({ ...prev, [preguntaId]: opcionId }));
    if (feedbackMode) {
      setConfirmed((prev) => ({ ...prev, [preguntaId]: true }));
    }
  };

  const onNextFeedback = () => {
    setIndex((prev) => Math.min(prev + 1, test.preguntas.length - 1));
  };

  const answered = Object.keys(answers).length;

  return (
    <div className="test-breakout">
      <style>{`
        .test-breakout { margin: -28px -32px; }
        .test-nav-panel { display: block; }
        .test-body { display: flex; gap: 20px; padding: 24px 28px; align-items: flex-start; }
        .test-header-row { padding: 11px 28px; }
        @media (max-width: 767px) {
          .test-breakout { margin: -16px -16px; }
          .test-nav-panel { display: none; }
          .test-body { padding: 14px 14px 96px; }
          .test-header-row { padding: 9px 14px; gap: 8px; }
          .test-header-row .test-badge { display: none; }
          .test-header-row .test-resp-count { display: none; }
        }
      `}</style>

      <TestHeader
        index={index}
        total={test.preguntas.length}
        answered={answered}
        elapsed={elapsed}
        remaining={remaining}
        duracion={duracion}
        modo={test?.modo}
      />

      <div className="test-body">
        {!feedbackMode && (
          <div className="test-nav-panel">
            <LeftPanel
              preguntas={test.preguntas}
              answers={answers}
              index={index}
              setIndex={setIndex}
              marcadas={marcadas}
              answered={answered}
            />
          </div>
        )}

        <div style={{
          flex: 1, minWidth: 0,
          background: '#fff', borderRadius: 16,
          border: `1px solid ${BD}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          padding: 'clamp(20px, 3vw, 36px)',
        }}>
          <TestPregunta
            question={question}
            answers={answers}
            onSelect={selectAnswer}
            feedbackMode={feedbackMode}
            confirmed={isCurrentConfirmed}
            index={index}
            total={test.preguntas.length}
            marcada={marcadas.has(question.id)}
            onToggleMarcada={() => toggleMarcada(question.id)}
            onReportar={() => openReport(question.id)}
          />
          <Controls
            index={index}
            total={test.preguntas.length}
            onPrev={() => setIndex(index - 1)}
            onNext={feedbackMode ? onNextFeedback : () => setIndex(Math.min(index + 1, test.preguntas.length - 1))}
            onSubmit={() => onSubmit(answers)}
            submitting={submitting}
            answered={answered}
            error={error}
            feedbackMode={feedbackMode}
          />
        </div>
      </div>

      <ReviewReportDialog
        dialogRef={dialogRef}
        reportMotivo={reportMotivo}
        setReportMotivo={setReportMotivo}
        reportError={reportError}
        onSubmit={submitReport}
        onClose={closeReport}
      />
    </div>
  );
}