import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { testApi } from '../services/testApi';
import { marcadasApi } from '../services/marcadasApi';
import { reportarApi } from '../services/reportarApi';
import { useAuth } from '../state/auth.jsx';

const MODO_LABEL = { adaptativo: 'Adaptativo', normal: 'Normal', repaso: 'Repaso', marcadas: 'Marcadas', simulacro: 'Simulacro', refuerzo: 'Refuerzo' };

function formatTime(segundos) {
  if (!segundos) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ESTADO_CLASE = {
  correcta: 'review-option correct',
  incorrecta: 'review-option incorrect',
  elegida_blanco: 'review-option blank-chosen',
  neutra: 'review-option',
  correcta_no_elegida: 'review-option correct-missed',
};

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'errores', label: 'Solo errores' },
  { value: 'correctas', label: 'Solo correctas' },
  { value: 'blancos', label: 'Solo en blanco' },
];

function getOptionClass(opcion, respuestaUsuarioId, esCorrecta) {
  const esElegida = respuestaUsuarioId !== null && opcion.id === respuestaUsuarioId;
  const esLaCorrecta = opcion.correcta;

  if (esElegida && esCorrecta) return ESTADO_CLASE.correcta;
  if (esElegida && !esCorrecta) return ESTADO_CLASE.incorrecta;
  if (!esElegida && esLaCorrecta) return ESTADO_CLASE.correcta_no_elegida;
  return ESTADO_CLASE.neutra;
}

export default function ReviewPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [preguntas, setPreguntas] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [marcadas, setMarcadas] = useState(new Set());
  const [reportadas, setReportadas] = useState(new Set());
  const [reportModal, setReportModal] = useState(null);
  const [reportMotivo, setReportMotivo] = useState('');
  const [reportError, setReportError] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const dialogRef = useRef(null);
  const { error, runAction } = useAsyncAction();

  useEffect(() => {
    runAction(() => testApi.getReview(token, testId)).then((data) => {
      if (data) {
        setPreguntas(data.preguntas);
        setTestInfo(data.test ?? null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, token]);

  const openReportModal = (preguntaId) => {
    setReportModal({ preguntaId });
    setReportMotivo('');
    setReportError('');
    setTimeout(() => dialogRef.current?.showModal(), 0);
  };

  const closeReportModal = () => {
    dialogRef.current?.close();
    setReportModal(null);
  };

  const submitReporte = async () => {
    if (reportMotivo.trim().length < 5) {
      setReportError('El motivo debe tener al menos 5 caracteres.');
      return;
    }
    const result = await reportarApi.reportar(token, reportModal.preguntaId, reportMotivo.trim());
    if (result) {
      setReportadas((prev) => new Set(prev).add(reportModal.preguntaId));
      closeReportModal();
    }
  };

  const toggleMarcada = async (preguntaId) => {
    if (marcadas.has(preguntaId)) {
      await marcadasApi.desmarcar(token, preguntaId);
      setMarcadas((prev) => { const s = new Set(prev); s.delete(preguntaId); return s; });
    } else {
      await marcadasApi.marcar(token, preguntaId);
      setMarcadas((prev) => new Set(prev).add(preguntaId));
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!preguntas) return <p>Cargando revisión...</p>;

  const correctas = preguntas.filter((p) => p.esCorrecta).length;
  const errores = preguntas.filter((p) => !p.esCorrecta && p.respuestaUsuarioId !== null).length;
  const blancos = preguntas.filter((p) => p.respuestaUsuarioId === null).length;

  const preguntasFiltradas = preguntas.filter((p) => {
    if (filtro === 'errores') return !p.esCorrecta && p.respuestaUsuarioId !== null;
    if (filtro === 'correctas') return p.esCorrecta;
    if (filtro === 'blancos') return p.respuestaUsuarioId === null;
    return true;
  });

  return (
    <section>
      <nav style={{ fontSize: 13, color: '#64748b', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Revisión</span>
      </nav>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Revisión del test</h2>
        <button style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }} onClick={() => navigate('/resultado')}>
          ← Volver al resultado
        </button>
      </div>

      {testInfo && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
            {testInfo.tipoTest && (
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600 }}>{MODO_LABEL[testInfo.tipoTest] ?? testInfo.tipoTest}</span>
            )}
            {testInfo.temaId
              ? <Link to={`/tema/${testInfo.temaId}`} style={{ fontWeight: 600, color: '#374151', textDecoration: 'none' }}>{testInfo.temaNombre}</Link>
              : testInfo.temaNombre && <span style={{ fontWeight: 600, color: '#374151' }}>{testInfo.temaNombre}</span>
            }
            {testInfo.fechaCreacion && (
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {new Date(testInfo.fechaCreacion).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {testInfo.nota != null && (
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: Number(testInfo.nota) >= 5 ? '#22c55e' : '#ef4444' }}>
                {Number(testInfo.nota).toFixed(2)}
                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#6b7280' }}> / 10</span>
              </span>
            )}
            {formatTime(testInfo.tiempoSegundos) && (
              <span style={{ color: '#6b7280', fontSize: '0.875rem', alignSelf: 'center' }}>⏱ {formatTime(testInfo.tiempoSegundos)}</span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 600 }}>✓ {correctas} correctas</span>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 }}>✗ {errores} errores</span>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#f3f4f6', color: '#374151', fontSize: 12, fontWeight: 600 }}>— {blancos} en blanco</span>
      </div>

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
            Mostrando {preguntasFiltradas.length} de {preguntas.length}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {preguntasFiltradas.map((pregunta, idx) => (
          <div key={pregunta.preguntaId} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ margin: 0, flex: 1, fontWeight: 500, fontSize: 14, color: '#1e293b' }}>
                <strong>{idx + 1}.</strong> {pregunta.enunciado}
              </p>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => toggleMarcada(pregunta.preguntaId)}
                  title={marcadas.has(pregunta.preguntaId) ? 'Quitar marca' : 'Marcar para estudiar'}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}
                >
                  {marcadas.has(pregunta.preguntaId) ? '★' : '☆'}
                </button>
                <button
                  onClick={() => openReportModal(pregunta.preguntaId)}
                  disabled={reportadas.has(pregunta.preguntaId)}
                  title={reportadas.has(pregunta.preguntaId) ? '✓ Reportada' : 'Reportar pregunta errónea'}
                  style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: reportadas.has(pregunta.preguntaId) ? 'default' : 'pointer', opacity: reportadas.has(pregunta.preguntaId) ? 0.4 : 1 }}
                >
                  ⚑
                </button>
              </div>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pregunta.opciones.map((opcion) => {
                const cls = getOptionClass(opcion, pregunta.respuestaUsuarioId, pregunta.esCorrecta);
                const bg = cls === 'review-option correcta' || cls === 'review-option correcta_no_elegida'
                  ? '#f0fdf4' : cls === 'review-option incorrecta' ? '#fef2f2' : '#f8fafc';
                const border = cls === 'review-option correcta' || cls === 'review-option correcta_no_elegida'
                  ? '1px solid #bbf7d0' : cls === 'review-option incorrecta' ? '1px solid #fecaca' : '1px solid #e2e8f0';
                return (
                  <li key={opcion.id} style={{ padding: '8px 12px', borderRadius: 8, background: bg, border, fontSize: 13, color: '#334155' }}>
                    {opcion.texto}
                    {opcion.correcta && <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 700 }}> ✓</span>}
                    {pregunta.respuestaUsuarioId === opcion.id && !pregunta.esCorrecta && (
                      <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 600 }}> ✗ (tu respuesta)</span>
                    )}
                    {pregunta.respuestaUsuarioId === opcion.id && pregunta.esCorrecta && (
                      <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 600 }}> ✓ (tu respuesta)</span>
                    )}
                  </li>
                );
              })}
              {pregunta.respuestaUsuarioId === null && (
                <li style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>En blanco</li>
              )}
            </ul>

            {pregunta.explicacion && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, fontSize: 13, color: '#0369a1', border: '1px solid #bae6fd' }}>
                <strong>Explicación:</strong> {pregunta.explicacion}
              </div>
            )}

            {pregunta.referenciaNormativa && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>📖 {pregunta.referenciaNormativa}</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '2rem' }}>
        <button style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => navigate('/')}>Nuevo test</button>
        <button style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => navigate('/progreso')}>Ver progreso</button>
        {testInfo?.temaId && (
          <Link to={`/tema/${testInfo.temaId}`} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Ver tema</Link>
        )}
        {testInfo?.oposicionId && (
          <Link to={`/oposicion/${testInfo.oposicionId}`} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Ver oposición</Link>
        )}
      </div>

      <dialog ref={dialogRef} style={{ borderRadius: '8px', padding: '1.5rem', maxWidth: '460px', width: '90%', border: '1px solid #ccc' }}>
        <h3 style={{ marginTop: 0 }}>Reportar pregunta</h3>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>Describe el error o problema encontrado (mín. 5 caracteres):</p>
        <textarea
          value={reportMotivo}
          onChange={(e) => { setReportMotivo(e.target.value); setReportError(''); }}
          maxLength={500}
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '0.9rem' }}
          placeholder="Ejemplo: la respuesta correcta marcada es incorrecta..."
        />
        {reportError && <p style={{ color: 'red', fontSize: '0.85rem', margin: '4px 0' }}>{reportError}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
          <button style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: 13 }} onClick={closeReportModal}>Cancelar</button>
          <button onClick={submitReporte}>Enviar reporte</button>
        </div>
      </dialog>
    </section>
  );
}
