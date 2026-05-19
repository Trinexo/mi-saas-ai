import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';

const SECTION = {
  background: '#fff', borderRadius: 16, padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: 20,
};
const TH = {
  padding: '0.5rem 0.75rem', fontWeight: 600, color: '#6b7280',
  borderBottom: '2px solid #e5e7eb', textAlign: 'left',
  fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em',
};
const TD = {
  padding: '0.6rem 0.75rem', color: '#111827',
  borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem',
};
const MODAL_OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const emptyForm = { nombre: '', color: '#6b7280', descripcion: '' };

export default function AdminEtiquetasPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.listEtiquetas(token, { q: q || undefined, page, page_size: PAGE_SIZE });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch { setError('No se pudieron cargar las etiquetas.'); }
    finally { setLoading(false); }
  }, [token, q, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create'); };
  const openEdit = (et) => {
    setEditTarget(et);
    setForm({ nombre: et.nombre, color: et.color ?? '#6b7280', descripcion: et.descripcion ?? '' });
    setFormError(''); setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditTarget(null); };

  const hexValid = (v) => /^#[0-9a-fA-F]{6}$/.test(v);

  const handleSave = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (!hexValid(form.color)) { setFormError('El color debe ser un hexadecimal válido (#rrggbb).'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = { nombre: form.nombre, color: form.color, descripcion: form.descripcion || null };
      if (modal === 'create') await adminApi.createEtiqueta(token, payload);
      else await adminApi.updateEtiqueta(token, editTarget.id, payload);
      closeModal(); load();
    } catch (e) { setFormError(e?.message ?? 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await adminApi.deleteEtiqueta(token, deleteTarget.id); setDeleteTarget(null); load(); }
    catch (e) { alert(e?.message ?? 'Error al eliminar.'); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
    borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', marginBottom: 14,
  };
  const labelStyle = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 4 };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Etiquetas</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>{total} etiqueta{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          + Nueva etiqueta
        </button>
      </div>

      {/* Filtro */}
      <div style={{ ...SECTION, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscar etiqueta..."
          style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.875rem', outline: 'none' }} />
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>}

      {/* Lista tipo grid con chips de color */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {items.map(et => (
            <div key={et.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fff', border: `2px solid ${et.color ?? '#e5e7eb'}`,
              borderRadius: 20, padding: '6px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: et.color ?? '#9ca3af', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{et.nombre}</span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({et.total_preguntas ?? 0})</span>
              <button onClick={() => openEdit(et)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280', padding: '0 2px' }}>Editar</button>
              <button onClick={() => setDeleteTarget(et)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#dc2626', padding: '0 2px' }}>Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabla detallada */}
      <div style={SECTION}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Cargando...</p>
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No hay etiquetas aún. Crea la primera.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={TH}>Etiqueta</th>
                  <th style={TH}>Color</th>
                  <th style={TH}>Descripción</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Preguntas</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(et => (
                  <tr key={et.id}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: et.color ?? '#9ca3af', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{et.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...TD, fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>{et.color ?? '-'}</td>
                    <td style={{ ...TD, color: '#6b7280' }}>{et.descripcion || '-'}</td>
                    <td style={{ ...TD, textAlign: 'right', fontWeight: 600 }}>{et.total_preguntas ?? 0}</td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <button onClick={() => openEdit(et)}
                        style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', marginRight: 6, fontWeight: 600, color: '#374151' }}>
                        Editar
                      </button>
                      <button onClick={() => setDeleteTarget(et)}
                        style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#dc2626' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>Anterior</button>
            <span style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#6b7280' }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: '#374151' }}>Siguiente</button>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div style={MODAL_OVERLAY} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
              {modal === 'create' ? 'Nueva etiqueta' : 'Editar etiqueta'}
            </h3>

            <label style={labelStyle}>Nombre *</label>
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} />

            <label style={labelStyle}>Color (hex)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <input type="color" value={hexValid(form.color) ? form.color : '#6b7280'}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
              <input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                placeholder="#rrggbb"
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.9rem', fontFamily: 'monospace' }} />
            </div>

            <label style={labelStyle}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={2}
              style={{ ...inputStyle, resize: 'vertical' }} />

            {/* Preview chip */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Vista previa:</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: `2px solid ${hexValid(form.color) ? form.color : '#e5e7eb'}`,
                borderRadius: 20, padding: '4px 12px', background: '#fff',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: hexValid(form.color) ? form.color : '#9ca3af' }} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>{form.nombre || 'Etiqueta'}</span>
              </span>
            </div>

            {formError && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0 0 12px' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div style={MODAL_OVERLAY} onClick={() => setDeleteTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 800, color: '#111827' }}>¿Eliminar etiqueta?</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.9rem' }}>
              Se eliminará <strong>{deleteTarget.nombre}</strong> y se desvinculará de todas las preguntas.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
