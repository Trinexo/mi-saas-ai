import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';

const COL = {
  background: '#fff',
  borderRadius: 12,
  padding: '0 0 8px',
  boxShadow: '0 1px 4px rgba(0,0,0,.07)',
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
  background: '#1d4ed8', color: '#fff', border: 'none',
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
        <button onClick={() => onSave(value.trim())} disabled={value.trim().length < 2} style={{ flex: 1, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
        <button onClick={onCancel} style={{ flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
      </div>
    </div>
  );
}

export default function AdminCatalogPage() {
  const { token } = useAuth();
  const [oposiciones, setOposiciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [selOposicion, setSelOposicion] = useState(null);
  const [selMateria, setSelMateria] = useState(null);
  const [addingOposicion, setAddingOposicion] = useState(false);
  const [editingOposicion, setEditingOposicion] = useState(null);
  const [addingMateria, setAddingMateria] = useState(false);
  const [editingMateria, setEditingMateria] = useState(null);
  const [addingTema, setAddingTema] = useState(false);
  const [editingTema, setEditingTema] = useState(null);
  const [error, setError] = useState('');

  const loadOposiciones = () =>
    catalogApi.getOposiciones().then(setOposiciones).catch(() => {});

  const loadMaterias = (opId) =>
    catalogApi.getMaterias(opId).then(setMaterias).catch(() => setMaterias([]));

  const loadTemas = (matId) =>
    catalogApi.getTemas(matId).then(setTemas).catch(() => setTemas([]));

  useEffect(() => { loadOposiciones(); }, []);

  const handleSelectOposicion = (op) => {
    setSelOposicion(op);
    setSelMateria(null);
    setTemas([]);
    setAddingMateria(false);
    setEditingMateria(null);
    loadMaterias(op.id);
  };

  const handleSelectMateria = (mat) => {
    setSelMateria(mat);
    setAddingTema(false);
    setEditingTema(null);
    loadTemas(mat.id);
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

  const handleDeleteOposicion = (id) => guardoConError(async () => {
    if (!window.confirm('Eliminar esta oposicion y todo su contenido?')) return;
    await adminApi.deleteOposicion(token, id);
    if (selOposicion?.id === id) { setSelOposicion(null); setMaterias([]); setSelMateria(null); setTemas([]); }
    loadOposiciones();
  });

  const handleCreateMateria = (nombre) => guardoConError(async () => {
    await adminApi.createMateria(token, { oposicion_id: selOposicion.id, nombre });
    setAddingMateria(false);
    loadMaterias(selOposicion.id);
  });

  const handleUpdateMateria = (nombre) => guardoConError(async () => {
    await adminApi.updateMateria(token, editingMateria.id, { nombre });
    setEditingMateria(null);
    loadMaterias(selOposicion.id);
  });

  const handleDeleteMateria = (id) => guardoConError(async () => {
    if (!window.confirm('Eliminar esta materia y todos sus temas?')) return;
    await adminApi.deleteMateria(token, id);
    if (selMateria?.id === id) { setSelMateria(null); setTemas([]); }
    loadMaterias(selOposicion.id);
  });

  const handleCreateTema = (nombre) => guardoConError(async () => {
    await adminApi.createTema(token, { materia_id: selMateria.id, nombre });
    setAddingTema(false);
    loadTemas(selMateria.id);
  });

  const handleUpdateTema = (nombre) => guardoConError(async () => {
    await adminApi.updateTema(token, editingTema.id, { nombre });
    setEditingTema(null);
    loadTemas(selMateria.id);
  });

  const handleDeleteTema = (id) => guardoConError(async () => {
    if (!window.confirm('Eliminar este tema?')) return;
    await adminApi.deleteTema(token, id);
    loadTemas(selMateria.id);
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Catálogo</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
          Gestiona la estructura: oposiciones → materias → temas
        </p>
      </div>

      {/* Breadcrumb de selección */}
      {(selOposicion || selMateria) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#6b7280', marginBottom: 14, background: '#f9fafb', borderRadius: 8, padding: '8px 14px', border: '1px solid #e5e7eb' }}>
          <span style={{ color: '#374151', fontWeight: 600 }}>📂 {selOposicion?.nombre}</span>
          {selMateria && (
            <>
              <span style={{ color: '#d1d5db' }}>›</span>
              <span style={{ color: '#374151', fontWeight: 600 }}>📋 {selMateria?.nombre}</span>
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
                      background: selOposicion?.id === op.id ? '#eff6ff' : 'transparent',
                      border: selOposicion?.id === op.id ? '1px solid #93c5fd' : '1px solid transparent',
                    }}
                    onClick={() => handleSelectOposicion(op)}
                  >
                    <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>►</span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selOposicion?.id === op.id ? 600 : 400, color: selOposicion?.id === op.id ? '#1d4ed8' : '#374151' }}>
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

        {/* ── Materias ── */}
        <div style={COL}>
          <div style={COL_HEADER}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>📋</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                Materias
              </h3>
              {selOposicion && (
                <span style={{ background: '#e5e7eb', color: '#6b7280', borderRadius: 999, fontSize: 11, fontWeight: 600, padding: '1px 7px' }}>{materias.length}</span>
              )}
            </div>
            {selOposicion && (
              <button onClick={() => { setAddingMateria(true); setEditingMateria(null); }} style={BTN_ADD}>+ Nueva</button>
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
                {addingMateria && (
                  <div style={{ padding: '0 8px', marginBottom: 4 }}>
                    <InlineForm placeholder="Nombre de la materia" onSave={handleCreateMateria} onCancel={() => setAddingMateria(false)} />
                  </div>
                )}
                {materias.length === 0 && !addingMateria && (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>Sin materias aún</div>
                )}
                {materias.map((mat) => (
                  <div key={mat.id}>
                    {editingMateria?.id === mat.id ? (
                      <div style={{ padding: '0 8px', marginBottom: 4 }}>
                        <InlineForm placeholder="Nombre" initialValue={mat.nombre} onSave={handleUpdateMateria} onCancel={() => setEditingMateria(null)} />
                      </div>
                    ) : (
                      <div
                        style={{
                          ...ITEM_BASE,
                          background: selMateria?.id === mat.id ? '#eff6ff' : 'transparent',
                          border: selMateria?.id === mat.id ? '1px solid #93c5fd' : '1px solid transparent',
                        }}
                        onClick={() => handleSelectMateria(mat)}
                      >
                        <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>►</span>
                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selMateria?.id === mat.id ? 600 : 400, color: selMateria?.id === mat.id ? '#1d4ed8' : '#374151' }}>
                          {mat.nombre}
                        </span>
                        <button title="Editar" onClick={(e) => { e.stopPropagation(); setEditingMateria(mat); setAddingMateria(false); }} style={{ ...BTN_ICON, color: '#9ca3af' }}>✎</button>
                        <button title="Eliminar" onClick={(e) => { e.stopPropagation(); handleDeleteMateria(mat.id); }} style={{ ...BTN_ICON, color: '#fca5a5' }}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Temas ── */}
        <div style={COL}>
          <div style={COL_HEADER}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>📄</span>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                Temas
              </h3>
              {selMateria && (
                <span style={{ background: '#e5e7eb', color: '#6b7280', borderRadius: 999, fontSize: 11, fontWeight: 600, padding: '1px 7px' }}>{temas.length}</span>
              )}
            </div>
            {selMateria && (
              <button onClick={() => { setAddingTema(true); setEditingTema(null); }} style={BTN_ADD}>+ Nuevo</button>
            )}
          </div>
          <div style={{ padding: '8px 0', flex: 1 }}>
            {!selMateria ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>←</div>
                Selecciona una materia
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
                      <div style={{ ...ITEM_BASE, cursor: 'default', border: '1px solid transparent' }}>
                        <span style={{ fontSize: '0.75rem', color: '#d1d5db', lineHeight: 1 }}>▪</span>
                        <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{tema.nombre}</span>
                        <button title="Editar" onClick={() => { setEditingTema(tema); setAddingTema(false); }} style={{ ...BTN_ICON, color: '#9ca3af' }}>✎</button>
                        <button title="Eliminar" onClick={() => handleDeleteTema(tema.id)} style={{ ...BTN_ICON, color: '#fca5a5' }}>✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}