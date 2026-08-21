import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { accesosApi } from '../../services/accesosApi';
import { catalogApi } from '../../services/catalogApi';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';
import { getErrorMessage } from '../../services/api';

const TH   = { textAlign: 'left', padding: '7px 12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 13 };
const TD   = { padding: '7px 12px', borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: 14 };
const CARD = { background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: 20 };

const ESTADO_BADGE = {
  activo:    { bg: '#dcfce7', color: '#166534' },
  cancelado: { bg: '#fee2e2', color: '#991b1b' },
  expirado:  { bg: '#f3f4f6', color: '#6b7280' },
};
const ALL_MODELS = ['experto', 'guiado'];
const MODEL_LABELS = { experto: 'Modo Experto', guiado: 'Modo Albacer / Guiado' };
function normalizeModels(access) {
  const models = Array.isArray(access?.modelos_disponibles)
    ? access.modelos_disponibles.filter((model) => ALL_MODELS.includes(model))
    : [];
  if (models.length) return models;
  if (ALL_MODELS.includes(access?.modo_activo)) return [access.modo_activo];
  return access?.modo_preparacion === 'experto' ? ['experto'] : ['guiado'];
}

export default function AdminAccesosPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [accesos, setAccesos] = useState([]);
  const [pagination, setPagination] = useState({});
  const [oposiciones, setOposiciones] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20, email: '', oposicionId: searchParams.get('oposicion_id') ?? '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  // Modal asignar
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    email: '',
    oposicionId: '',
    fechaFin: '',
    precioPagado: '',
    notas: '',
    tipoAlumno: 'libre',
    modoPreparacion: 'albacer',
    modelos: ['experto', 'guiado'],
    modoActivo: 'guiado',
    motivo: 'Asignación manual desde administración',
  });
  const [saving, setSaving] = useState(false);
  // Modal editar
  const [editAcceso, setEditAcceso] = useState(null);
  const [editForm, setEditForm] = useState({
    fechaFin: '',
    precioPagado: '',
    notas: '',
    estado: 'activo',
    tipoAlumno: 'libre',
    modoPreparacion: 'albacer',
    modelos: ['guiado'],
    modoActivo: 'guiado',
    motivo: 'Actualización manual desde administración',
  });
  const [editSaving, setEditSaving] = useState(false);

  const loadOposiciones = async () => {
    try {
      const data = await catalogApi.getOposiciones(token);
      setOposiciones(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (_) { /* ignore */ }
  };

  const loadStats = async () => {
    try {
      const res = await accesosApi.getStats(token);
      if (res) setStats(res);
    } catch (_) { /* ignore */ }
  };

  const loadAccesos = async (f = filters) => {
    setLoading(true);
    setError('');
    try {
      const query = { page: f.page, page_size: f.pageSize };
      if (f.email)       query.email        = f.email;
      if (f.oposicionId) query.oposicion_id = f.oposicionId;
      const res = await accesosApi.listAccesos(token, query);
      const lista = Array.isArray(res) ? res : (res?.items ?? []);
      const pag   = res?.pagination ?? {};
      setAccesos(lista);
      setPagination(pag);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOposiciones();
    loadStats();
    loadAccesos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    loadAccesos(updated);
  };

  const handleReset = () => {
    const reset = { page: 1, pageSize: 20, email: '', oposicionId: '' };
    setFilters(reset);
    loadAccesos(reset);
  };

  const handleCancelar = async (userId, oposicionId) => {
    if (!window.confirm('¿Cancelar acceso de este usuario a esta oposición?')) return;
    setError('');
    try {
      await accesosApi.cancelarAcceso(token, userId, oposicionId);
      setMsg('Acceso cancelado correctamente');
      loadAccesos();
      loadStats();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const openEdit = (a) => {
    setEditAcceso(a);
    setEditForm({
      fechaFin:     a.fecha_fin ? new Date(a.fecha_fin).toISOString().slice(0, 10) : '',
      precioPagado: a.precio_pagado != null ? String(a.precio_pagado) : '',
      notas:        a.notas ?? '',
      estado:       a.estado ?? 'activo',
      tipoAlumno:   a.tipo_alumno ?? 'libre',
      modoPreparacion: a.modo_preparacion ?? 'albacer',
      modelos: normalizeModels(a),
      modoActivo: a.modo_activo ?? null,
      motivo: 'Actualización manual desde administración',
    });
    setError('');
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setError('');
    try {
      if (!editForm.modelos.length) throw new Error('Selecciona al menos un modelo');
      if (editForm.modoActivo === null && editForm.modelos.length === 1) throw new Error('Selecciona el modo activo');
      if (editForm.modoActivo !== null && !editForm.modelos.includes(editForm.modoActivo)) throw new Error('El modo activo debe estar incluido en los modelos');
      const originalModels = normalizeModels(editAcceso);
      const originalMode = editAcceso.modo_activo ?? null;
      const modelsChanged = JSON.stringify(originalModels) !== JSON.stringify(editForm.modelos) || originalMode !== editForm.modoActivo;
      if (modelsChanged) {
        await accesosApi.modificarModelosAdministrativo(token, editAcceso.id, {
          modelos: editForm.modelos,
          modoActivo: editForm.modoActivo,
          motivo: editForm.motivo.trim() || 'Actualización manual desde administración',
        });
      }
      const payload = {
        estado:       editForm.estado,
        fechaFin:     editForm.fechaFin     || null,
        precioPagado: editForm.precioPagado ? Number(editForm.precioPagado) : null,
        notas:        editForm.notas        || null,
        tipoAlumno:   editForm.tipoAlumno,
        motivo:       editForm.motivo.trim() || 'Actualización manual desde administración',
      };
      const legacyChanged = editForm.estado !== editAcceso.estado
        || editForm.tipoAlumno !== (editAcceso.tipo_alumno ?? 'libre')
        || payload.fechaFin !== (editAcceso.fecha_fin ? new Date(editAcceso.fecha_fin).toISOString().slice(0, 10) : null)
        || payload.precioPagado !== (editAcceso.precio_pagado != null ? Number(editAcceso.precio_pagado) : null)
        || payload.notas !== (editAcceso.notas ?? null);
      if (legacyChanged) {
        await accesosApi.updateAcceso(token, editAcceso.usuario_id, editAcceso.oposicion_id, payload);
      }
      setMsg('Acceso actualizado correctamente');
      setEditAcceso(null);
      loadAccesos();
      loadStats();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setEditSaving(false);
    }
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!form.email || !form.oposicionId) { setError('Email y oposición son obligatorios'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { email: form.email.trim(), oposicionId: form.oposicionId };
      if (form.fechaFin)     payload.fechaFin      = form.fechaFin;
      if (form.precioPagado) payload.precioPagado  = Number(form.precioPagado);
      if (form.notas)        payload.notas         = form.notas;
      payload.tipoAlumno = form.tipoAlumno;
      payload.modoPreparacion = form.modoPreparacion;
      payload.modelos = form.modelos;
      payload.modoActivo = form.modoActivo;
      payload.motivo = form.motivo.trim() || 'Asignación manual desde administración';
      await accesosApi.asignarAcceso(token, payload);
      setMsg('Acceso asignado correctamente');
      setShowModal(false);
      setForm({ email: '', oposicionId: '', fechaFin: '', precioPagado: '', notas: '', tipoAlumno: 'libre', modoPreparacion: 'albacer', modelos: ['experto', 'guiado'], modoActivo: 'guiado', modelos_disponibles: ['experto', 'guiado'], motivo: 'Asignación manual desde administración' });
      loadAccesos();
      loadStats();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((pagination.total ?? 0) / (pagination.pageSize ?? filters.pageSize)));

  const toggleModels = (setter, current, model) => {
    const models = current.includes(model)
      ? current.filter((item) => item !== model)
      : [...current, model];
    if (!models.length) return;
    setter((previous) => ({
      ...previous,
      modelos: models,
      modoActivo: models.includes(previous.modoActivo) ? previous.modoActivo : models[0],
    }));
  };

  const renderModelFields = (state, setter, allowedModels = state.allowedModels ?? ALL_MODELS) => (
    <>
      <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
        <legend style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0 4px' }}>Modelos permitidos</legend>
        {allowedModels.map((model) => (
          <label key={model} style={{ display: 'block', fontSize: '0.82rem', margin: '4px 0' }}>
            <input
              type="checkbox"
              checked={state.modelos.includes(model)}
              onChange={() => toggleModels(setter, state.modelos, model)}
            />{' '}{MODEL_LABELS[model]}
          </label>
        ))}
      </fieldset>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
        Modo activo
        <select
          value={state.modoActivo ?? ''}
          onChange={(event) => setter((previous) => ({ ...previous, modoActivo: event.target.value }))}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff' }}
        >
          {state.modelos.length > 1 && <option value="">Pendiente de selección</option>}
          {state.modelos.map((model) => <option key={model} value={model}>{MODEL_LABELS[model]}</option>)}
        </select>
      </label>
    </>
  );

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#fef3c7', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🔑</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Gestión de accesos</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Asigna o cancela acceso de alumnos a cursos por oposición</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
        >
          + Asignar acceso
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Accesos activos',   value: stats.total_activos,       color: '#059669', bg: '#dcfce7' },
            { label: 'Usuarios con acceso', value: stats.usuarios_con_acceso, color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Nuevos (7d)',        value: stats.nuevos_7d,           color: '#f59e0b', bg: '#fef3c7' },
            { label: 'Nuevos (30d)',       value: stats.nuevos_30d,          color: '#d97706', bg: '#fff7ed' },
            { label: 'Ingresos (€)',       value: stats.ingresos_total !== null ? Number(stats.ingresos_total).toFixed(2) : '—', color: '#7c3aed', bg: '#f5f3ff' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 10, padding: '12px 16px', borderTop: `3px solid ${color}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mensajes */}
      {error && <div style={{ padding: '8px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 12 }}>⚠️ {error}</div>}
      {msg   && <div style={{ padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: '0.875rem', marginBottom: 12 }}>✓ {msg}</div>}

      {/* Filtros */}
      <div style={{ ...CARD, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 3 }}>Email del alumno</label>
            <input
              type="email"
              placeholder="alumno@ejemplo.com"
              value={filters.email}
              onChange={(e) => setFilters((p) => ({ ...p, email: e.target.value }))}
              style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', width: 220 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: 3 }}>Oposición</label>
            <select
              value={filters.oposicionId}
              onChange={(e) => setFilters((p) => ({ ...p, oposicionId: e.target.value }))}
              style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff' }}
            >
              <option value="">— Todas —</option>
              {oposiciones.map((op) => <option key={op.id} value={op.id}>{op.nombre}</option>)}
            </select>
          </div>
          <button
            onClick={handleFilter}
            style={{ padding: '6px 16px', borderRadius: 7, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Filtrar
          </button>
          <button
            onClick={handleReset}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={CARD}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>Cargando…</p>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={TH}>ID usuario</th>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>Oposición</th>
                  <th style={TH}>Alumno</th>
                  <th style={TH}>Modelos / modo</th>
                  <th style={TH}>Estado</th>
                  <th style={TH}>Inicio</th>
                  <th style={TH}>Fin</th>
                  <th style={TH}>Precio (€)</th>
                  <th style={TH}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accesos.length === 0 && (
                  <tr><td colSpan={10} style={{ ...TD, color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Sin resultados</td></tr>
                )}
                {accesos.map((a, i) => {
                  const badge = ESTADO_BADGE[a.estado] ?? ESTADO_BADGE.expirado;
                  return (
                    <tr key={i}>
                      <td style={TD}>{a.usuario_id}</td>
                      <td style={TD}>{a.usuario_nombre ?? '—'} <span style={{ color: '#9ca3af', fontSize: 12 }}>{a.usuario_email ?? ''}</span></td>
                      <td style={TD}>{a.oposicion_nombre ?? a.oposicion_id}</td>
                      <td style={TD}>
                        <span style={{ background: a.tipo_alumno === 'albacer' ? '#dcfce7' : '#f3f4f6', color: a.tipo_alumno === 'albacer' ? '#166534' : '#4b5563', padding: '2px 9px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 700 }}>
                          {a.tipo_alumno === 'albacer' ? 'Albacer' : 'Libre'}
                        </span>
                      </td>
                      <td style={TD}>
                        <div style={{ fontSize: '0.76rem', color: '#374151' }}>{normalizeModels(a).map((model) => MODEL_LABELS[model]).join(' · ')}</div>
                        <span style={{ background: a.modo_activo === 'guiado' ? '#ede9fe' : '#e0f2fe', color: a.modo_activo === 'guiado' ? '#5b21b6' : '#075985', padding: '2px 9px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700 }}>
                          {a.modo_activo ? `Activo: ${a.modo_activo === 'guiado' ? 'Albacer' : 'Experto'}` : 'Pendiente de selección'}
                        </span>
                      </td>
                      <td style={TD}>
                        <span style={{ ...badge, padding: '2px 9px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>{a.estado}</span>
                      </td>
                      <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>{a.fecha_inicio ? new Date(a.fecha_inicio).toLocaleDateString() : '—'}</td>
                      <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>{a.fecha_fin ? new Date(a.fecha_fin).toLocaleDateString() : 'Sin límite'}</td>
                      <td style={TD}>{a.precio_pagado !== null ? Number(a.precio_pagado).toFixed(2) : '—'}</td>
                      <td style={{ ...TD, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openEdit(a)}
                          style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Editar
                        </button>
                        {a.estado === 'activo' && (
                          <button
                            onClick={() => handleCancelar(a.usuario_id, a.oposicion_id)}
                            style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, gap: 8 }}>
          <button
            onClick={() => { const u = { ...filters, page: Math.max(1, filters.page - 1) }; setFilters(u); loadAccesos(u); }}
            disabled={filters.page <= 1}
            style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', opacity: filters.page <= 1 ? 0.4 : 1 }}
          >
            ← Anterior
          </button>
          <span style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
            Página {filters.page} de {totalPages} · {pagination.total ?? accesos.length} registros
          </span>
          <button
            onClick={() => { const u = { ...filters, page: Math.min(totalPages, filters.page + 1) }; setFilters(u); loadAccesos(u); }}
            disabled={filters.page >= totalPages}
            style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer', opacity: filters.page >= totalPages ? 0.4 : 1 }}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Modal: Editar acceso */}
      {editAcceso && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontWeight: 800, color: '#111827' }}>Editar acceso</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#6b7280' }}>
              {editAcceso.usuario_nombre ?? editAcceso.usuario_email} · <em>{editAcceso.oposicion_nombre}</em>
            </p>
            {error && <div style={{ padding: '7px 12px', background: '#fef2f2', borderRadius: 7, color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>⚠️ {error}</div>}
            <form onSubmit={handleEditar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Estado</label>
                <select
                  value={editForm.estado}
                  onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="activo">Activo</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="expirado">Expirado</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tipo de alumno</label>
                  <select
                    value={editForm.tipoAlumno}
                    onChange={(e) => setEditForm((p) => ({ ...p, tipoAlumno: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="libre">Libre</option>
                    <option value="albacer">Albacer</option>
                  </select>
                </div>
              </div>
              {renderModelFields(editForm, setEditForm, editAcceso?.modelos_disponibles_oposicion ?? ALL_MODELS)}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Fecha de fin</label>
                <input
                  type="date"
                  value={editForm.fechaFin}
                  onChange={(e) => setEditForm((p) => ({ ...p, fechaFin: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Motivo</label>
                <input value={editForm.motivo} onChange={(e) => setEditForm((p) => ({ ...p, motivo: e.target.value }))} required style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Precio pagado (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.precioPagado}
                  onChange={(e) => setEditForm((p) => ({ ...p, precioPagado: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  placeholder="ej. 29.99"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notas internas</label>
                <textarea
                  value={editForm.notas}
                  onChange={(e) => setEditForm((p) => ({ ...p, notas: e.target.value }))}
                  rows={2}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Pago por transferencia, beca, etc."
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setEditAcceso(null); setError(''); }}
                  style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.7 : 1 }}
                >
                  {editSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Asignar acceso */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 18px', fontWeight: 800, color: '#111827' }}>Asignar acceso a oposición</h3>
            {error && <div style={{ padding: '7px 12px', background: '#fef2f2', borderRadius: 7, color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>⚠️ {error}</div>}
            <form onSubmit={handleAsignar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Email del alumno *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  placeholder="alumno@ejemplo.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Oposición *</label>
                <select
                  required
                  value={form.oposicionId}
                   onChange={(e) => setForm((p) => {
                     const opposition = oposiciones.find((op) => String(op.id) === String(e.target.value));
                     const allowed = opposition?.modelos_disponibles ?? ALL_MODELS;
                     const modelos = p.modelos.filter((model) => allowed.includes(model));
                     return { ...p, oposicionId: e.target.value, modelos: modelos.length ? modelos : [allowed[0]], modoActivo: modelos.includes(p.modoActivo) ? p.modoActivo : allowed[0] };
                   })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">— Selecciona oposición —</option>
                  {oposiciones.map((op) => <option key={op.id} value={op.id}>{op.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Tipo de alumno</label>
                  <select
                    value={form.tipoAlumno}
                    onChange={(e) => setForm((p) => ({ ...p, tipoAlumno: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="libre">Libre</option>
                    <option value="albacer">Albacer</option>
                  </select>
                </div>
              </div>
              {renderModelFields(form, setForm, oposiciones.find((op) => String(op.id) === String(form.oposicionId))?.modelos_disponibles ?? ALL_MODELS)}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Fecha de fin (opcional)</label>
                <input
                  type="date"
                  value={form.fechaFin}
                  onChange={(e) => setForm((p) => ({ ...p, fechaFin: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Precio pagado (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precioPagado}
                  onChange={(e) => setForm((p) => ({ ...p, precioPagado: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  placeholder="ej. 29.99"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notas internas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                  rows={2}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Pago por transferencia, beca, etc."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Motivo</label>
                <input value={form.motivo} onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))} required style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #e5e7eb', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm({ email: '', oposicionId: '', fechaFin: '', precioPagado: '', notas: '', tipoAlumno: 'libre', modoPreparacion: 'albacer', modelos: ['experto', 'guiado'], modoActivo: 'guiado', modelos_disponibles: ['experto', 'guiado'], motivo: 'Asignación manual desde administración' }); setError(''); }}
                  style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Guardando…' : 'Asignar acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
