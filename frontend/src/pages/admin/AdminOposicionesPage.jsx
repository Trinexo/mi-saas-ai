import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';

const P = '#7c3aed';

const SECTION = {
  background: '#fff', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: 20,
};
const TH = {
  padding: '10px 14px', fontWeight: 600, color: '#64748b',
  borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc',
  fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.05em',
};
const TD = {
  padding: '11px 14px', color: '#1e293b',
  borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', verticalAlign: 'middle',
};

const ESTADO_STYLES = {
  activa:    { background: '#dcfce7', color: '#166534' },
  borrador:  { background: '#f3f4f6', color: '#374151' },
  inactiva:  { background: '#fee2e2', color: '#991b1b' },
};

const MODAL_OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const emptyForm = { nombre: '', descripcion: '', categoria: '', estado: 'activa' };

export default function AdminOposicionesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [categoria, setCategoria] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modal crear/editar
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.listOposicionesConStats(token, {
        q: q || undefined,
        estado: estado || undefined,
        categoria: categoria || undefined,
        page,
        page_size: PAGE_SIZE,
      });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch {
      setError('No se pudieron cargar las oposiciones.');
    } finally {
      setLoading(false);
    }
  }, [token, q, estado, categoria, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create'); };
  const openEdit = (op) => {
    setEditTarget(op);
    setForm({ nombre: op.nombre, descripcion: op.descripcion ?? '', categoria: op.categoria ?? '', estado: op.estado ?? 'activa' });
    setFormError('');
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditTarget(null); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    setSaving(true); setFormError('');
    try {
      if (modal === 'create') {
        await adminApi.createOposicion(token, form);
      } else {
        await adminApi.updateOposicion(token, editTarget.id, form);
      }
      closeModal();
      load();
    } catch (e) {
      setFormError(e?.message ?? 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteOposicion(token, deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      alert(e?.message ?? 'Error al eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ padding: 28 }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Oposiciones</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
            Gestiona las oposiciones disponibles en la plataforma
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: P, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          + Nueva oposición
        </button>
      </div>

      {/* Filtros */}
      <div style={{ ...SECTION, padding: '14px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input
          value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscar…"
          style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
        />
        <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#374151' }}>
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="borrador">Borrador</option>
          <option value="inactiva">Inactiva</option>
        </select>
        <input
          value={categoria} onChange={e => { setCategoria(e.target.value); setPage(1); }} placeholder="Categoría…"
          style={{ flex: '1 1 140px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }}
        />
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>
      )}

      {/* Tabla */}
      <div style={SECTION}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando…</p>
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Sin resultados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Nombre</th>
                  <th style={TH}>Categoría</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Preguntas</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Tests</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Accesos</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(op => (
                  <tr key={op.id} style={{ transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={TD}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{op.nombre}</div>
                      {op.descripcion && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{op.descripcion}</div>}
                    </td>
                    <td style={{ ...TD, color: '#6b7280' }}>{op.categoria || '—'}</td>
                    <td style={TD}>
                      <span style={{ ...ESTADO_STYLES[op.estado] ?? ESTADO_STYLES.activa, borderRadius: 12, padding: '2px 10px', fontSize: '0.77rem', fontWeight: 700 }}>
                        {op.estado || 'activa'}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right', fontWeight: 600 }}>{(op.total_preguntas ?? 0).toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{(op.total_tests ?? 0).toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{(op.total_accesos ?? 0).toLocaleString()}</td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <button
                        onClick={() => openEdit(op)}
                        style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', marginRight: 6, fontWeight: 600, color: '#374151' }}
                      >Editar</button>
                      <button
                        onClick={() => setDeleteTarget(op)}
                        style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}
                      >Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>
              ‹
            </button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}>
              ›
            </button>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div style={MODAL_OVERLAY} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
              {modal === 'create' ? 'Nueva oposición' : 'Editar oposición'}
            </h3>

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Nombre *</label>
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', marginBottom: 14 }} />

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={2}
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', marginBottom: 14, resize: 'vertical' }} />

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Categoría</label>
            <input value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} placeholder="Ej: Administración, Sanidad…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', marginBottom: 14 }} />

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Estado</label>
            <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', marginBottom: 20 }}>
              <option value="activa">Activa</option>
              <option value="borrador">Borrador</option>
              <option value="inactiva">Inactiva</option>
            </select>

            {formError && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0 0 12px' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: P, color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div style={MODAL_OVERLAY} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 800, color: '#111827' }}>¿Eliminar oposición?</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.9rem' }}>
              Se eliminará <strong>{deleteTarget.nombre}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
