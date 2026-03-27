import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

  if (error) return <p style={{ color: '#dc2626', padding: '1rem' }}>{error}</p>;
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

      <ReviewHeader onVolver={() => navigate('/resultado')} />
      <ReviewTestInfo testInfo={testInfo} />
      <ReviewResumen correctas={correctas} errores={errores} blancos={blancos} />
      <ReviewFiltros
        filtro={filtro}
        setFiltro={setFiltro}
        filtradosCount={preguntasFiltradas.length}
        totalCount={preguntas.length}
      />

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

      <ReviewAcciones
        testInfo={testInfo}
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
    </section>
  );
}
