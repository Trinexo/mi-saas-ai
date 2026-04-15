import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { testApi } from '../services/testApi';
import { marcadasApi } from '../services/marcadasApi';
import { reportarApi } from '../services/reportarApi';
import { useAuth } from '../state/auth.jsx';
import ReviewHeader from '../components/review/ReviewHeader';
import ReviewTestInfo from '../components/review/ReviewTestInfo';
import ReviewResumen from '../components/review/ReviewResumen';
import ReviewFiltros from '../components/review/ReviewFiltros';
import ReviewPreguntaCard from '../components/review/ReviewPreguntaCard';
import ReviewAcciones from '../components/review/ReviewAcciones';
import ReviewReportDialog from '../components/review/ReviewReportDialog';

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
  const [modoUnoUno, setModoUnoUno] = useState(false);
  const [indexActivo, setIndexActivo] = useState(0);
  const dialogRef = useRef(null);
  const { error, runAction } = useAsyncAction();

  useEffect(() => { setIndexActivo(0); }, [filtro, modoUnoUno]);

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

  if (error) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚠️</div>
      <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
    </div>
  );
  if (!preguntas) return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando revisión…</p>
    </div>
  );

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
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <ReviewHeader onVolver={() => navigate('/resultado')} />
      <ReviewTestInfo testInfo={testInfo} />
      <ReviewResumen correctas={correctas} errores={errores} blancos={blancos} />
      <ReviewFiltros
        filtro={filtro}
        setFiltro={setFiltro}
        filtradosCount={preguntasFiltradas.length}
        totalCount={preguntas.length}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['lista', 'una-a-una'].map((m) => (
          <button
            key={m}
            onClick={() => setModoUnoUno(m === 'una-a-una')}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: '1px solid #e5e7eb',
              background: (m === 'una-a-una') === modoUnoUno ? '#1d4ed8' : '#fff',
              color: (m === 'una-a-una') === modoUnoUno ? '#fff' : '#374151',
              fontWeight: (m === 'una-a-una') === modoUnoUno ? 700 : 400,
            }}
          >
            {m === 'lista' ? 'Vista lista' : 'Pregunta a pregunta'}
          </button>
        ))}
      </div>

      {modoUnoUno ? (
        preguntasFiltradas.length === 0 ? (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay preguntas en este filtro.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                Pregunta {indexActivo + 1} de {preguntasFiltradas.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={indexActivo === 0}
                  onClick={() => setIndexActivo((i) => i - 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: indexActivo === 0 ? 'not-allowed' : 'pointer', opacity: indexActivo === 0 ? 0.4 : 1, fontSize: 13, color: '#374151' }}
                >
                  ← Anterior
                </button>
                <button
                  disabled={indexActivo === preguntasFiltradas.length - 1}
                  onClick={() => setIndexActivo((i) => i + 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: indexActivo === preguntasFiltradas.length - 1 ? 'not-allowed' : 'pointer', opacity: indexActivo === preguntasFiltradas.length - 1 ? 0.4 : 1, fontSize: 13, color: '#374151' }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
            <ReviewPreguntaCard
              pregunta={preguntasFiltradas[indexActivo]}
              idx={indexActivo}
              marcadas={marcadas}
              reportadas={reportadas}
              onToggleMarcada={toggleMarcada}
              onOpenReport={openReportModal}
            />
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {preguntasFiltradas.map((pregunta, idx) => (
            <ReviewPreguntaCard
              key={pregunta.preguntaId}
              pregunta={pregunta}
              idx={idx}
              marcadas={marcadas}
              reportadas={reportadas}
              onToggleMarcada={toggleMarcada}
              onOpenReport={openReportModal}
            />
          ))}
        </div>
      )}

      <ReviewAcciones
        testInfo={testInfo}
        errores={errores}
        onNuevoTest={() => navigate('/')}
        onVerProgreso={() => navigate('/progreso')}
      />

      <ReviewReportDialog
        dialogRef={dialogRef}
        reportMotivo={reportMotivo}
        setReportMotivo={(v) => { setReportMotivo(v); setReportError(''); }}
        reportError={reportError}
        onSubmit={submitReporte}
        onClose={closeReportModal}
      />
    </div>
  );
}
