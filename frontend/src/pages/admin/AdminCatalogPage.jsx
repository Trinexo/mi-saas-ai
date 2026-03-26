import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';

function InlineForm({ placeholder, onSave, onCancel, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, padding: '4px 8px' }}
        maxLength={200}
      />
      <button onClick={() => onSave(value.trim())} disabled={value.trim().length < 2}>Guardar</button>
      <button style={{ background: '#6b7280' }} onClick={onCancel}>Cancelar</button>
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

  // OPOSICION handlers
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
    if (!window.confirm('¿Eliminar esta oposición y todo su contenido?')) return;
    await adminApi.deleteOposicion(token, id);
    if (selOposicion?.id === id) { setSelOposicion(null); setMaterias([]); setSelMateria(null); setTemas([]); }
    loadOposiciones();
  });

  // MATERIA handlers
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
    if (!window.confirm('¿Eliminar esta materia y todos sus temas?')) return;
    await adminApi.deleteMateria(token, id);
    if (selMateria?.id === id) { setSelMateria(null); setTemas([]); }
    loadMaterias(selOposicion.id);
  });

  // TEMA handlers
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
    if (!window.confirm('¿Eliminar este tema?')) return;
    await adminApi.deleteTema(token, id);
    loadTemas(selMateria.id);
  });

  return (
    <div>
      <h2>Gestión del Catálogo</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* OPOSICIONES */}
        <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Oposiciones</h3>
            <button onClick={() => { setAddingOposicion(true); setEditingOposicion(null); }}>+ Nueva</button>
          </div>
          {addingOposicion && (
            <InlineForm
              placeholder="Nombre de la oposición"
              onSave={handleCreateOposicion}
              onCancel={() => setAddingOposicion(false)}
            />
          )}
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem' }}>
            {oposiciones.map((op) => (
              <li key={op.id} style={{ marginBottom: '4px' }}>
                {editingOposicion?.id === op.id ? (
                  <InlineForm
                    placeholder="Nombre"
                    initialValue={op.nombre}
                    onSave={handleUpdateOposicion}
                    onCancel={() => setEditingOposicion(null)}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 6px', borderRadius: '4px',
                      background: selOposicion?.id === op.id ? '#e0e7ff' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ flex: 1 }} onClick={() => handleSelectOposicion(op)}>{op.nombre}</span>
                    <button
                      title="Editar"
                      onClick={() => { setEditingOposicion(op); setAddingOposicion(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >✏️</button>
                    <button
                      title="Eliminar"
                      onClick={() => handleDeleteOposicion(op.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >🗑️</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* MATERIAS */}
        <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Materias</h3>
            {selOposicion && (
              <button onClick={() => { setAddingMateria(true); setEditingMateria(null); }}>+ Nueva</button>
            )}
          </div>
          {!selOposicion && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Selecciona una oposición</p>}
          {addingMateria && (
            <InlineForm
              placeholder="Nombre de la materia"
              onSave={handleCreateMateria}
              onCancel={() => setAddingMateria(false)}
            />
          )}
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem' }}>
            {materias.map((mat) => (
              <li key={mat.id} style={{ marginBottom: '4px' }}>
                {editingMateria?.id === mat.id ? (
                  <InlineForm
                    placeholder="Nombre"
                    initialValue={mat.nombre}
                    onSave={handleUpdateMateria}
                    onCancel={() => setEditingMateria(null)}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 6px', borderRadius: '4px',
                      background: selMateria?.id === mat.id ? '#e0e7ff' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ flex: 1 }} onClick={() => handleSelectMateria(mat)}>{mat.nombre}</span>
                    <button
                      title="Editar"
                      onClick={() => { setEditingMateria(mat); setAddingMateria(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >✏️</button>
                    <button
                      title="Eliminar"
                      onClick={() => handleDeleteMateria(mat.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >🗑️</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* TEMAS */}
        <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Temas</h3>
            {selMateria && (
              <button onClick={() => { setAddingTema(true); setEditingTema(null); }}>+ Nuevo</button>
            )}
          </div>
          {!selMateria && <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Selecciona una materia</p>}
          {addingTema && (
            <InlineForm
              placeholder="Nombre del tema"
              onSave={handleCreateTema}
              onCancel={() => setAddingTema(false)}
            />
          )}
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.75rem' }}>
            {temas.map((tema) => (
              <li key={tema.id} style={{ marginBottom: '4px' }}>
                {editingTema?.id === tema.id ? (
                  <InlineForm
                    placeholder="Nombre"
                    initialValue={tema.nombre}
                    onSave={handleUpdateTema}
                    onCancel={() => setEditingTema(null)}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px' }}>
                    <span style={{ flex: 1 }}>{tema.nombre}</span>
                    <button
                      title="Editar"
                      onClick={() => { setEditingTema(tema); setAddingTema(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >✏️</button>
                    <button
                      title="Eliminar"
                      onClick={() => handleDeleteTema(tema.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >🗑️</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
