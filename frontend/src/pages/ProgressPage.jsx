import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useUserPlan } from '../hooks/useUserPlan';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { albacerApi } from '../services/albacerApi';
import ResumenGlobalSection from '../components/progress/ResumenGlobalSection';
import RachaObjetivoSection from '../components/progress/RachaObjetivoSection';
import EvolucionSection from '../components/progress/EvolucionSection';
import ProgresoTemasOposicionSection from '../components/progress/ProgresoTemasOposicionSection';
import AnaliticasAvanzadasSection from '../components/progress/AnaliticasAvanzadasSection';
import ResumenSemanaWidget from '../components/widgets/ResumenSemanaWidget';
import TuNivelWidget from '../components/widgets/TuNivelWidget';

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
  );
}

function AlbacerModuloFilter({ oposicionId, value, onChange }) {
  const { token } = useAuth();
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!oposicionId) {
      setModulos([]);
      onChange(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    albacerApi
      .listAlumnoModulos(token, { oposicion_id: oposicionId })
      .then((data) => {
        if (cancelled) return;
        setModulos(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setModulos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, oposicionId, onChange]);

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.05)', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Progreso Albacer</div>
          <div style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>
            Filtra el resumen y la evolución por módulo para no mezclar niveles.
          </div>
        </div>
        <select
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
          disabled={loading || modulos.length === 0}
          style={{ minWidth: 230, padding: '9px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', color: '#111827', fontSize: 13, fontWeight: 700 }}
        >
          <option value="">{loading ? 'Cargando módulos...' : 'Todos los módulos'}</option>
          {modulos.map((modulo) => (
            <option key={modulo.id} value={modulo.id}>
              {modulo.orden ? `${modulo.orden}. ` : ''}{modulo.nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { hasAccess, loading } = useUserPlan();
  const { oposicionActiva } = useOposicionActiva();
  const [albacerModuloId, setAlbacerModuloId] = useState(null);
  const esElite = hasAccess('elite');
  const esPro = hasAccess('pro');
  const modoPreparacion = oposicionActiva?.modoPreparacion ?? 'experto';
  const isAlbacer = modoPreparacion === 'albacer';
  const progressOptions = useMemo(() => ({
    modo_preparacion: modoPreparacion,
    ...(isAlbacer && albacerModuloId ? { albacer_modulo_id: albacerModuloId } : {}),
  }), [modoPreparacion, isAlbacer, albacerModuloId]);

  useEffect(() => {
    setAlbacerModuloId(null);
  }, [oposicionActiva?.id, modoPreparacion]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Mi progreso</h2>
          {oposicionActiva && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff7ed', color: '#ea580c', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid #fb923c40' }}>
              {oposicionActiva.nombre}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>Estadísticas y análisis completo de tu preparación</p>
      </div>

      {isAlbacer && (
        <AlbacerModuloFilter
          oposicionId={oposicionActiva?.id}
          value={albacerModuloId}
          onChange={setAlbacerModuloId}
        />
      )}

      <SectionLabel>Resumen global</SectionLabel>
      <ResumenGlobalSection oposicionId={oposicionActiva?.id} options={progressOptions} />
      <div style={{ marginTop: 16 }}>
        <RachaObjetivoSection oposicionId={oposicionActiva?.id} options={progressOptions} />
      </div>

      <SectionLabel>Esta semana</SectionLabel>
      <ResumenSemanaWidget oposicionId={oposicionActiva?.id} options={progressOptions} />

      <SectionLabel>Evolución</SectionLabel>
      <EvolucionSection oposicionId={oposicionActiva?.id} options={progressOptions} />

      <SectionLabel>Temas</SectionLabel>
      <ProgresoTemasOposicionSection oposicionId={oposicionActiva?.id} options={progressOptions} />

      <SectionLabel>Tu nivel</SectionLabel>
      <TuNivelWidget oposicionId={oposicionActiva?.id} options={progressOptions} />

      {!loading && esElite && (
        <>
          <SectionLabel>Analíticas avanzadas</SectionLabel>
          <AnaliticasAvanzadasSection oposicionId={oposicionActiva?.id} options={progressOptions} />
        </>
      )}

      {!loading && !esElite && esPro && (
        <div style={{ marginTop: '2rem', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>🔒</div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Analíticas avanzadas — Plan Elite</h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#374151', lineHeight: 1.6 }}>
              Desglosa tu rendimiento por materia, analiza tu eficiencia de tiempo, detecta patrones de error y sigue tu tendencia mensual con precisión.
            </p>
            <button
              onClick={() => navigate('/planes')}
              style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: '#ea580c', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Ver plan Elite
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
