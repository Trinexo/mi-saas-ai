import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth.jsx';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { catalogApi } from '../../services/catalogApi';
import { testApi } from '../../services/testApi';

const SECTION = { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, borderTop: '3px solid #1d4ed8' };

export default function SimulacroForm() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isLoading, runAction, setErrorMessage, clearError } = useAsyncAction();
  const [oposiciones, setOposiciones] = useState([]);
  const [simulacro, setSimulacro] = useState({ oposicionId: '', numeroPreguntas: 60, duracion: '' });

  useEffect(() => {
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});
  }, []);

  // Pre-rellena la duración cuando el admin ha configurado un tiempo por defecto
  const onOposicionChange = (e) => {
    const selectedId = e.target.value;
    const oposicion = oposiciones.find((o) => String(o.id) === selectedId);
    setSimulacro((prev) => ({
      ...prev,
      oposicionId: selectedId,
      duracion: oposicion?.tiempo_limite_minutos ? String(oposicion.tiempo_limite_minutos) : prev.duracion,
    }));
  };

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

  const isReady = !!simulacro.oposicionId && !isLoading;

  return (
    <div style={SECTION}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <div style={{ background: '#1d4ed8', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🎯</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Simulacro de examen</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.5 }}>Preguntas proporcionales de toda la oposición. Las respuestas no se muestran hasta el final.</p>
        </div>
      </div>

      {/* Aviso visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#92400e' }}>
        <span>⏱️</span>
        <span>Puedes añadir tiempo límite. Sin tiempo, el simulacro es ilimitado.</span>
      </div>

      {/* Campos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Oposición *</label>
          <select
            value={simulacro.oposicionId}
            onChange={onOposicionChange}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${simulacro.oposicionId ? '#93c5fd' : '#e5e7eb'}`, borderRadius: 8, fontSize: '0.875rem', background: '#fff', outline: 'none' }}
          >
            <option value="">Selecciona oposición</option>
            {oposiciones.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Núm. preguntas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(máx. 200)</span></label>
          <input
            type="number"
            min="1"
            max="200"
            value={simulacro.numeroPreguntas}
            onChange={(e) => setSimulacro({ ...simulacro, numeroPreguntas: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div>
          {(() => {
            const oposicion = oposiciones.find((o) => String(o.id) === String(simulacro.oposicionId));
            const tieneDefault = !!oposicion?.tiempo_limite_minutos;
            return (
              <>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Duración
                  {tieneDefault
                    ? <span style={{ marginLeft: 6, color: '#1d4ed8', fontWeight: 400, fontSize: '0.75rem' }}>⏱ Tiempo oficial configurado</span>
                    : <span style={{ color: '#9ca3af', fontWeight: 400 }}> (min, opcional)</span>
                  }
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  placeholder="Sin límite"
                  value={simulacro.duracion}
                  onChange={(e) => setSimulacro({ ...simulacro, duracion: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${tieneDefault ? '#93c5fd' : '#e5e7eb'}`, borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </>
            );
          })()}
        </div>
      </div>

      <button
        disabled={!isReady}
        onClick={onGenerate}
        style={{
          background: isReady ? '#1d4ed8' : '#e5e7eb',
          color: isReady ? '#fff' : '#9ca3af',
          border: 'none',
          borderRadius: 8,
          padding: '10px 28px',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: isReady ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {isLoading ? (
          <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Generando…</>
        ) : '🎯 Iniciar simulacro'}
      </button>
    </div>
  );
}
