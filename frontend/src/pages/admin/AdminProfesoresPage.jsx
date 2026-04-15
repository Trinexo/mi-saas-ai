import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { useAuth } from '../../state/auth.jsx';

const TH = { textAlign: 'left', padding: '7px 12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 13 };
const TD = { padding: '7px 12px', borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: 14 };
const BTN_PRIMARY = { padding: '6px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
const BTN_SECONDARY = { padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const BTN_DANGER = { padding: '3px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' };
const BTN_SUCCESS = { padding: '6px 18px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' };

const TABS = ['Listado', 'Asignaciones'];

export default function AdminProfesoresPage() {
  const { token } = useAuth();

  // --- Tab navigation ---
  const [tab, setTab] = useState('Listado');

  // --- Mensajes globales ---
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // --- Listado de profesores ---
  const [data, setData] = useState({ items: [], pagination: {} });
  const [filters, setFilters] = useState({ q: '', page: 1, page_size: 20 });

  // --- Modal crear / editar ---
  const [showForm, setShowForm] = useState(false); // 'create' | profesorId | false
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  // --- Eliminar ---
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // --- Pestaña Asignaciones ---
  const [oposiciones, setOposiciones] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [profesor, setProfesor] = useState(null);
  const [newOposId, setNewOposId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(null);

  // --- Carga de profesores ---
  const loadProfesores = async (f = filters) => {
    setError('');
    try {
      const res = await adminApi.listProfesores(token, { q: f.q, page: f.page, page_size: f.page_size });
      if (res) setData(res);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  useEffect(() => {
    loadProfesores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]);

  useEffect(() => {
    catalogApi.getOposiciones()
      .then((d) => setOposiciones(Array.isArray(d) ? d : (d?.oposiciones ?? [])))
      .catch(() => {});
  }, []);

  // --- Buscar profesores ---
  const handleSearchList = (e) => {
    e.preventDefault();
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    loadProfesores(updated);
  };

  // --- Crear profesor ---
  const openCreateForm = () => {
    setForm({ nombre: '', email: '', password: '' });
    setShowForm('create');
    setError(''); setMsg('');
  };

  // --- Editar profesor ---
  const openEditForm = (prof) => {
    setForm({ nombre: prof.nombre, email: prof.email, password: '' });
    setShowForm(prof.id);
    setError(''); setMsg('');
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    setSaving(true);
    try {
      if (showForm === 'create') {
        await adminApi.createProfesor(token, { nombre: form.nombre, email: form.email, password: form.password });
        setMsg('Profesor creado correctamente');
      } else {
        const payload = {};
        if (form.nombre) payload.nombre = form.nombre;
        if (form.email) payload.email = form.email;
        await adminApi.updateProfesor(token, showForm, payload);
        setMsg('Profesor actualizado correctamente');
      }
      setShowForm(false);
      loadProfesores();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // --- Eliminar profesor ---
  const handleDelete = async (id) => {
    setError(''); setMsg('');
    setDeleting(id);
    try {
      await adminApi.deleteProfesor(token, id);
      setMsg('Profesor eliminado');
      setConfirmDelete(null);
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((p) => p.id !== id),
        pagination: { ...prev.pagination, total: Math.max(0, (prev.pagination.total || 1) - 1) },
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  // --- Pestaña Asignaciones ---
  const handleSearchAsignaciones = async (e) => {
    e.preventDefault();
    const q = searchEmail.trim();
    if (!q) return;
    setError(''); setMsg('');
    setProfesor(null);
    setSearching(true);
    try {
      const res = await adminApi.listProfesorAsignaciones(token, q);
      setProfesor(res);
      setNewOposId('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async () => {
    if (!newOposId || !profesor) return;
    setError(''); setMsg('');
    setAssigning(true);
    try {
      await adminApi.assignProfesorOposicion(token, {
        email: profesor.usuario.email,
        oposicionId: Number(newOposId),
      });
      const opos = oposiciones.find((o) => String(o.id) === String(newOposId));
      setProfesor((prev) => ({
        ...prev,
        asignaciones: [
          ...prev.asignaciones,
          { oposicion_id: Number(newOposId), oposicion_nombre: opos?.nombre ?? '—', creado_en: new Date().toISOString() },
        ],
      }));
      setMsg('Oposición asignada correctamente');
      setNewOposId('');
      // Actualizar conteo en el listado
      loadProfesores();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAsignacion = async (oposicionId) => {
    if (!profesor) return;
    setError(''); setMsg('');
    setRemoving(oposicionId);
    try {
      await adminApi.removeProfesorOposicion(token, {
        email: profesor.usuario.email,
        oposicionId,
      });
      setProfesor((prev) => ({
        ...prev,
        asignaciones: prev.asignaciones.filter((a) => a.oposicion_id !== oposicionId),
      }));
      setMsg('Asignación eliminada correctamente');
      loadProfesores();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemoving(null);
    }
  };

  const oposicionesDisponibles = profesor
    ? oposiciones.filter((o) => !profesor.asignaciones.some((a) => a.oposicion_id === o.id))
    : oposiciones;

  const totalPages = Math.max(1, Math.ceil((data.pagination.total || 0) / (data.pagination.pageSize || filters.page_size)));

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#dcfce7', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>👩‍🏫</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Gestión de profesores</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{data.pagination.total ?? 0} profesores registrados</p>
          </div>
        </div>
        {tab === 'Listado' && (
          <button onClick={openCreateForm} style={BTN_SUCCESS}>+ Nuevo profesor</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setMsg(''); }}
            style={{
              padding: '8px 20px',
              fontWeight: tab === t ? 700 : 500,
              fontSize: '0.875rem',
              color: tab === t ? '#1d4ed8' : '#6b7280',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #1d4ed8' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mensajes */}
      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 12 }}>
          <span>⚠️</span>{error}
        </div>
      )}
      {msg && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: '0.875rem', marginBottom: 12 }}>
          <span>✓</span>{msg}
        </div>
      )}

      {/* ========== FORMULARIO CREAR / EDITAR (inline) ========== */}
      {showForm && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 16, background: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
            {showForm === 'create' ? 'Crear nuevo profesor' : 'Editar profesor'}
          </h3>
          <form onSubmit={handleSaveForm} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 180px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Nombre</span>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                required={showForm === 'create'}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 200px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required={showForm === 'create'}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem' }}
              />
            </label>
            {showForm === 'create' && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 160px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Contraseña</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem' }}
                />
              </label>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" disabled={saving} style={{ ...BTN_PRIMARY, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando…' : showForm === 'create' ? 'Crear' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={BTN_SECONDARY}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ========== TAB: LISTADO ========== */}
      {tab === 'Listado' && (
        <>
          {/* Buscador */}
          <form onSubmit={handleSearchList} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              style={{ flex: '1 1 220px', padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
            />
            <button type="submit" style={BTN_PRIMARY}>Buscar</button>
            <button
              type="button"
              style={BTN_SECONDARY}
              onClick={() => {
                const reset = { q: '', page: 1, page_size: 20 };
                setFilters(reset);
                loadProfesores(reset);
              }}
            >
              Limpiar
            </button>
          </form>

          {/* Tabla */}
          <div style={{ overflow: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={TH}>ID</th>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>Email</th>
                  <th style={TH}>Oposiciones</th>
                  <th style={TH}>Registro</th>
                  <th style={TH}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr><td colSpan={6} style={TD}>Sin resultados</td></tr>
                )}
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td style={TD}>{p.id}</td>
                    <td style={TD}>{p.nombre}</td>
                    <td style={TD}>{p.email}</td>
                    <td style={TD}>
                      <span style={{ background: p.oposicionesCount > 0 ? '#dcfce7' : '#f3f4f6', color: p.oposicionesCount > 0 ? '#166534' : '#6b7280', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                        {p.oposicionesCount}
                      </span>
                    </td>
                    <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>
                      {p.fechaRegistro ? new Date(p.fechaRegistro).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => openEditForm(p)}
                          style={{ ...BTN_SECONDARY, fontSize: '0.78rem', padding: '3px 10px' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => { setSearchEmail(p.email); setTab('Asignaciones'); setProfesor(null); }}
                          style={{ ...BTN_SECONDARY, fontSize: '0.78rem', padding: '3px 10px', color: '#059669', borderColor: '#6ee7b7' }}
                          title="Gestionar oposiciones asignadas"
                        >
                          Oposiciones
                        </button>
                        {confirmDelete === p.id ? (
                          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting === p.id}
                              style={{ ...BTN_DANGER, background: '#dc2626', color: '#fff', border: 'none' }}
                            >
                              {deleting === p.id ? '…' : 'Confirmar'}
                            </button>
                            <button onClick={() => setConfirmDelete(null)} style={{ ...BTN_SECONDARY, fontSize: '0.78rem', padding: '3px 8px' }}>
                              No
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(p.id)} style={{ ...BTN_DANGER }}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                style={{ ...BTN_SECONDARY, fontSize: '0.8rem', padding: '4px 12px', opacity: filters.page <= 1 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>
                {filters.page} / {totalPages}
              </span>
              <button
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                style={{ ...BTN_SECONDARY, fontSize: '0.8rem', padding: '4px 12px', opacity: filters.page >= totalPages ? 0.4 : 1 }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* ========== TAB: ASIGNACIONES ========== */}
      {tab === 'Asignaciones' && (
        <>
          <form onSubmit={handleSearchAsignaciones} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <input
              type="email"
              placeholder="Email del profesor..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              required
              style={{ flex: '1 1 260px', padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
            />
            <button type="submit" disabled={searching} style={{ ...BTN_PRIMARY, opacity: searching ? 0.7 : 1 }}>
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
            {profesor && (
              <button
                type="button"
                onClick={() => { setProfesor(null); setSearchEmail(''); setError(''); setMsg(''); }}
                style={BTN_SECONDARY}
              >
                Limpiar
              </button>
            )}
          </form>

          {profesor && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              {/* Info */}
              <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ background: '#dcfce7', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#166534', fontSize: '1rem', flexShrink: 0 }}>
                  {(profesor.usuario.nombre ?? '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{profesor.usuario.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{profesor.usuario.email}</div>
                </div>
                <span style={{ marginLeft: 'auto', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>profesor</span>
              </div>

              {/* Tabla de asignaciones */}
              <div style={{ padding: '16px 16px 0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: 8 }}>
                  Oposiciones asignadas ({profesor.asignaciones.length})
                </div>
                {profesor.asignaciones.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 16px' }}>Sin asignaciones.</p>
                ) : (
                  <div style={{ overflow: 'auto', marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr>
                          <th style={TH}>Oposición</th>
                          <th style={TH}>Asignada el</th>
                          <th style={{ ...TH, width: 80, textAlign: 'center' }}>Quitar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profesor.asignaciones.map((a) => (
                          <tr key={a.oposicion_id}>
                            <td style={TD}>{a.oposicion_nombre}</td>
                            <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>
                              {a.creado_en ? new Date(a.creado_en).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ ...TD, textAlign: 'center' }}>
                              <button
                                onClick={() => handleRemoveAsignacion(a.oposicion_id)}
                                disabled={removing === a.oposicion_id}
                                title="Quitar asignación"
                                style={{ ...BTN_DANGER, opacity: removing === a.oposicion_id ? 0.5 : 1 }}
                              >
                                {removing === a.oposicion_id ? '…' : '✕'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Formulario nueva asignación */}
              <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', flexShrink: 0 }}>Añadir oposición:</span>
                <select
                  value={newOposId}
                  onChange={(e) => setNewOposId(e.target.value)}
                  disabled={assigning || oposicionesDisponibles.length === 0}
                  style={{ flex: '1 1 220px', padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff' }}
                >
                  <option value="">
                    {oposicionesDisponibles.length === 0 ? '— Todas las oposiciones asignadas —' : '— Selecciona oposición —'}
                  </option>
                  {oposicionesDisponibles.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!newOposId || assigning}
                  style={{ ...BTN_SUCCESS, opacity: newOposId && !assigning ? 1 : 0.5, cursor: newOposId && !assigning ? 'pointer' : 'not-allowed' }}
                >
                  {assigning ? 'Asignando…' : 'Asignar'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
