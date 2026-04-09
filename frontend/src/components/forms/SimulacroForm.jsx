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
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Simulacro de examen</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Preguntas proporcionales de toda la oposicion. Opcionalmente con tiempo limite. Las respuestas no se muestran hasta el final.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.75rem 0' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Oposicion</label>
          <select
            value={simulacro.oposicionId}
            onChange={(e) => setSimulacro({ ...simulacro, oposicionId: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', background: 'white' }}
          >
            <option value="">Selecciona oposicion</option>
            {oposiciones.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Num. preguntas (max. 200)</label>
          <input
            type="number"
            min="1"
            max="200"
            value={simulacro.numeroPreguntas}
            onChange={(e) => setSimulacro({ ...simulacro, numeroPreguntas: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Duracion (min, opcional)</label>
          <input
            type="number"
            min="1"
            max="300"
            placeholder="Sin limite"
            value={simulacro.duracion}
            onChange={(e) => setSimulacro({ ...simulacro, duracion: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      <button
        disabled={!simulacro.oposicionId || isLoading}
        onClick={onGenerate}
        style={{
          background: simulacro.oposicionId && !isLoading ? '#1e293b' : '#d1d5db',
          color: simulacro.oposicionId && !isLoading ? 'white' : '#9ca3af',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: simulacro.oposicionId && !isLoading ? 'pointer' : 'not-allowed',
        }}
      >
        {isLoading ? 'Generando...' : 'Iniciar simulacro'}
      </button>
    </section>
  );
}
