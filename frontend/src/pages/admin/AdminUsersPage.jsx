import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { useAuth } from '../../state/auth.jsx';

const ROLES = ['alumno', 'editor', 'revisor', 'admin'];

const ROLE_BADGE = {
  alumno: { background: '#f3f4f6', color: '#374151' },
  editor: { background: '#dbeafe', color: '#1d4ed8' },
  revisor: { background: '#fef9c3', color: '#a16207' },
  admin: { background: '#fee2e2', color: '#b91c1c' },
};

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();

  const [data, setData] = useState({ items: [], pagination: {} });
  const [filters, setFilters] = useState({ role: '', q: '', page: 1, page_size: 20 });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(null);

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

  const totalPages = Math.max(1, Math.ceil((data.pagination.total || 0) / (data.pagination.pageSize || filters.page_size)));

  return (
    <section className="card">
      <h2>Gestión de usuarios</h2>

      {/* Filtros */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={filters.q}
          onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          style={{ flex: '1 1 200px', padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
        >
          <option value="">— Todos los roles —</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button type="submit">Buscar</button>
        <button
          type="button"
          onClick={() => {
            const reset = { role: '', q: '', page: 1, page_size: 20 };
            setFilters(reset);
            load(reset);
          }}
        >
          Limpiar
        </button>
      </form>

      {error && <p style={{ color: '#c00', marginBottom: '0.75rem' }}>{error}</p>}
      {msg && <p style={{ color: '#2a7', marginBottom: '0.75rem' }}>{msg}</p>}

      {/* Tabla */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol actual</th>
              <th>Registro</th>
              <th>Cambiar rol</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6}>Sin resultados</td>
              </tr>
            )}
            {data.items.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
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
                <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '—'}
                </td>
                <td>
                  {u.id === me?.id ? (
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>— (tú)</span>
                  ) : (
                    <select
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
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
      <div className="row" style={{ marginTop: '0.75rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={filters.page <= 1}
        >
          Anterior
        </button>
        <span>Página {filters.page} de {totalPages} · {data.pagination.total ?? 0} usuarios</span>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          disabled={filters.page >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
