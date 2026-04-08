import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';

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
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>Catalogo</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Gestiona oposiciones, materias y temas</p>
      </div>
      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minHeight: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Oposiciones <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>{oposiciones.length}</span></h3>
            <button onClick={() => { setAddingOposicion(true); setEditingOposicion(null); }} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Nueva</button>
          </div>
          {addingOposicion && <InlineForm placeholder="Nombre de la oposicion" onSave={handleCreateOposicion} onCancel={() => setAddingOposicion(false)} />}
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
            {oposiciones.map((op) => (
              <li key={op.id} style={{ marginBottom: 2 }}>
                {editingOposicion?.id === op.id ? (
                  <InlineForm placeholder="Nombre" initialValue={op.nombre} onSave={handleUpdateOposicion} onCancel={() => setEditingOposicion(null)} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px', borderRadius: 6, background: selOposicion?.id === op.id ? '#eff6ff' : 'transparent', border: selOposicion?.id === op.id ? '1px solid #93c5fd' : '1px solid transparent', cursor: 'pointer' }}>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selOposicion?.id === op.id ? 600 : 400, color: selOposicion?.id === op.id ? '#1d4ed8' : '#374151' }} onClick={() => handleSelectOposicion(op)}>{op.nombre}</span>
                    <button title="Editar" onClick={() => { setEditingOposicion(op); setAddingOposicion(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>✎</button>
                    <button title="Eliminar" onClick={() => handleDeleteOposicion(op.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>✕</button>
                  </div>
                )}
              </li>
            ))}
            {oposiciones.length === 0 && <li style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '8px 0', textAlign: 'center' }}>Sin oposiciones aun</li>}
          </ul>
        </div>
        <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minHeight: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Materias {materias.length > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>{materias.length}</span>}</h3>
            {selOposicion && <button onClick={() => { setAddingMateria(true); setEditingMateria(null); }} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Nueva</button>}
          </div>
          {!selOposicion ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>Selecciona una oposicion</div>
          ) : (
            <>
              {addingMateria && <InlineForm placeholder="Nombre de la materia" onSave={handleCreateMateria} onCancel={() => setAddingMateria(false)} />}
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {materias.map((mat) => (
                  <li key={mat.id} style={{ marginBottom: 2 }}>
                    {editingMateria?.id === mat.id ? (
                      <InlineForm placeholder="Nombre" initialValue={mat.nombre} onSave={handleUpdateMateria} onCancel={() => setEditingMateria(null)} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px', borderRadius: 6, background: selMateria?.id === mat.id ? '#eff6ff' : 'transparent', border: selMateria?.id === mat.id ? '1px solid #93c5fd' : '1px solid transparent', cursor: 'pointer' }}>
                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: selMateria?.id === mat.id ? 600 : 400, color: selMateria?.id === mat.id ? '#1d4ed8' : '#374151' }} onClick={() => handleSelectMateria(mat)}>{mat.nombre}</span>
                        <button title="Editar" onClick={() => { setEditingMateria(mat); setAddingMateria(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>✎</button>
                        <button title="Eliminar" onClick={() => handleDeleteMateria(mat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>✕</button>
                      </div>
                    )}
                  </li>
                ))}
                {materias.length === 0 && <li style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '8px 0', textAlign: 'center' }}>Sin materias aun</li>}
              </ul>
            </>
          )}
        </div>
        <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minHeight: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Temas {temas.length > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>{temas.length}</span>}</h3>
            {selMateria && <button onClick={() => { setAddingTema(true); setEditingTema(null); }} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>+ Nuevo</button>}
          </div>
          {!selMateria ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af', fontSize: '0.85rem' }}>Selecciona una materia</div>
          ) : (
            <>
              {addingTema && <InlineForm placeholder="Nombre del tema" onSave={handleCreateTema} onCancel={() => setAddingTema(false)} />}
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {temas.map((tema) => (
                  <li key={tema.id} style={{ marginBottom: 2 }}>
                    {editingTema?.id === tema.id ? (
                      <InlineForm placeholder="Nombre" initialValue={tema.nombre} onSave={handleUpdateTema} onCancel={() => setEditingTema(null)} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px', borderRadius: 6 }}>
                        <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{tema.nombre}</span>
                        <button title="Editar" onClick={() => { setEditingTema(tema); setAddingTema(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>✎</button>
                        <button title="Eliminar" onClick={() => handleDeleteTema(tema.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>✕</button>
                      </div>
                    )}
                  </li>
                ))}
                {temas.length === 0 && <li style={{ color: '#9ca3af', fontSize: '0.85rem', padding: '8px 0', textAlign: 'center' }}>Sin temas aun</li>}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}