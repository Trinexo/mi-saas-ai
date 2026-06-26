import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { marcadasApi } from '../services/marcadasApi';
import { testApi } from '../services/testApi';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import MarcadasHeader from '../components/marcadas/MarcadasHeader';
import MarcadasFiltro from '../components/marcadas/MarcadasFiltro';
import MarcadasLista from '../components/marcadas/MarcadasLista';

export default function MarcadasPage() {
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState(null);
  const [filtroTema, setFiltroTema] = useState('');
  const { error, isLoading, runAction } = useAsyncAction();
  const isAlbacer = oposicionActiva?.modoPreparacion === 'albacer';

  useEffect(() => {
    runAction(() => marcadasApi.getMarcadas(token, oposicionActiva?.id)).then((data) => {
      if (Array.isArray(data)) setPreguntas(data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, oposicionActiva?.id]);

  const onDesmarcar = async (preguntaId) => {
    await marcadasApi.desmarcar(token, preguntaId);
    setPreguntas((prev) => prev.filter((p) => p.id !== preguntaId));
  };

  const onPracticar = async () => {
    if (!oposicionActiva?.id || isAlbacer) return;
    const numeroPreguntas = Math.min(preguntas.length, 20);
    const test = await runAction(() =>
      testApi.generate(token, { modo: 'marcadas', numeroPreguntas, oposicionId: oposicionActiva.id }),
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚠️</div>
      <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
    </div>
  );
  if (!preguntas) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando preguntas marcadas…</p>
    </div>
  );

  if (isAlbacer) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Favoritos no disponible en Modo Albacer</h2>
        <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.55 }}>
          En Modo Albacer los tests se inician desde los modulos del plan para no mezclar estadisticas ni crear practicas libres fuera del itinerario.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
