import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GenerarTestForm from '../components/forms/GenerarTestForm';
import SimulacroForm from '../components/forms/SimulacroForm';
import { useUserPlan } from '../hooks/useUserPlan';

export default function ConfigurarTestPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const modoSugerido = location.state?.modoSugerido ?? null;
  const [tab, setTab] = useState('practica');
  const { hasAccess } = useUserPlan();
  const simulacroDesbloqueado = hasAccess('pro');

  const TABS = [
    { key: 'practica',   label: '📋 Práctica',  desc: 'Tests personalizados por materia, modo y dificultad', locked: false },
    { key: 'simulacro',  label: '🎯 Simulacro', desc: 'Examen cronometrado con toda la oposición',           locked: !simulacroDesbloqueado },
  ];

  const handleTabClick = (t) => {
    if (t.locked) {
      navigate('/planes');
      return;
    }
    setTab(t.key);
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Configurar test</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Elige el modo y los parámetros de tu sesión de práctica</p>
      </div>

      {/* Tabs underline */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabClick(t)}
            title={t.locked ? 'Disponible en Plan Pro' : undefined}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: 'transparent',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: '0.9rem',
              color: t.locked ? '#9ca3af' : tab === t.key ? '#1d4ed8' : '#6b7280',
              cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
              transition: 'color .15s',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {t.label}
            {t.locked && <span style={{ fontSize: '0.7rem', background: '#f3f4f6', color: '#6b7280', borderRadius: 6, padding: '1px 6px', fontWeight: 600 }}>Pro</span>}
          </button>
        ))}
      </div>

      {tab === 'practica' && <GenerarTestForm modoSugerido={modoSugerido} />}
      {tab === 'simulacro' && simulacroDesbloqueado && <SimulacroForm />}
    </div>
  );
}
