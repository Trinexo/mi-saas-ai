import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { subscriptionApi } from '../../services/subscriptionApi';
import { useAuth } from '../../state/auth.jsx';

const ROLES = ['alumno', 'admin'];
const PLANES = ['free', 'pro', 'elite'];

const TH = { textAlign: 'left', padding: '7px 12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 13 };
const TD = { padding: '7px 12px', borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: 14 };

const ROLE_BADGE = {
  alumno:   { background: '#f3f4f6', color: '#374151' },
  profesor: { background: '#dcfce7', color: '#166534' },
  admin:    { background: '#fee2e2', color: '#b91c1c' },
};

const PLAN_BADGE = {
  free:  { background: '#f3f4f6', color: '#6b7280' },
  pro:   { background: '#eff6ff', color: '#1d4ed8' },
  elite: { background: '#fef9c3', color: '#92400e' },
};

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();

  const [data, setData] = useState({ items: [], pagination: {} });
  const [filters, setFilters] = useState({ role: '', q: '', page: 1, page_size: 20, exclude_role: 'profesor' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(null);
  const [savingPlan, setSavingPlan] = useState(null);

  // Selección múltiple
  const [selected, setSelected] = useState(new Set());

  // Confirmación de borrado individual
  const [confirmDelete, setConfirmDelete] = useState(null); // userId
  const [deleting, setDeleting] = useState(null); // userId | 'bulk'

  // Acción masiva
  const [bulkRole, setBulkRole] = useState('');
  const [bulkPlan, setBulkPlan] = useState('');
  const [bulkWorking, setBulkWorking] = useState(false);

  const load = async (f = filters) => {
    setError('');
    setSelected(new Set());
    try {
      const query = {};
      if (f.role) query.role = f.role;
      if (f.q) query.q = f.q;
      if (!f.role) query.exclude_role = 'profesor';
      query.page = f.page;
      query.page_size = f.page_size;
      const res = await adminApi.listUsers(token, query);
      if (res) setData(res);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    load(updated);
  };

  // --- Selección ---
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableItems = data.items.filter((u) => String(u.id) !== String(me?.id));

  const allSelected =
    selectableItems.length > 0 && selectableItems.every((u) => selected.has(String(u.id)));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableItems.map((u) => String(u.id))));
    }
  };

  // --- Acciones individuales ---
  const handleRoleChange = async (userId, role) => {
    setError(''); setMsg('');
    setSaving(userId);
    try {
      await adminApi.updateUserRole(token, userId, role);
      setMsg('Rol actualizado correctamente');
      setData((prev) => ({
        ...prev,
        items: prev.items.map((u) => (u.id === userId ? { ...u, role } : u)),
      }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  const handlePlanChange = async (userId, plan) => {
    setError(''); setMsg('');
    setSavingPlan(userId);
    try {
      await subscriptionApi.assignPlan(token, userId, { plan });
      setMsg(`Plan actualizado a ${plan} correctamente`);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((u) => (u.id === userId ? { ...u, plan } : u)),
      }));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSavingPlan(null);
    }
  };

  const handleDelete = async (userId) => {
    setError(''); setMsg('');
    setDeleting(userId);
    try {
      await adminApi.deleteUser(token, userId);
      setMsg('Usuario eliminado correctamente');
      setConfirmDelete(null);
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((u) => String(u.id) !== String(userId)),
        pagination: { ...prev.pagination, total: (prev.pagination.total || 1) - 1 },
      }));
      setSelected((prev) => { const next = new Set(prev); next.delete(String(userId)); return next; });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeleting(null);
    }
  };

  // --- Acciones masivas ---
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setError(''); setMsg('');
    setBulkWorking(true);
    try {
      const ids = Array.from(selected).map(Number);
      const res = await adminApi.bulkUsers(token, { ids, action: 'delete' });
      setMsg(`${res?.affected ?? ids.length} usuarios eliminados`);
      setData((prev) => ({
        ...prev,
        items: prev.items.filter((u) => !selected.has(String(u.id))),
        pagination: { ...prev.pagination, total: Math.max(0, (prev.pagination.total || 0) - (res?.affected ?? 0)) },
      }));
      setSelected(new Set());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkRole = async () => {
    if (!bulkRole || selected.size === 0) return;
    setError(''); setMsg('');
    setBulkWorking(true);
    try {
      const ids = Array.from(selected).map(Number);
      const res = await adminApi.bulkUsers(token, { ids, action: 'set_role', value: bulkRole });
      setMsg(`Rol "${bulkRole}" asignado a ${res?.affected ?? ids.length} usuarios`);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((u) => selected.has(String(u.id)) ? { ...u, role: bulkRole } : u),
      }));
      setSelected(new Set());
      setBulkRole('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkPlan = async () => {
    if (!bulkPlan || selected.size === 0) return;
    setError(''); setMsg('');
    setBulkWorking(true);
    try {
      const ids = Array.from(selected).map(Number);
      const res = await adminApi.bulkUsers(token, { ids, action: 'set_plan', value: bulkPlan });
      setMsg(`Plan "${bulkPlan}" asignado a ${res?.affected ?? ids.length} usuarios`);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((u) => selected.has(String(u.id)) ? { ...u, plan: bulkPlan } : u),
      }));
      setSelected(new Set());
      setBulkPlan('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBulkWorking(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.pagination.total || 0) / (data.pagination.pageSize || filters.page_size)));

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#ede9fe', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>◉</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Gestión de usuarios</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{data.pagination.total ?? 0} usuarios registrados</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={filters.q}
          onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          style={{ flex: '1 1 200px', padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff' }}
        >
          <option value="">— Todos los roles —</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="submit"
          style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Buscar
        </button>
        <button
          type="button"
          style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          onClick={() => {
            const reset = { role: '', q: '', page: 1, page_size: 20, exclude_role: 'profesor' };
            setFilters(reset);
            load(reset);
          }}
        >
          Limpiar
        </button>
      </form>

      {error && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 12 }}><span>⚠️</span>{error}</div>}
      {msg && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: '0.875rem', marginBottom: 12 }}><span>✓</span>{msg}</div>}

      {/* Barra de acciones masivas */}
      {selected.size > 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e40af', marginRight: 4 }}>
            {selected.size} usuario{selected.size > 1 ? 's' : ''} seleccionado{selected.size > 1 ? 's' : ''}
          </span>

          {/* Cambio masivo de rol */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              disabled={bulkWorking}
              style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="">Cambiar rol…</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              onClick={handleBulkRole}
              disabled={!bulkRole || bulkWorking}
              style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: bulkRole ? '#1d4ed8' : '#93c5fd', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: bulkRole ? 'pointer' : 'not-allowed' }}
            >
              Aplicar rol
            </button>
          </div>

          {/* Cambio masivo de plan */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <select
              value={bulkPlan}
              onChange={(e) => setBulkPlan(e.target.value)}
              disabled={bulkWorking}
              style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: '0.82rem', background: '#fff' }}
            >
              <option value="">Cambiar plan…</option>
              {PLANES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={handleBulkPlan}
              disabled={!bulkPlan || bulkWorking}
              style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: bulkPlan ? '#059669' : '#6ee7b7', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: bulkPlan ? 'pointer' : 'not-allowed' }}
            >
              Aplicar plan
            </button>
          </div>

          {/* Eliminar masivo */}
          {confirmDelete === 'bulk' ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '4px 10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>¿Eliminar {selected.size} usuarios? Esta acción es irreversible.</span>
              <button onClick={handleBulkDelete} disabled={bulkWorking} style={{ padding: '2px 10px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                {bulkWorking ? 'Eliminando…' : 'Confirmar'}
              </button>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete('bulk')}
              disabled={bulkWorking}
              style={{ padding: '3px 12px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              🗑 Eliminar seleccionados
            </button>
          )}

          <button
            onClick={() => setSelected(new Set())}
            style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#fff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Deseleccionar
          </button>
        </div>
      )}

      {/* Tabla */}
      <div style={{ overflow: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 36 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  title="Seleccionar todos"
                  style={{ cursor: 'pointer', accentColor: '#1d4ed8' }}
                />
              </th>
              <th style={TH}>ID</th>
              <th style={TH}>Nombre</th>
              <th style={TH}>Email</th>
              <th style={TH}>Rol</th>
              <th style={TH}>Plan</th>
              <th style={TH}>Registro</th>
              <th style={TH}>Cambiar rol</th>
              <th style={TH}>Cambiar plan</th>
              <th style={TH}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={10} style={TD}>Sin resultados</td>
              </tr>
            )}
            {data.items.map((u) => {
              const isMe = String(u.id) === String(me?.id);
              const isSel = selected.has(String(u.id));
              const isConfirmDel = confirmDelete === u.id;
              return (
                <tr key={u.id} style={{ background: isSel ? '#eff6ff' : undefined }}>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    {isMe ? null : (
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelect(String(u.id))}
                        style={{ cursor: 'pointer', accentColor: '#1d4ed8' }}
                      />
                    )}
                  </td>
                  <td style={TD}>{u.id}</td>
                  <td style={TD}>{u.nombre}</td>
                  <td style={TD}>{u.email}</td>
                  <td style={TD}>
                    <span style={{ ...ROLE_BADGE[u.role], padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={TD}>
                    <span style={{ ...(PLAN_BADGE[u.plan] ?? PLAN_BADGE.free), padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                      {u.plan ?? 'free'}
                    </span>
                  </td>
                  <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>
                    {u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '—'}
                  </td>
                  <td style={TD}>
                    {isMe ? (
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>— (tú)</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={saving === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', background: '#fff' }}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={TD}>
                    {isMe ? (
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>— (tú)</span>
                    ) : (
                      <select
                        value={u.plan ?? 'free'}
                        disabled={savingPlan === u.id}
                        onChange={(e) => handlePlanChange(u.id, e.target.value)}
                        style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', background: '#fff' }}
                      >
                        {PLANES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                  </td>
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                    {isMe ? (
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>—</span>
                    ) : isConfirmDel ? (
                      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id}
                          style={{ padding: '2px 8px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          {deleting === u.id ? '…' : '✓ Sí, eliminar'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setMsg(''); setError(''); setConfirmDelete(u.id); }}
                        style={{ padding: '2px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        🗑 Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={filters.page <= 1}
          style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', opacity: filters.page <= 1 ? 0.4 : 1 }}
        >
          ← Anterior
        </button>
        <span style={{ fontSize: '0.8rem', color: '#6b7280', flex: 1, textAlign: 'center' }}>Página {filters.page} de {totalPages} · {data.pagination.total ?? 0} usuarios</span>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          disabled={filters.page >= totalPages}
          style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer', opacity: filters.page >= totalPages ? 0.4 : 1 }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

