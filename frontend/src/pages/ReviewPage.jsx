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
      <div className="review-header">
        <h2>Revisión del test</h2>
        <button className="btn-secondary" onClick={() => navigate('/resultado')}>
          ← Volver al resultado
        </button>
      </div>

      {testInfo && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
            {testInfo.tipoTest && (
              <span className="badge">{MODO_LABEL[testInfo.tipoTest] ?? testInfo.tipoTest}</span>
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
        <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>✓ {correctas} correctas</span>
        <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>✗ {errores} errores</span>
        <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>— {blancos} en blanco</span>
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

      <div className="review-list">
        {preguntasFiltradas.map((pregunta, idx) => (
          <div key={pregunta.preguntaId} className="review-question">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="review-question-number" style={{ margin: 0, flex: 1 }}>
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

            <ul className="review-options">
              {pregunta.opciones.map((opcion) => (
                <li
                  key={opcion.id}
                  className={getOptionClass(opcion, pregunta.respuestaUsuarioId, pregunta.esCorrecta)}
                >
                  {opcion.texto}
                  {opcion.correcta && <span className="review-badge"> ✓</span>}
                  {pregunta.respuestaUsuarioId === opcion.id && !pregunta.esCorrecta && (
                    <span className="review-badge"> ✗ (tu respuesta)</span>
                  )}
                  {pregunta.respuestaUsuarioId === opcion.id && pregunta.esCorrecta && (
                    <span className="review-badge"> ✓ (tu respuesta)</span>
                  )}
                </li>
              ))}
              {pregunta.respuestaUsuarioId === null && (
                <li className="review-option blank-chosen">En blanco</li>
              )}
            </ul>

            {pregunta.explicacion && (
              <div className="review-explanation">
                <strong>Explicación:</strong> {pregunta.explicacion}
              </div>
            )}

            {pregunta.referenciaNormativa && (
              <p className="review-reference">📖 {pregunta.referenciaNormativa}</p>
            )}
          </div>
        ))}
      </div>

      <div className="actions" style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/')}>Nuevo test</button>
        <button className="btn-secondary" onClick={() => navigate('/progreso')}>Ver progreso</button>
        {testInfo?.temaId && (
          <Link to={`/tema/${testInfo.temaId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>Ver tema</Link>
        )}
        {testInfo?.oposicionId && (
          <Link to={`/oposicion/${testInfo.oposicionId}`} className="btn-secondary" style={{ textDecoration: 'none' }}>Ver oposición</Link>
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
          <button className="btn-secondary" onClick={closeReportModal}>Cancelar</button>
          <button onClick={submitReporte}>Enviar reporte</button>
        </div>
      </dialog>
    </section>
  );
}
