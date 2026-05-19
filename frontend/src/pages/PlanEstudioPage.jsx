import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import { useOposicionActiva } from '../state/oposicionActiva.jsx';
import { planEstudioApi } from '../services/planEstudioApi';

const O = '#ea580c';
const DK = '#111827';
const G = '#374151';
const GL = '#6b7280';
const BD = '#e5e7eb';
const CARD = {
  background: '#fff',
  borderRadius: 14,
  border: `1px solid ${BD}`,
  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
};

const tipoLabel = {
  simulacro: 'Simulacro oficial',
  plantilla_test: 'Test recomendado',
  tema_recomendado: 'Tema recomendado',
};

const estadoStyle = {
  disponible: { label: 'Disponible', bg: '#fff7ed', color: '#c2410c' },
  completado: { label: 'Completado', bg: '#dcfce7', color: '#15803d' },
  proximo: { label: 'Proximo', bg: '#eff6ff', color: '#1d4ed8' },
  cerrado: { label: 'Cerrado', bg: '#f1f5f9', color: '#64748b' },
  bloqueada: { label: 'Bloqueado', bg: '#fef3c7', color: '#92400e' },
};

function fmtDate(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ estado }) {
  const style = estadoStyle[estado] ?? estadoStyle.proximo;
  return (
    <span style={{ borderRadius: 999, padding: '5px 10px', background: style.bg, color: style.color, fontSize: '.72rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
      {style.label}
    </span>
  );
}

export default function PlanEstudioPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { oposicionActiva } = useOposicionActiva();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState(null);
  const [filter, setFilter] = useState('todos');

  const load = () => {
    if (!token || !oposicionActiva?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    planEstudioApi.list(token, oposicionActiva.id)
      .then((res) => setItems(Array.isArray(res?.items) ? res.items : []))
      .catch((err) => setError(err.message || 'No se pudo cargar el Plan de estudio'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token, oposicionActiva?.id]);

  const stats = useMemo(() => {
    const total = items.length;
    const completadas = items.filter((item) => item.estado_alumno === 'completado').length;
    const disponibles = items.filter((item) => item.estado_alumno === 'disponible').length;
    const proximas = items.filter((item) => item.estado_alumno === 'proximo').length;
    return { total, completadas, disponibles, proximas };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'todos') return items;
    return items.filter((item) => (item.estado_alumno || 'proximo') === filter);
  }, [items, filter]);

  const handleEmpezar = async (item) => {
    if (!item?.id || startingId) return;
    setStartingId(item.id);
    setError('');
    try {
      const test = await planEstudioApi.empezar(token, item.id);
      sessionStorage.setItem('active_test', JSON.stringify(test));
      navigate('/test');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar esta actividad');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: GL, fontSize: '.78rem', fontWeight: 800, marginBottom: 5 }}>Plan de estudio</div>
          <h1 style={{ margin: 0, color: DK, fontSize: '1.55rem', fontWeight: 900 }}>Actividades recomendadas</h1>
          <p style={{ margin: '5px 0 0', color: GL, fontSize: '.88rem' }}>
            {oposicionActiva?.nombre || 'Selecciona una oposicion para ver tu plan'}
          </p>
        </div>
        <Link to="/" style={{ color: O, fontWeight: 800, textDecoration: 'none', fontSize: '.85rem' }}>Volver al inicio</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Disponibles', value: stats.disponibles },
          { label: 'Completadas', value: stats.completadas },
          { label: 'Proximas', value: stats.proximas },
        ].map((stat) => (
          <div key={stat.label} style={{ ...CARD, padding: '16px 18px' }}>
            <div style={{ color: GL, fontSize: '.72rem', fontWeight: 900, textTransform: 'uppercase' }}>{stat.label}</div>
            <div style={{ color: DK, fontSize: '1.6rem', fontWeight: 900, marginTop: 6 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...CARD, padding: 14, marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          ['todos', 'Todas'],
          ['disponible', 'Disponibles'],
          ['completado', 'Completadas'],
          ['proximo', 'Proximas'],
          ['cerrado', 'Cerradas'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            style={{
              border: filter === value ? 'none' : `1px solid ${BD}`,
              background: filter === value ? O : '#fff',
              color: filter === value ? '#fff' : G,
              borderRadius: 999,
              padding: '8px 13px',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '.78rem',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '11px 14px', marginBottom: 14, fontSize: '.84rem', fontWeight: 700 }}>{error}</div>}

      {loading ? (
        <div style={{ ...CARD, padding: 38, textAlign: 'center', color: GL, fontWeight: 800 }}>Cargando Plan de estudio...</div>
      ) : !oposicionActiva ? (
        <div style={{ ...CARD, padding: 38, textAlign: 'center' }}>
          <div style={{ color: DK, fontWeight: 900, marginBottom: 6 }}>No hay oposicion activa</div>
          <Link to="/seleccionar-oposicion" style={{ color: O, fontWeight: 800 }}>Seleccionar oposicion</Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ ...CARD, padding: 38, textAlign: 'center', color: GL }}>
          No hay actividades en este filtro.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filteredItems.map((item) => {
            const estado = item.estado_alumno || 'proximo';
            const enabled = estado === 'disponible';
            const completado = estado === 'completado';
            const loadingItem = startingId === item.id;
            const temas = (item.temas ?? []).map((tema) => tema.nombre).join(', ');
            const nota = item.mi_mejor_nota != null ? Number(item.mi_mejor_nota) : null;
            return (
              <div key={item.id} style={{ ...CARD, padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h2 style={{ margin: 0, color: DK, fontSize: '.98rem', fontWeight: 900 }}>{item.titulo}</h2>
                    <StatusBadge estado={estado} />
                    {completado && nota != null && (
                      <span style={{ borderRadius: 999, padding: '5px 10px', background: '#eff6ff', color: '#1d4ed8', fontSize: '.72rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                        {nota.toFixed(1)} pts
                      </span>
                    )}
                  </div>
                  <div style={{ color: GL, fontSize: '.78rem', lineHeight: 1.5 }}>
                    {tipoLabel[item.tipo] || item.tipo} · Inicio {fmtDate(item.fecha_inicio)}
                    {item.fecha_fin ? ` · Fin ${fmtDate(item.fecha_fin)}` : ''}
                    {item.intentos_usados != null ? ` · Intentos ${item.intentos_usados}${item.intentos_maximos ? `/${item.intentos_maximos}` : ''}` : ''}
                  </div>
                  {item.descripcion && <p style={{ margin: '8px 0 0', color: G, fontSize: '.84rem', lineHeight: 1.45 }}>{item.descripcion}</p>}
                  {temas && <div style={{ marginTop: 8, color: '#64748b', fontSize: '.76rem', fontWeight: 700 }}>{temas}</div>}
                </div>
                {enabled ? (
                  <button
                    type="button"
                    disabled={loadingItem}
                    onClick={() => handleEmpezar(item)}
                    style={{ border: 'none', background: O, color: '#fff', borderRadius: 9, padding: '10px 16px', fontWeight: 900, cursor: loadingItem ? 'wait' : 'pointer', opacity: loadingItem ? 0.7 : 1 }}
                  >
                    {loadingItem ? 'Abriendo...' : 'Empezar'}
                  </button>
                ) : completado ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#15803d', fontWeight: 900, fontSize: '.8rem' }}>Completado</div>
                    {nota != null && (
                      <div style={{ color: '#1d4ed8', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2, marginTop: 2 }}>
                        {nota.toFixed(1)}
                        <span style={{ fontSize: '.65rem', color: GL, fontWeight: 600 }}> pts</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ color: GL, fontWeight: 800, fontSize: '.78rem' }}>{estadoStyle[estado]?.label ?? estado}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
