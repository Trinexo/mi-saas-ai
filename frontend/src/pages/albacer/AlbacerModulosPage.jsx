import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';
import { profesorApi } from '../../services/profesorApi';
import { albacerApi } from '../../services/albacerApi';
import { Button, EmptyState, Header, PageShell, Panel, P } from '../profesor/ProfesorSharedUI';

const FIELD = {
  width: '100%',
  minHeight: 40,
  border: '1px solid #e5e7eb',
  borderRadius: 9,
  background: '#fff',
  padding: '0 12px',
  color: '#0f172a',
  fontSize: '.86rem',
  boxSizing: 'border-box',
};

const TEXTAREA = {
  ...FIELD,
  minHeight: 92,
  padding: '10px 12px',
  resize: 'vertical',
};

const TH = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#64748b',
  fontSize: '.72rem',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const TD = {
  padding: '12px',
  borderBottom: '1px solid #f1f5f9',
  color: '#334155',
  fontSize: '.84rem',
  verticalAlign: 'top',
};

const STATUS = {
  borrador: { label: 'Borrador', bg: '#f3f4f6', color: '#374151' },
  publicado: { label: 'Publicado', bg: '#dcfce7', color: '#166534' },
  archivado: { label: 'Archivado', bg: '#f1f5f9', color: '#64748b' },
};

const emptyForm = {
  id: null,
  oposicion_id: '',
  nombre: '',
  descripcion: '',
  orden: 0,
  estado: 'borrador',
  tema_ids: [],
};

function normalizeOposiciones(payload) {
  const items = payload?.items ?? payload?.oposiciones ?? payload ?? [];
  return Array.isArray(items) ? items.map((item) => ({
    id: Number(item.id ?? item.oposicion_id),
    nombre: item.nombre ?? item.oposicion_nombre ?? 'Oposición',
  })).filter((item) => item.id) : [];
}

function normalizeTemas(payload) {
  const items = payload?.items ?? payload ?? [];
  return Array.isArray(items) ? items.map((item) => ({
    id: Number(item.id ?? item.tema_id),
    nombre: item.nombre ?? item.tema_nombre ?? 'Tema',
  })).filter((item) => item.id) : [];
}

function Badge({ estado }) {
  const config = STATUS[estado] ?? STATUS.borrador;
  return (
    <span style={{ background: config.bg, color: config.color, borderRadius: 999, padding: '3px 10px', fontSize: '.74rem', fontWeight: 900 }}>
      {config.label}
    </span>
  );
}

function Metric({ label, value, accent = P }) {
  return (
    <Panel style={{ padding: 16, minHeight: 88 }}>
      <div style={{ color: '#64748b', fontSize: '.74rem', fontWeight: 900 }}>{label}</div>
      <div style={{ color: '#0f172a', fontSize: '1.55rem', lineHeight: 1, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ width: 36, height: 3, background: accent, borderRadius: 99, marginTop: 12 }} />
    </Panel>
  );
}

function TemaPicker({ temas, selected, onChange }) {
  const selectedSet = new Set(selected.map(Number));
  const toggleTema = (id) => {
    const numericId = Number(id);
    const next = selectedSet.has(numericId)
      ? selected.filter((temaId) => Number(temaId) !== numericId)
      : [...selected, numericId];
    onChange(next);
  };

  if (!temas.length) {
    return <div style={{ color: '#94a3b8', fontSize: '.82rem', padding: '12px 0' }}>Selecciona una oposición con temas disponibles.</div>;
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, maxHeight: 210, overflowY: 'auto', padding: 8 }}>
      {temas.map((tema) => (
        <label key={tema.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '8px 9px', borderRadius: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectedSet.has(tema.id)}
            onChange={() => toggleTema(tema.id)}
            style={{ marginTop: 2, accentColor: P }}
          />
          <span style={{ color: '#334155', fontSize: '.84rem', lineHeight: 1.35 }}>{tema.nombre}</span>
        </label>
      ))}
    </div>
  );
}

function ModuloModal({ open, form, temas, oposiciones, saving, error, isAdmin, onClose, onChange, onSave }) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', zIndex: 800, display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ width: 'min(760px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 24px 80px rgba(15,23,42,.28)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', fontWeight: 950 }}>{form.id ? 'Editar módulo Albacer' : 'Nuevo módulo Albacer'}</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '.82rem' }}>Define el nivel, sus temas y el estado de publicación.</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f8fafc', color: '#64748b', borderRadius: 9, width: 34, height: 34, cursor: 'pointer', fontWeight: 900 }}>x</button>
        </div>

        <div className="albacer-modulo-modal-grid" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(220px, .8fr)', gap: 18 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Nombre del módulo</span>
              <input value={form.nombre} onChange={(event) => onChange({ nombre: event.target.value })} style={FIELD} placeholder="Módulo 1 - Bases constitucionales" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Descripción</span>
              <textarea value={form.descripcion ?? ''} onChange={(event) => onChange({ descripcion: event.target.value })} style={TEXTAREA} placeholder="Objetivo académico y alcance del módulo" />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Temas incluidos</span>
              <TemaPicker temas={temas} selected={form.tema_ids} onChange={(tema_ids) => onChange({ tema_ids })} />
            </label>
          </div>

          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Oposición</span>
              <select
                value={form.oposicion_id}
                onChange={(event) => onChange({ oposicion_id: event.target.value, tema_ids: [] })}
                disabled={Boolean(form.id) && !isAdmin}
                style={FIELD}
              >
                <option value="">Selecciona oposición</option>
                {oposiciones.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Orden / nivel</span>
              <input type="number" min="0" value={form.orden} onChange={(event) => onChange({ orden: event.target.value })} style={FIELD} />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: '#334155', fontSize: '.78rem', fontWeight: 900 }}>Estado</span>
              <select value={form.estado} onChange={(event) => onChange({ estado: event.target.value })} style={FIELD}>
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
                <option value="archivado">Archivado</option>
              </select>
            </label>

            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, color: '#64748b', fontSize: '.8rem', lineHeight: 1.45 }}>
              Al publicar un módulo quedará preparado para que el alumno lo reciba como nivel del Modo Albacer cuando activemos la pantalla de alumno.
            </div>
          </div>
        </div>

        {error && <div style={{ margin: '0 20px 14px', background: '#fef2f2', color: '#b91c1c', borderRadius: 9, padding: '10px 12px', fontSize: '.82rem', fontWeight: 800 }}>{error}</div>}

        <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar módulo'}</Button>
        </div>
      </div>
    </div>
  );
}

export default function AlbacerModulosPage({ scope = 'profesor' }) {
  const { token, user } = useAuth();
  const isAdmin = scope === 'admin' || user?.role === 'admin';
  const [oposiciones, setOposiciones] = useState([]);
  const [selectedOposicion, setSelectedOposicion] = useState('');
  const [temas, setTemas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [contentModulo, setContentModulo] = useState(null);
  const [items, setItems] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [itemTipo, setItemTipo] = useState('test');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');

  const api = useMemo(() => ({
    list: isAdmin ? albacerApi.listAdminModulos : albacerApi.listProfesorModulos,
    create: isAdmin ? albacerApi.createAdminModulo : albacerApi.createProfesorModulo,
    update: isAdmin ? albacerApi.updateAdminModulo : albacerApi.updateProfesorModulo,
    delete: isAdmin ? albacerApi.deleteAdminModulo : albacerApi.deleteProfesorModulo,
    listItems: isAdmin ? albacerApi.listAdminModuloItems : albacerApi.listProfesorModuloItems,
    createItem: isAdmin ? albacerApi.createAdminModuloItem : albacerApi.createProfesorModuloItem,
    updateItem: isAdmin ? albacerApi.updateAdminModuloItem : albacerApi.updateProfesorModuloItem,
    deleteItem: isAdmin ? albacerApi.deleteAdminModuloItem : albacerApi.deleteProfesorModuloItem,
  }), [isAdmin]);

  const loadOposiciones = useCallback(async () => {
    const payload = isAdmin
      ? await adminApi.listOposicionesConStats(token, { page_size: 200 })
      : await profesorApi.getWorkspaceOposiciones(token);
    const items = normalizeOposiciones(payload);
    setOposiciones(items);
    setSelectedOposicion((current) => current || (items.length === 1 ? String(items[0].id) : ''));
  }, [isAdmin, token]);

  const loadTemas = useCallback(async (oposicionId) => {
    if (!oposicionId) {
      setTemas([]);
      return;
    }
    const payload = isAdmin
      ? await adminApi.listTemas(token, oposicionId)
      : await profesorApi.getWorkspaceTemario(token, { oposicion_id: oposicionId });
    setTemas(normalizeTemas(payload));
  }, [isAdmin, token]);

  const loadModulos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.list(token, {
        q: q || undefined,
        estado: estado || undefined,
        oposicion_id: selectedOposicion || undefined,
        page: 1,
        page_size: 100,
      });
      setModulos(payload?.items ?? []);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los módulos Albacer.');
      setModulos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [api, estado, q, selectedOposicion, token]);

  useEffect(() => { loadOposiciones().catch(() => setOposiciones([])); }, [loadOposiciones]);
  useEffect(() => { loadTemas(selectedOposicion).catch(() => setTemas([])); }, [loadTemas, selectedOposicion]);
  useEffect(() => { loadModulos(); }, [loadModulos]);

  const loadItems = useCallback(async (modulo = contentModulo) => {
    if (!modulo?.id) return;
    setLoadingItems(true);
    setItemError('');
    try {
      const payload = await api.listItems(token, modulo.id);
      setItems(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setItemError(err.message || 'No se pudo cargar el contenido del módulo.');
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [api, contentModulo, token]);

  const loadCandidates = useCallback(async (modulo = contentModulo, tipo = itemTipo) => {
    if (!modulo?.oposicion_id) {
      setCandidates([]);
      return;
    }
    try {
      const payload = tipo === 'test'
        ? await (isAdmin ? adminApi.listTests : profesorApi.getMisTests)(token, { oposicion_id: modulo.oposicion_id, page: 1, page_size: 100 })
        : await (isAdmin ? adminApi.listSimulacros : profesorApi.getMisSimulacros)(token, { oposicion_id: modulo.oposicion_id, page: 1, page_size: 100 });
      setCandidates(payload?.items ?? []);
    } catch {
      setCandidates([]);
    }
  }, [contentModulo, isAdmin, itemTipo, token]);

  useEffect(() => { if (contentModulo) loadItems(contentModulo); }, [contentModulo, loadItems]);
  useEffect(() => { if (contentModulo) loadCandidates(contentModulo, itemTipo); }, [contentModulo, itemTipo, loadCandidates]);

  const metrics = useMemo(() => {
    const publicados = modulos.filter((modulo) => modulo.estado === 'publicado').length;
    const borradores = modulos.filter((modulo) => modulo.estado === 'borrador').length;
    const temasAsignados = new Set(modulos.flatMap((modulo) => modulo.tema_ids ?? [])).size;
    const simulacros = modulos.reduce((acc, modulo) => acc + Number(modulo.total_simulacros_finales ?? 0), 0);
    return { publicados, borradores, temasAsignados, simulacros };
  }, [modulos]);

  const openCreate = () => {
    setModalError('');
    setForm({
      ...emptyForm,
      oposicion_id: selectedOposicion || (oposiciones.length === 1 ? String(oposiciones[0].id) : ''),
      orden: modulos.length + 1,
    });
    setModalOpen(true);
  };

  const openEdit = (modulo) => {
    setModalError('');
    setForm({
      id: modulo.id,
      oposicion_id: String(modulo.oposicion_id),
      nombre: modulo.nombre ?? '',
      descripcion: modulo.descripcion ?? '',
      orden: modulo.orden ?? 0,
      estado: modulo.estado ?? 'borrador',
      tema_ids: modulo.tema_ids ?? [],
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (modalOpen) {
      loadTemas(form.oposicion_id).catch(() => setTemas([]));
    }
  }, [form.oposicion_id, loadTemas, modalOpen]);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const buildPayload = () => ({
    oposicion_id: Number(form.oposicion_id),
    nombre: form.nombre.trim(),
    descripcion: form.descripcion?.trim() || null,
    orden: Number(form.orden || 0),
    estado: form.estado,
    tema_ids: form.tema_ids.map(Number),
  });

  const saveModulo = async () => {
    setSaving(true);
    setModalError('');
    try {
      const payload = buildPayload();
      if (!payload.oposicion_id) throw new Error('Selecciona una oposición.');
      if (payload.nombre.length < 3) throw new Error('El nombre debe tener al menos 3 caracteres.');
      if (form.id) {
        await api.update(token, form.id, payload);
      } else {
        await api.create(token, payload);
      }
      setModalOpen(false);
      await loadModulos();
    } catch (err) {
      setModalError(err.message || 'No se pudo guardar el módulo.');
    } finally {
      setSaving(false);
    }
  };

  const deleteModulo = async (id) => {
    setError('');
    try {
      await api.delete(token, id);
      setConfirmDeleteId(null);
      await loadModulos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el módulo.');
    }
  };

  const openContent = (modulo) => {
    setContentModulo(modulo);
    setItemTipo('test');
    setSelectedCandidateId('');
    setItemError('');
  };

  const addItem = async () => {
    if (!contentModulo?.id || !selectedCandidateId) return;
    const selected = candidates.find((candidate) => Number(candidate.id) === Number(selectedCandidateId));
    setSavingItem(true);
    setItemError('');
    try {
      await api.createItem(token, contentModulo.id, {
        tipo: itemTipo,
        titulo: selected?.nombre ?? (itemTipo === 'test' ? 'Test del módulo' : 'Simulacro final'),
        plantilla_test_id: itemTipo === 'test' ? Number(selectedCandidateId) : undefined,
        simulacro_id: itemTipo === 'simulacro_final' ? Number(selectedCandidateId) : undefined,
        obligatorio: itemTipo === 'simulacro_final',
      });
      setSelectedCandidateId('');
      await loadItems(contentModulo);
      await loadModulos();
    } catch (err) {
      setItemError(err.message || 'No se pudo añadir el contenido.');
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId) => {
    if (!contentModulo?.id) return;
    setSavingItem(true);
    setItemError('');
    try {
      await api.deleteItem(token, contentModulo.id, itemId);
      await loadItems(contentModulo);
      await loadModulos();
    } catch (err) {
      setItemError(err.message || 'No se pudo eliminar el contenido.');
    } finally {
      setSavingItem(false);
    }
  };

  return (
    <PageShell>
      <Header
        title="Módulos Albacer"
        subtitle={isAdmin ? 'Diseña niveles guiados por oposición para el método Albacer.' : 'Organiza los niveles guiados de tus oposiciones asignadas.'}
        action={<Button onClick={openCreate}>+ Nuevo módulo</Button>}
      />

      <div className="albacer-modulo-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <Metric label="Módulos visibles" value={metrics.publicados} accent="#10b981" />
        <Metric label="Borradores" value={metrics.borradores} accent="#f59e0b" />
        <Metric label="Temas cubiertos" value={metrics.temasAsignados} accent="#2563eb" />
        <Metric label="Simulacros finales" value={metrics.simulacros} accent={P} />
      </div>

      <Panel style={{ marginBottom: 16, padding: 14 }}>
        <div className="albacer-modulo-filters" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(160px, .45fr) minmax(180px, .45fr)', gap: 10 }}>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar módulo..."
            style={FIELD}
          />
          <select value={selectedOposicion} onChange={(event) => setSelectedOposicion(event.target.value)} style={FIELD}>
            <option value="">Todas las oposiciones</option>
            {oposiciones.map((oposicion) => <option key={oposicion.id} value={oposicion.id}>{oposicion.nombre}</option>)}
          </select>
          <select value={estado} onChange={(event) => setEstado(event.target.value)} style={FIELD}>
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </select>
        </div>
      </Panel>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: '.84rem', fontWeight: 800, marginBottom: 14 }}>{error}</div>}

      <Panel title={`Módulos (${total})`} subtitle="Los tests y simulacros finales se añadirán dentro de cada módulo en el siguiente bloque.">
        {loading ? (
          <div style={{ color: '#64748b', padding: 28, textAlign: 'center' }}>Cargando módulos...</div>
        ) : modulos.length === 0 ? (
          <EmptyState title="Aún no hay módulos Albacer" text="Crea el primer módulo para empezar a construir el itinerario guiado." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={TH}>Orden</th>
                  <th style={TH}>Módulo</th>
                  <th style={TH}>Oposición</th>
                  <th style={TH}>Temas</th>
                  <th style={TH}>Estado</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Contenido</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Alumnos</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modulos.map((modulo) => (
                  <tr key={modulo.id}>
                    <td style={{ ...TD, fontWeight: 900, color: '#0f172a' }}>{modulo.orden}</td>
                    <td style={TD}>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: '.9rem' }}>{modulo.nombre}</strong>
                      {modulo.descripcion && <span style={{ display: 'block', color: '#94a3b8', marginTop: 4, maxWidth: 360 }}>{modulo.descripcion}</span>}
                    </td>
                    <td style={TD}>{modulo.oposicion_nombre ?? '-'}</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', maxWidth: 360 }}>
                        {(modulo.temas ?? []).length === 0 ? (
                          <span style={{ color: '#94a3b8' }}>Sin temas</span>
                        ) : modulo.temas.slice(0, 4).map((tema) => (
                          <span key={tema.id} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 999, padding: '3px 8px', fontSize: '.72rem', fontWeight: 800 }}>{tema.nombre}</span>
                        ))}
                        {(modulo.temas ?? []).length > 4 && <span style={{ color: '#64748b', fontWeight: 900, fontSize: '.72rem' }}>+{modulo.temas.length - 4}</span>}
                      </div>
                    </td>
                    <td style={TD}><Badge estado={modulo.estado} /></td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <strong style={{ color: '#0f172a' }}>{modulo.total_tests ?? 0}</strong> tests
                      <div style={{ color: '#64748b', fontSize: '.76rem' }}>{modulo.total_simulacros_finales ?? 0} simulacro final</div>
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <strong style={{ color: '#0f172a' }}>{modulo.alumnos_iniciados ?? 0}</strong> iniciados
                      <div style={{ color: '#64748b', fontSize: '.76rem' }}>{modulo.alumnos_superados ?? 0} superados</div>
                    </td>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        {confirmDeleteId === modulo.id ? (
                          <>
                            <button onClick={() => deleteModulo(modulo.id)} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: 'pointer' }}>Sí</button>
                            <button onClick={() => setConfirmDeleteId(null)} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#334155', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: 'pointer' }}>No</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openContent(modulo)} style={{ border: '1px solid #ddd6fe', background: '#f5f3ff', color: P, borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: 'pointer' }}>Contenido</button>
                            <button onClick={() => openEdit(modulo)} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#334155', borderRadius: 8, padding: '7px 10px', fontWeight: 900, cursor: 'pointer' }}>Editar</button>
                            <button onClick={() => setConfirmDeleteId(modulo.id)} style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: 'pointer' }}>Eliminar</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {contentModulo && (
        <Panel
          title={`Contenido de ${contentModulo.nombre}`}
          subtitle="Añade tests de práctica y un único simulacro final al módulo."
          style={{ marginTop: 16 }}
          action={<Button variant="secondary" onClick={() => setContentModulo(null)}>Cerrar</Button>}
        >
          <div className="albacer-modulo-content-tools" style={{ display: 'grid', gridTemplateColumns: '180px minmax(220px, 1fr) auto', gap: 10, marginBottom: 14 }}>
            <select value={itemTipo} onChange={(event) => { setItemTipo(event.target.value); setSelectedCandidateId(''); }} style={FIELD}>
              <option value="test">Test del módulo</option>
              <option value="simulacro_final">Simulacro final</option>
            </select>
            <select value={selectedCandidateId} onChange={(event) => setSelectedCandidateId(event.target.value)} style={FIELD}>
              <option value="">Selecciona contenido existente</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.nombre} · {candidate.estado ?? 'sin estado'} · {candidate.total_preguntas ?? 0} preguntas
                </option>
              ))}
            </select>
            <Button onClick={addItem} disabled={savingItem || !selectedCandidateId}>
              {savingItem ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </div>

          {itemError && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: '.84rem', fontWeight: 800, marginBottom: 14 }}>{itemError}</div>}

          {loadingItems ? (
            <div style={{ color: '#64748b', padding: 22, textAlign: 'center' }}>Cargando contenido...</div>
          ) : items.length === 0 ? (
            <EmptyState title="Sin contenido en el módulo" text="Añade tests de práctica y un simulacro final para completar este nivel." />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((item) => {
                const isFinal = item.tipo === 'simulacro_final';
                const preguntaTotal = isFinal ? item.simulacro_total_preguntas : item.test_total_preguntas;
                const estadoItem = isFinal ? item.simulacro_estado : item.test_estado;
                return (
                  <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 13, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: isFinal ? '#fee2e2' : '#ede9fe', color: isFinal ? '#991b1b' : '#5b21b6', borderRadius: 999, padding: '3px 9px', fontSize: '.72rem', fontWeight: 900 }}>
                          {isFinal ? 'Simulacro final' : 'Test'}
                        </span>
                        <strong style={{ color: '#0f172a' }}>{item.titulo}</strong>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: 5 }}>
                        Orden {item.orden} · {preguntaTotal ?? 0} preguntas · {estadoItem ?? 'sin estado'}{item.obligatorio ? ' · obligatorio' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={savingItem}
                      style={{ border: '1px solid #fecaca', background: '#fff', color: '#dc2626', borderRadius: 8, padding: '7px 10px', fontWeight: 800, cursor: savingItem ? 'not-allowed' : 'pointer' }}
                    >
                      Quitar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      <ModuloModal
        open={modalOpen}
        form={form}
        temas={temas}
        oposiciones={oposiciones}
        saving={saving}
        error={modalError}
        isAdmin={isAdmin}
        onClose={() => setModalOpen(false)}
        onChange={updateForm}
        onSave={saveModulo}
      />

      <style>{`
        @media (max-width: 980px) {
          .albacer-modulo-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .albacer-modulo-filters { grid-template-columns: 1fr !important; }
          .albacer-modulo-content-tools { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .albacer-modulo-metrics { grid-template-columns: 1fr !important; }
          .albacer-modulo-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageShell>
  );
}
