import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';

const COL = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  padding: '0 0 8px',
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
  minHeight: 320,
  display: 'flex',
  flexDirection: 'column',
};

const COL_HEADER = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px 12px',
  borderBottom: '1px solid #f3f4f6',
};

const ITEM_BASE = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 12px',
  borderRadius: 6,
  margin: '1px 8px',
  cursor: 'pointer',
};

const BTN_ADD = {
  background: '#ea580c', color: '#fff', border: 'none',
  borderRadius: 6, padding: '5px 12px', fontWeight: 600,
  cursor: 'pointer', fontSize: '0.8rem',
};

const BTN_ICON = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '0.85rem', color: '#d1d5db', padding: '2px 4px', lineHeight: 1,
};

function InlineForm({ placeholder, onSave, onCancel, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 12px', marginTop: 6 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        style={{ width: '100%', padding: '6px 10px', border: '1px solid #bae6fd', borderRadius: 6, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
        maxLength={200}
        onKeyDown={(e) => { if (e.key === 'Enter' && value.trim().length >= 2) onSave(value.trim()); if (e.key === 'Escape') onCancel(); }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={() => onSave(value.trim())} disabled={value.trim().length < 2} style={{ flex: 1, background: '#ea580c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
        <button onClick={onCancel} style={{ flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
      </div>
    </div>
  );
}

export default function AdminCatalogPage() {
  const { token } = useAuth();
  const [oposiciones, setOposiciones] = useState([]);
  const [temas, setTemas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [selOposicion, setSelOposicion] = useState(null);
  const [selTema, setSelTema] = useState(null);
  const [addingOposicion, setAddingOposicion] = useState(false);
  const [editingOposicion, setEditingOposicion] = useState(null);
  const [tiempoLimiteInput, setTiempoLimiteInput] = useState('');
  const [guardandoTiempo, setGuardandoTiempo] = useState(false);
  const [mensajeTiempo, setMensajeTiempo] = useState(null);
  const [addingTema, setAddingTema] = useState(false);
  const [editingTema, setEditingTema] = useState(null);
  const [addingBloque, setAddingBloque] = useState(false);
  const [editingBloque, setEditingBloque] = useState(null);
  const [error, setError] = useState('');

  const loadOposiciones = () =>
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});

  const loadTemas = (opId) =>
    catalogApi.getTemas(opId).then(setTemas).catch(() => setTemas([]));

  const loadBloques = (temaId) =>
    catalogApi.getBloques(temaId).then(setBloques).catch(() => setBloques([]));

  useEffect(() => { loadOposiciones(); }, []);

  const handleSelectOposicion = (op) => {
    setSelOposicion(op);
    setSelTema(null);
    setBloques([]);
    setAddingTema(false);
    setEditingTema(null);
    setTiempoLimiteInput(op.tiempo_limite_minutos ? String(op.tiempo_limite_minutos) : '');
    setMensajeTiempo(null);
    loadTemas(op.id);
  };

  const handleSelectTema = (tema) => {
    setSelTema(tema);
    setAddingBloque(false);
    setEditingBloque(null);
    loadBloques(tema.id);
  };

  const guardoConError = async (fn) => {
    try { setError(''); await fn(); }
    catch (e) { setError(e.message || 'Error'); }
  };

  const handleCreateOposicion = (nombre) => guardoConError(async () => {
    await adminApi.createOposicion(token, { nombre });
    setAddingOposicion(false);
    loadOposiciones();
  });

  const handleUpdateOposicion = (nombre) => guardoConError(async () => {
    await adminApi.updateOposicion(token, editingOposicion.id, { nombre });
    setEditingOposicion(null);
    loadOposiciones();
  });

  const handleGuardarTiempoLimite = async () => {
    setGuardandoTiempo(true);
    setMensajeTiempo(null);
    try {
      const mins = tiempoLimiteInput === '' ? null : Number(tiempoLimiteInput);
      await adminApi.updateOposicion(token, selOposicion.id, { tiempo_limite_minutos: mins });
      setSelOposicion((prev) => ({ ...prev, tiempo_limite_minutos: mins }));
      loadOposiciones();
      setMensajeTiempo({ tipo: 'ok', texto: mins ? `${mins} min guardados` : 'Sin límite (eliminado)' });
    } catch (e) {
      setMensajeTiempo({ tipo: 'error', texto: e.message || 'Error al guardar' });
    } finally {
      setGuardandoTiempo(false);
    }
  };

  const handleDeleteOposicion = (id) => guardoConError(async () => {
    if (!window.confirm('Eliminar esta oposicion y todo su contenido?')) return;
    await adminApi.deleteOposicion(token, id);
    if (selOposicion?.id === id) { setSelOposicion(null); setTemas([]); setSelTema(null); setBloques([]); }
    loadOposiciones();
  });

  const handleCreateTema = (nombre) => guardoConError(async () => {
    await adminApi.createTema(token, { oposicion_id: selOposicion.id, nombre });
    setAddingTema(false);
    loadTemas(selOposicion.id);
  });

  const handleUpdateTema = (nombre) => guardoConError(async () => {
    await adminApi.updateTema(token, editingTema.id, { nombre });
    setEditingTema(null);
    loadTemas(selOposicion.id);
  });

  const handleDeleteTema = (id) => guardoConError(async () => {
    if (!window.confirm('Eliminar este tema y todos sus bloques?')) return;
    await adminApi.deleteTema(token, id);
    if (selTema?.id === id) { setSelTema(null); setBloques([]); }
    loadTemas(selOposicion.id);
  });

  const handleCreateBloque = (nombre) => guardoConError(async () => {
    await adminApi.createBloque(token, { tema_id: selTema.id, nombre });
    setAddingBloque(false);
    loadBloques(selTema.id);
  });

  const handleUpdateBloque = (nombre) => guardoConError(async () => {
    await adminApi.updateBloque(token, editingBloque.id, { nombre });
    setEditingBloque(null);
    loadBloques(selTema.id);
  });

  const handleDeleteBloque = (id) => guardoConError(async () => {
    if (!window.confirm('Eliminar este bloque?')) return;
    await adminApi.deleteBloque(token, id);
    loadBloques(selTema.id);
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Catálogo</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          Gestiona la estructura: oposiciones → temas → bloques
        </p>
      </div>

      {/* Breadcrumb de selección */}
      {(selOposicion || selTema) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#6b7280', marginBottom: 14, background: '#f9fafb', borderRadius: 8, padding: '8px 14px', border: '1px solid #e5e7eb' }}>
          <span style={{ color: '#374151', fontWeight: 600 }}>📂 {selOposicion?.nombre}</span>
          {selTema && (
            <>
              <span style={{ color: '#d1d5db' }}>›</span>
              <span style={{ color: '#374151', fontWeight: 600 }}>📋 {selTema?.nombre}</span>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>
      )}

      {/* Columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* ── Oposiciones ── */}
        <div style={COL}>
          <div style={COL_HEADER}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>🏛️</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                Oposiciones
              </h3>
              <span style={{ background: '#e5e7eb', color: '#6b7280', borderRadius: 999, fontSize: 11, fontWeight: 600, padding: '1px 7px' }}>{oposiciones.length}</span>
            </div>
            <button onClick={() => { setAddingOposicion(true); setEditingOposicion(null); }} style={BTN_ADD}>+ Nueva</button>
          </div>
          <div style={{ padding: '8px 0', flex: 1 }}>
            {addingOposicion && (
              <div style={{ padding: '0 8px', marginBottom: 4 }}>
                <InlineForm placeholder="Nombre de la oposición" onSave={handleCreateOposicion} onCancel={() => setAddingOposicion(false)} />
              </div>
            )}
            {oposiciones.length === 0 && !addingOposicion && (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>Sin oposiciones aún</div>
            )}
            {oposiciones.map((op) => (
              <div key={op.id}>
                {editingOposicion?.id === op.id ? (
                  <div style={{ padding: '0 8px', marginBottom: 4 }}>
                    <InlineForm placeholder="Nombre" initialValue={op.nombre} onSave={handleUpdateOposicion} onCancel={() => setEditingOposicion(null)} />
                  </div>
                ) : (
                  <div
                    style={{
                      ...ITEM_BASE,
                      background: selOposicion?.id === op.id ? '#fff7ed' : 'transparent',
                      border: selOposicion?.id === op.id ? '1px solid #fdba74' : '1px solid transparent',
                    }}
                    onClick={() => handleSelectOposicion(op)}
                  >
                    <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>►</span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selOposicion?.id === op.id ? 600 : 400, color: selOposicion?.id === op.id ? '#ea580c' : '#374151' }}>
                      {op.nombre}
                    </span>
                    <button title="Editar" onClick={(e) => { e.stopPropagation(); setEditingOposicion(op); setAddingOposicion(false); }} style={{ ...BTN_ICON, color: '#9ca3af' }}>✎</button>
                    <button title="Eliminar" onClick={(e) => { e.stopPropagation(); handleDeleteOposicion(op.id); }} style={{ ...BTN_ICON, color: '#fca5a5' }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Temas (primer nivel) ── */}
        <div style={COL}>
          <div style={COL_HEADER}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>📋</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                Temas
              </h3>
              {selOposicion && (
                <span style={{ background: '#e5e7eb', color: '#6b7280', borderRadius: 999, fontSize: 11, fontWeight: 600, padding: '1px 7px' }}>{temas.length}</span>
              )}
            </div>
            {selOposicion && (
              <button onClick={() => { setAddingTema(true); setEditingTema(null); }} style={BTN_ADD}>+ Nuevo</button>
            )}
          </div>
          <div style={{ padding: '8px 0', flex: 1 }}>
            {!selOposicion ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>←</div>
                Selecciona una oposición
              </div>
            ) : (
              <>
                {addingTema && (
                  <div style={{ padding: '0 8px', marginBottom: 4 }}>
                    <InlineForm placeholder="Nombre del tema" onSave={handleCreateTema} onCancel={() => setAddingTema(false)} />
                  </div>
                )}
                {temas.length === 0 && !addingTema && (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>Sin temas aún</div>
                )}
                {temas.map((tema) => (
                  <div key={tema.id}>
                    {editingTema?.id === tema.id ? (
                      <div style={{ padding: '0 8px', marginBottom: 4 }}>
                        <InlineForm placeholder="Nombre" initialValue={tema.nombre} onSave={handleUpdateTema} onCancel={() => setEditingTema(null)} />
                      </div>
                    ) : (
                      <div
                        style={{
                          ...ITEM_BASE,
                        background: selTema?.id === tema.id ? '#fff7ed' : 'transparent',
                        border: selTema?.id === tema.id ? '1px solid #fdba74' : '1px solid transparent',
                      }}
                      onClick={() => handleSelectTema(tema)}
                    >
                      <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>►</span>
                      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selTema?.id === tema.id ? 600 : 400, color: selTema?.id === tema.id ? '#ea580c' : '#374151' }}>
                          {tema.nombre}
                        </span>
                        <button title="Editar" onClick={(e) => { e.stopPropagation(); setEditingTema(tema); setAddingTema(false); }} style={{ ...BTN_ICON, color: '#9ca3af' }}>✎</button>
                        <button title="Eliminar" onClick={(e) => { e.stopPropagation(); handleDeleteTema(tema.id); }} style={{ ...BTN_ICON, color: '#fca5a5' }}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Bloques ── */}
        <div style={COL}>
          <div style={COL_HEADER}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>📄</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                Bloques
              </h3>
              {selTema && (
                <span style={{ background: '#e5e7eb', color: '#6b7280', borderRadius: 999, fontSize: 11, fontWeight: 600, padding: '1px 7px' }}>{bloques.length}</span>
              )}
            </div>
            {selTema && (
              <button onClick={() => { setAddingBloque(true); setEditingBloque(null); }} style={BTN_ADD}>+ Nuevo</button>
            )}
          </div>
          <div style={{ padding: '8px 0', flex: 1 }}>
            {!selTema ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>←</div>
                Selecciona un tema
              </div>
            ) : (
              <>
                {addingBloque && (
                  <div style={{ padding: '0 8px', marginBottom: 4 }}>
                    <InlineForm placeholder="Nombre del bloque" onSave={handleCreateBloque} onCancel={() => setAddingBloque(false)} />
                  </div>
                )}
                {bloques.length === 0 && !addingBloque && (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>Sin bloques aún</div>
                )}
                {bloques.map((bloque) => (
                  <div key={bloque.id}>
                    {editingBloque?.id === bloque.id ? (
                      <div style={{ padding: '0 8px', marginBottom: 4 }}>
                        <InlineForm placeholder="Nombre" initialValue={bloque.nombre} onSave={handleUpdateBloque} onCancel={() => setEditingBloque(null)} />
                      </div>
                    ) : (
                      <div style={{ ...ITEM_BASE, cursor: 'default', border: '1px solid transparent' }}>
                        <span style={{ fontSize: '0.75rem', color: '#d1d5db', lineHeight: 1 }}>▪</span>
                        <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{bloque.nombre}</span>
                        <button title="Editar" onClick={() => { setEditingBloque(bloque); setAddingBloque(false); }} style={{ ...BTN_ICON, color: '#9ca3af' }}>✎</button>
                        <button title="Eliminar" onClick={() => handleDeleteBloque(bloque.id)} style={{ ...BTN_ICON, color: '#fca5a5' }}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── Panel ajustes de la oposición seleccionada ── */}
      {selOposicion && (
        <div style={{ marginTop: 16, background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem' }}>⏱</span>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 2 }}>
              Tiempo oficial del examen — <span style={{ color: '#ea580c' }}>{selOposicion.nombre}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Pre-rellena el campo duración en el simulacro. Deja vacío si no hay límite oficial.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <input
              type="number"
              min="1"
              max="600"
              placeholder="Sin límite"
              value={tiempoLimiteInput}
              onChange={(e) => { setTiempoLimiteInput(e.target.value); setMensajeTiempo(null); }}
              style={{ width: 110, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', outline: 'none' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>min</span>
            <button
              onClick={handleGuardarTiempoLimite}
              disabled={guardandoTiempo}
              style={{ padding: '7px 16px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', cursor: guardandoTiempo ? 'not-allowed' : 'pointer', opacity: guardandoTiempo ? 0.7 : 1 }}
            >
              {guardandoTiempo ? 'Guardando…' : 'Guardar'}
            </button>
            {mensajeTiempo && (
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: mensajeTiempo.tipo === 'ok' ? '#166534' : '#dc2626', background: mensajeTiempo.tipo === 'ok' ? '#dcfce7' : '#fee2e2', padding: '4px 10px', borderRadius: 20 }}>
                {mensajeTiempo.texto}
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}