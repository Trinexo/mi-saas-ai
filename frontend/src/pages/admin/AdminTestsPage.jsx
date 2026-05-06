import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';

// ─── Estilos ──────────────────────────────────────────────────────────────────
const P = '#7c3aed';
const CARD = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const TH = { padding: '10px 14px', fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc' };
const TD = { padding: '11px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#1e293b', verticalAlign: 'middle' };

const ESTADO_CFG = {
  publicado: { bg: '#dcfce7', color: '#16a34a' },
  borrador:  { bg: '#f1f5f9', color: '#475569' },
  archivado: { bg: '#fee2e2', color: '#dc2626' },
};

const DIFICULTAD_CFG = {
  1: { label: 'Muy fácil', bg: '#dcfce7', color: '#16a34a' },
  2: { label: 'Fácil',     bg: '#d1fae5', color: '#059669' },
  3: { label: 'Media',     bg: '#fef9c3', color: '#92400e' },
  4: { label: 'Difícil',   bg: '#fee2e2', color: '#dc2626' },
  5: { label: 'Muy difícil',bg:'#fecaca', color: '#991b1b' },
};

export default function AdminTestsPage() {
  const { token } = useAuth();
  const [oposiciones, setOposiciones]   = useState([]);
  const [selectedOp,  setSelectedOp]    = useState(null);
  const [tests,       setTests]         = useState([]);
  const [loadingOp,   setLoadingOp]     = useState(true);
  const [loadingTests,setLoadingTests]  = useState(false);
  const [q,           setQ]             = useState('');
  const [estadoFil,   setEstadoFil]     = useState('');
  const [msg,         setMsg]           = useState('');

  // Carga oposiciones
  useEffect(() => {
    setLoadingOp(true);
    adminApi
      .listOposicionesConStats(token, { page_size: 100 })
      .then((r) => setOposiciones(r?.items ?? r ?? []))
      .catch(() => setOposiciones([]))
      .finally(() => setLoadingOp(false));
  }, [token]);

  // Carga tests para la oposición seleccionada
  useEffect(() => {
    if (!selectedOp) return;
    setLoadingTests(true);
    setTests([]);
    // Intenta llamar al endpoint de tests admin; si no existe, muestra estado vacío
    adminApi
      .listTests?.(token, { oposicion_id: selectedOp.id, page_size: 100 })
      .then((r) => setTests(r?.items ?? r ?? []))
      .catch(() => setTests([]))
      .finally(() => setLoadingTests(false));
  }, [selectedOp, token]);

  const filteredTests = tests.filter((t) => {
    const matchQ = !q || (t.nombre || '').toLowerCase().includes(q.toLowerCase());
    const matchE = !estadoFil || t.estado === estadoFil;
    return matchQ && matchE;
  });

  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Tests</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
            Crea y gestiona tests de cada oposición
          </p>
        </div>
        <button
          style={{ background: P, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setMsg('La creación de tests estará disponible próximamente.')}
        >
          + Nuevo test
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', background: '#ede9fe', borderRadius: 8, color: P, fontSize: '0.85rem', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, fontSize: '1rem' }}>×</button>
        </div>
      )}

      {/* Layout: árbol izquierda + tabla derecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Panel izquierdo: lista de oposiciones */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Oposiciones
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{oposiciones.length}</span>
          </div>
          {loadingOp ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#cbd5e1', fontSize: '0.82rem' }}>Cargando…</div>
          ) : oposiciones.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#cbd5e1', fontSize: '0.82rem' }}>Sin oposiciones</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
              {oposiciones.map((op) => {
                const isActive = selectedOp?.id === op.id;
                return (
                  <li key={op.id}>
                    <button
                      onClick={() => setSelectedOp(op)}
                      style={{
                        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                        padding: '9px 16px 9px 14px',
                        borderLeft: isActive ? `3px solid ${P}` : '3px solid transparent',
                        background: isActive ? 'rgba(124,58,237,0.07)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: isActive ? '#4c1d95' : '#374151', fontWeight: isActive ? 600 : 400, flex: 1, textAlign: 'left' }}>
                        {op.nombre}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', flexShrink: 0 }}>
                        {op.total_tests ?? 0}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Panel derecho: tabla de tests */}
        {!selectedOp ? (
          <div style={{ ...CARD, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#cbd5e1' }}>
            <span style={{ fontSize: '2.5rem' }}>📝</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Selecciona una oposición para ver sus tests</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sub-header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar test…"
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.83rem', width: 220 }}
                />
                <select
                  value={estadoFil}
                  onChange={(e) => setEstadoFil(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.83rem', color: '#374151', background: '#fff' }}
                >
                  <option value="">Estado: Todos</option>
                  <option value="publicado">Publicado</option>
                  <option value="borrador">Borrador</option>
                  <option value="archivado">Archivado</option>
                </select>
              </div>
              <button
                style={{ background: P, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setMsg(`Crear test para "${selectedOp.nombre}" estará disponible próximamente.`)}
              >
                + Nuevo test
              </button>
            </div>

            {/* Tabla */}
            <div style={CARD}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Test</th>
                      <th style={TH}>Preguntas</th>
                      <th style={TH}>Duración</th>
                      <th style={TH}>Dificultad</th>
                      <th style={TH}>Estado</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTests ? (
                      <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>Cargando tests…</td></tr>
                    ) : filteredTests.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '2rem' }}>📄</span>
                            <span style={{ fontSize: '0.88rem' }}>
                              {tests.length === 0
                                ? `Sin tests para "${selectedOp.nombre}". Próximamente podrás crearlos.`
                                : 'No hay tests que coincidan con los filtros.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((t) => {
                        const estado = ESTADO_CFG[t.estado] ?? ESTADO_CFG.borrador;
                        const dif = DIFICULTAD_CFG[t.nivel_dificultad ?? t.dificultad] ?? null;
                        return (
                          <tr key={t.id} style={{ transition: 'background 0.1s' }}>
                            <td style={TD}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.nombre}</div>
                              {t.descripcion && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{t.descripcion}</div>}
                            </td>
                            <td style={TD}>{t.num_preguntas ?? t.total_preguntas ?? '—'}</td>
                            <td style={TD}>{t.duracion_minutos ? `${t.duracion_minutos} min` : '—'}</td>
                            <td style={TD}>
                              {dif ? (
                                <span style={{ background: dif.bg, color: dif.color, borderRadius: 20, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 600 }}>
                                  {dif.label}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={TD}>
                              <span style={{ background: estado.bg, color: estado.color, borderRadius: 20, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 600 }}>
                                {t.estado ? t.estado.charAt(0).toUpperCase() + t.estado.slice(1) : 'Borrador'}
                              </span>
                            </td>
                            <td style={{ ...TD, textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>👁</button>
                                <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>✏️</button>
                                <button style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>⋯</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
