import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { catalogApi } from '../../services/catalogApi';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 };

export default function SimulacroForm() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction, setErrorMessage, clearError } = useAsyncAction();
  const [oposiciones, setOposiciones] = useState([]);
  const [simulacro, setSimulacro] = useState({ oposicionId: '', numeroPreguntas: 60, duracion: '' });

  useEffect(() => {
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
  }, []);

  const onGenerate = async () => {
    clearError();
    const numeroPreguntasSimulacro = Number(simulacro.numeroPreguntas);
    if (!Number.isInteger(numeroPreguntasSimulacro) || numeroPreguntasSimulacro < 1 || numeroPreguntasSimulacro > 200) {
      setErrorMessage('Indica un número de preguntas entre 1 y 200');
      return;
    }
    const payload = {
      oposicionId: Number(simulacro.oposicionId),
      numeroPreguntas: numeroPreguntasSimulacro,
      modo: 'simulacro',
    };
    if (simulacro.duracion) {
      const mins = Number(simulacro.duracion);
      if (!Number.isInteger(mins) || mins < 1 || mins > 300) {
        setErrorMessage('La duración debe estar entre 1 y 300 minutos');
        return;
      }
      payload.duracionSegundos = mins * 60;
    }
    const test = await runAction(() => testApi.generate(token, payload));
    if (test) {
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    }
  };

  return (
    <section style={SECTION}>
      <h2>Simulacro de examen</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Preguntas proporcionales de toda la oposición. Opcionalmente con tiempo límite.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.75rem 0' }}>
        <select
          value={simulacro.oposicionId}
          onChange={(e) => setSimulacro({ ...simulacro, oposicionId: e.target.value })}
        >
          <option value="">Selecciona oposición</option>
          {oposiciones.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
        <label>
          Nº preguntas (máx. 200)
          <input
            type="number"
            min="1"
            max="200"
            value={simulacro.numeroPreguntas}
            onChange={(e) => setSimulacro({ ...simulacro, numeroPreguntas: e.target.value })}
          />
        </label>
        <label>
          Duración (min, opcional)
          <input
            type="number"
            min="1"
            max="300"
            placeholder="Sin límite"
            value={simulacro.duracion}
            onChange={(e) => setSimulacro({ ...simulacro, duracion: e.target.value })}
          />
        </label>
      </div>
      <button disabled={!simulacro.oposicionId || isLoading} onClick={onGenerate}>
        {isLoading ? 'Generando...' : 'Iniciar simulacro'}
      </button>
    </section>
  );
}
