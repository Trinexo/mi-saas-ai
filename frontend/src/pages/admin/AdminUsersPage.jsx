import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { subscriptionApi } from '../../services/subscriptionApi';
import { useAuth } from '../../state/auth.jsx';

const ROLES = ['alumno', 'editor', 'revisor', 'admin'];
const PLANES = ['free', 'pro', 'elite'];

const TH = { textAlign: 'left', padding: '7px 12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 13 };
const TD = { padding: '7px 12px', borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: 14 };

const ROLE_BADGE = {
  alumno:  { background: '#f3f4f6', color: '#374151' },
  editor:  { background: '#dbeafe', color: '#1d4ed8' },
  revisor: { background: '#fef9c3', color: '#a16207' },
  admin:   { background: '#fee2e2', color: '#b91c1c' },
};

const PLAN_BADGE = {
  free:  { background: '#f3f4f6', color: '#6b7280' },
  pro:   { background: '#eff6ff', color: '#1d4ed8' },
  elite: { background: '#fef9c3', color: '#92400e' },
};

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();

  const [data, setData] = useState({ items: [], pagination: {} });
  const [filters, setFilters] = useState({ role: '', q: '', page: 1, page_size: 20 });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(null);
  const [savingPlan, setSavingPlan] = useState(null);

  const load = async (f = filters) => {
    setError('');
    try {
      const query = {};
      if (f.role) query.role = f.role;
      if (f.q) query.q = f.q;
      query.page = f.page;
      query.page_size = f.page_size;
      const res = await adminApi.listUsers(token, query);
      if (res?.data) setData(res.data);
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

  const handleRoleChange = async (userId, role) => {
    setError('');
    setMsg('');
    setSaving(userId);
    try {
      await adminApi.updateUserRole(token, userId, role);
      setMsg(`Rol actualizado correctamente`);
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
    setError('');
    setMsg('');
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
            const reset = { role: '', q: '', page: 1, page_size: 20 };
            setFilters(reset);
            load(reset);
          }}
        >
          Limpiar
        </button>
      </form>

      {error && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 12 }}><span>⚠️</span>{error}</div>}
      {msg && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: '0.875rem', marginBottom: 12 }}><span>✓</span>{msg}</div>}

      {/* Tabla */}
      <div style={{ overflow: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={TH}>ID</th>
              <th style={TH}>Nombre</th>
              <th style={TH}>Email</th>
              <th style={TH}>Rol</th>
              <th style={TH}>Plan</th>
              <th style={TH}>Registro</th>
              <th style={TH}>Cambiar rol</th>
              <th style={TH}>Cambiar plan</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} style={TD}>Sin resultados</td>
              </tr>
            )}
            {data.items.map((u) => (
              <tr key={u.id}>
                <td style={TD}>{u.id}</td>
                <td style={TD}>{u.nombre}</td>
                <td style={TD}>{u.email}</td>
                <td style={TD}>
                  <span
                    style={{
                      ...ROLE_BADGE[u.role],
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
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
                  {u.id === me?.id ? (
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>— (tú)</span>
                  ) : (
                    <select
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', background: '#fff' }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={TD}>
                  {u.id === me?.id ? (
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>— (tú)</span>
                  ) : (
                    <select
                      value={u.plan ?? 'free'}
                      disabled={savingPlan === u.id}
                      onChange={(e) => handlePlanChange(u.id, e.target.value)}
                      style={{ padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', background: '#fff' }}
                    >
                      {PLANES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
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
