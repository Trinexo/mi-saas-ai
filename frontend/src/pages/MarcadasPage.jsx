import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { marcadasApi } from '../services/marcadasApi';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import MarcadasHeader from '../components/marcadas/MarcadasHeader';
import MarcadasFiltro from '../components/marcadas/MarcadasFiltro';
import MarcadasLista from '../components/marcadas/MarcadasLista';

export default function MarcadasPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState(null);
  const [filtroTema, setFiltroTema] = useState('');
  const { error, isLoading, runAction } = useAsyncAction();

  useEffect(() => {
    runAction(() => marcadasApi.getMarcadas(token)).then((data) => {
      if (Array.isArray(data)) setPreguntas(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onDesmarcar = async (preguntaId) => {
    await marcadasApi.desmarcar(token, preguntaId);
    setPreguntas((prev) => prev.filter((p) => p.id !== preguntaId));
  };

  const onPracticar = async () => {
    const numeroPreguntas = Math.min(preguntas.length, 20);
    const test = await runAction(() =>
      testApi.generate(token, { modo: 'marcadas', numeroPreguntas }),
    );
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  const preguntasFiltradas = preguntas
    ? preguntas.filter((p) =>
        filtroTema === '' ||
        (p.temaNombre ?? '').toLowerCase().includes(filtroTema.toLowerCase()),
      )
    : [];

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
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando preguntas marcadas…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <MarcadasHeader
        preguntas={preguntas}
        preguntasFiltradas={preguntasFiltradas}
        filtroTema={filtroTema}
        onPracticar={onPracticar}
        isLoading={isLoading}
      />
      <MarcadasFiltro
        preguntas={preguntas}
        filtroTema={filtroTema}
        onFiltroChange={setFiltroTema}
      />
      <MarcadasLista
        preguntas={preguntas}
        preguntasFiltradas={preguntasFiltradas}
        filtroTema={filtroTema}
        onDesmarcar={onDesmarcar}
      />
    </div>
  );
}
