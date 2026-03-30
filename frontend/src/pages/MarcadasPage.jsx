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

  if (error) return <p style={{ color: '#dc2626', padding: '1rem' }}>{error}</p>;
  if (!preguntas) return <p>Cargando preguntas marcadas...</p>;

  return (
    <section>
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
    </section>
  );
}
