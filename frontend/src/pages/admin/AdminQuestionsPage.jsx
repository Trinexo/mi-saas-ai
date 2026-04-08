import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { useAuth } from '../../state/auth.jsx';

const EMPTY_FORM = {
  temaId: '',
  enunciado: '',
  explicacion: '',
  referenciaNormativa: '',
  nivelDificultad: 2,
  opciones: [
    { texto: '', correcta: true },
    { texto: '', correcta: false },
    { texto: '', correcta: false },
    { texto: '', correcta: false },
  ],
};

const TH = {
  padding: '0.5rem 0.75rem', textAlign: 'left',
  borderBottom: '2px solid #e5e7eb', fontWeight: 600,
  fontSize: '0.75rem', color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.04em',
};
const TD = {
  padding: '0.65rem 0.75rem', borderBottom: '1px solid #f3f4f6',
  fontSize: '0.875rem', verticalAlign: 'middle',
};
const DIFICULTAD = {
  1: { bg: '#dcfce7', color: '#166534', label: '1 — Muy fácil' },
  2: { bg: '#d1fae5', color: '#065f46', label: '2 — Fácil' },
  3: { bg: '#fef9c3', color: '#854d0e', label: '3 — Media' },
  4: { bg: '#fee2e2', color: '#991b1b', label: '4 — Difícil' },
  5: { bg: '#fecaca', color: '#7f1d1d', label: '5 — Muy difícil' },
};
const BTN_PRIMARY = { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 };
const BTN_SECONDARY = { background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 };
const BTN_DANGER = { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 };
const BTN_OUTLINE = { background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 };
const SELECT_STYLE = { padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem', background: 'white' };
const INPUT_STYLE = { padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' };
const SECTION_TITLE = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#111827' };

export default function AdminQuestionsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState({ items: [], pagination: {} });
  const [reportes, setReportes] = useState({ items: [], pagination: {} });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    oposicionId: '',
    materiaId: '',
    temaId: '',
    nivelDificultad: '',
    page: 1,
    pageSize: 10,
  });
  const [reportesEstado, setReportesEstado] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [auditoria, setAuditoria] = useState({ items: [], pagination: {} });
  const [auditoriaFilters, setAuditoriaFilters] = useState({
    preguntaId: '',
    usuarioId: '',
    accion: '',
    page: 1,
    pageSize: 20,
  });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Cascading selectors para filtros
  const [catOposiciones, setCatOposiciones] = useState([]);
  const [catMaterias, setCatMaterias] = useState([]);
  const [catTemas, setCatTemas] = useState([]);

  // Cascading selectors para el formulario crear/editar
  const [formOposicionId, setFormOposicionId] = useState('');
  const [formMateriaId, setFormMateriaId] = useState('');
  const [formMaterias, setFormMaterias] = useState([]);
  const [formTemas, setFormTemas] = useState([]);

  useEffect(() => {
    catalogApi.getOposiciones().then(setCatOposiciones).catch(() => {});
  }, []);

  const handleFiltroOposicion = (oposicionId) => {
    setFilters((prev) => ({ ...prev, oposicionId, materiaId: '', temaId: '', page: 1 }));
    setCatMaterias([]);
    setCatTemas([]);
    if (oposicionId) {
      catalogApi.getMaterias(oposicionId).then(setCatMaterias).catch(() => {});
    }
  };

  const handleFiltroMateria = (materiaId) => {
    setFilters((prev) => ({ ...prev, materiaId, temaId: '', page: 1 }));
    setCatTemas([]);
    if (materiaId) {
      catalogApi.getTemas(materiaId).then(setCatTemas).catch(() => {});
    }
  };

  const handleFormOposicion = (oposicionId) => {
    setFormOposicionId(oposicionId);
    setFormMateriaId('');
    setFormMaterias([]);
    setFormTemas([]);
    setForm((prev) => ({ ...prev, temaId: '' }));
    if (oposicionId) {
      catalogApi.getMaterias(oposicionId).then(setFormMaterias).catch(() => {});
    }
  };

  const handleFormMateria = (materiaId) => {
    setFormMateriaId(materiaId);
    setFormTemas([]);
    setForm((prev) => ({ ...prev, temaId: '' }));
    if (materiaId) {
      catalogApi.getTemas(materiaId).then(setFormTemas).catch(() => {});
    }
  };

  const parseCsvPreview = (csv) => {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length <= 1) {
      setCsvPreview([]);
      return;
    }

    const headers = lines[0].split(',').map((value) => value.trim());
    const previewRows = lines.slice(1, 6).map((line) => {
      const values = line.split(',').map((value) => value.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      return row;
    });

    setCsvPreview(previewRows);
  };

  const buildPreguntasQuery = () => ({
    oposicion_id: filters.oposicionId,
    materia_id: filters.materiaId,
    tema_id: filters.temaId,
    nivel_dificultad: filters.nivelDificultad,
    page: filters.page,
    page_size: filters.pageSize,
  });

  const loadPreguntas = async () => {
    const query = buildPreguntasQuery();
    const response = await adminApi.listPreguntas(token, query);
    setData(response);
  };

  const loadReportes = async () => {
    const response = await adminApi.listReportes(token, {
      estado: reportesEstado,
      page: 1,
      page_size: 10,
    });
    setReportes(response);
  };

  const loadAuditoria = async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await adminApi.listAuditoria(token, {
        pregunta_id: auditoriaFilters.preguntaId || undefined,
        usuario_id: auditoriaFilters.usuarioId || undefined,
        accion: auditoriaFilters.accion || undefined,
        page: auditoriaFilters.page,
        page_size: auditoriaFilters.pageSize,
      });
      setAuditoria(response);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const load = async () => {
    try {
      await Promise.all([loadPreguntas(), loadReportes()]);
    } catch (e) {
      setError(getErrorMessage(e));
    }
    loadAuditoria();
  };

  useEffect(() => {
    load();
  }, [filters.page, filters.pageSize, reportesEstado]);

  useEffect(() => {
    loadAuditoria();
  }, [auditoriaFilters.page, auditoriaFilters.accion]);

  /* ---- CREATE ---- */
  const onCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    try {
      await adminApi.createPregunta(token, {
        ...form,
        temaId: Number(form.temaId),
        nivelDificultad: Number(form.nivelDificultad),
      });
      setForm(EMPTY_FORM);
      setMsg('Pregunta creada correctamente');
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- EDIT ---- */
  const onEdit = async (id) => {
    setError('');
    setMsg('');
    try {
      const pregunta = await adminApi.getPregunta(token, id);
      // Cargar cascada de selects para el formulario
      const oposicionId = pregunta.oposicion_id ? String(pregunta.oposicion_id) : '';
      const materiaId = pregunta.materia_id ? String(pregunta.materia_id) : '';
      setFormOposicionId(oposicionId);
      setFormMateriaId(materiaId);
      if (oposicionId) {
        const mats = await catalogApi.getMaterias(oposicionId).catch(() => []);
        setFormMaterias(mats);
      }
      if (materiaId) {
        const tms = await catalogApi.getTemas(materiaId).catch(() => []);
        setFormTemas(tms);
      }
      setForm({
        temaId: String(pregunta.tema_id),
        enunciado: pregunta.enunciado,
        explicacion: pregunta.explicacion || '',
        referenciaNormativa: pregunta.referencia_normativa || '',
        nivelDificultad: pregunta.nivel_dificultad,
        opciones: pregunta.opciones.map((opt) => ({ texto: opt.texto, correcta: opt.correcta })),
      });
      setEditingId(id);
      window.scrollTo({ top: document.getElementById('pregunta-form')?.offsetTop ?? 0, behavior: 'smooth' });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOposicionId('');
    setFormMateriaId('');
    setFormMaterias([]);
    setFormTemas([]);
    setError('');
    setMsg('');
  };

  const onUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    try {
      await adminApi.updatePregunta(token, editingId, {
        ...form,
        temaId: Number(form.temaId),
        nivelDificultad: Number(form.nivelDificultad),
      });
      setMsg('Pregunta actualizada correctamente');
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- DELETE ---- */
  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta pregunta? Esta acción no se puede deshacer.')) return;
    setError('');
    setMsg('');
    try {
      await adminApi.deletePregunta(token, id);
      setMsg('Pregunta eliminada');
      if (editingId === id) onCancelEdit();
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- CSV ---- */
  const onImportCsv = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    setImportResult(null);
    try {
      const result = await adminApi.importPreguntasCsv(token, { csv: csvText, delimiter: ',' });
      setImportResult(result);
      await loadPreguntas();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  /* ---- REPORTES ---- */
  const onChangeReporteEstado = async (reporteId, estado) => {
    setError('');
    try {
      await adminApi.updateReporteEstado(token, reporteId, estado);
      await loadReportes();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.pagination.total || 0) / (data.pagination.pageSize || filters.pageSize)));

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>Preguntas</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Banco de preguntas — {data.pagination.total ?? 0} en total
          </p>
        </div>
        <button
          type="button"
          style={{ ...BTN_PRIMARY, fontSize: '0.875rem', padding: '0.5rem 1.1rem' }}
          onClick={() => {
            onCancelEdit();
            document.getElementById('pregunta-form')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          + Nueva pregunta
        </button>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <select
            value={filters.oposicionId}
            onChange={(e) => handleFiltroOposicion(e.target.value)}
            style={SELECT_STYLE}
          >
            <option value="">— Oposición —</option>
            {catOposiciones.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </select>
          <select
            value={filters.materiaId}
            onChange={(e) => handleFiltroMateria(e.target.value)}
            disabled={!filters.oposicionId}
            style={{ ...SELECT_STYLE, opacity: !filters.oposicionId ? 0.5 : 1 }}
          >
            <option value="">— Materia —</option>
            {catMaterias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          <select
            value={filters.temaId}
            onChange={(e) => setFilters((prev) => ({ ...prev, temaId: e.target.value, page: 1 }))}
            disabled={!filters.materiaId}
            style={{ ...SELECT_STYLE, opacity: !filters.materiaId ? 0.5 : 1 }}
          >
            <option value="">— Tema —</option>
            {catTemas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <select
            value={filters.nivelDificultad}
            onChange={(e) => setFilters((prev) => ({ ...prev, nivelDificultad: e.target.value, page: 1 }))}
            style={SELECT_STYLE}
          >
            <option value="">— Dificultad —</option>
            <option value="1">1 — Muy fácil</option>
            <option value="2">2 — Fácil</option>
            <option value="3">3 — Media</option>
            <option value="4">4 — Difícil</option>
            <option value="5">5 — Muy difícil</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={BTN_OUTLINE}
              onClick={() => {
                setFilters((prev) => ({ ...prev, oposicionId: '', materiaId: '', temaId: '', nivelDificultad: '', page: 1 }));
                setCatMaterias([]);
                setCatTemas([]);
              }}
            >
              Limpiar
            </button>
            <button type="button" style={BTN_PRIMARY} onClick={loadPreguntas}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 0 }}>
        {msg && <p style={{ margin: 0, padding: '10px 16px', color: '#059669', background: '#f0fdf4', fontSize: '0.875rem', fontWeight: 500 }}>{msg}</p>}
        {error && <p style={{ margin: 0, padding: '10px 16px', color: '#dc2626', background: '#fef2f2', fontSize: '0.875rem', fontWeight: 500 }}>{error}</p>}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ ...TH, width: 60 }}>ID</th>
                <th style={TH}>Enunciado</th>
                <th style={TH}>Tema</th>
                <th style={{ ...TH, textAlign: 'center', width: 100 }}>Dificultad</th>
                <th style={{ ...TH, textAlign: 'center', width: 130 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                    Sin resultados
                  </td>
                </tr>
              )}
              {data.items.map((item) => (
                <tr key={item.id} style={{ background: editingId === item.id ? '#eff6ff' : 'white' }}>
                  <td style={{ ...TD, color: '#9ca3af', fontSize: '0.8rem' }}>{item.id}</td>
                  <td style={{ ...TD, maxWidth: 420, lineHeight: 1.4 }}>
                    <span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                      {item.enunciado}
                    </span>
                  </td>
                  <td style={{ ...TD, color: '#6b7280', fontSize: '0.8rem' }}>{item.tema_nombre}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <span style={{
                      background: DIFICULTAD[item.nivel_dificultad]?.bg ?? '#f3f4f6',
                      color: DIFICULTAD[item.nivel_dificultad]?.color ?? '#374151',
                      padding: '2px 8px', borderRadius: 10,
                      fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {item.nivel_dificultad}
                    </span>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button type="button" style={BTN_PRIMARY} onClick={() => onEdit(item.id)}>
                        Editar
                      </button>
                      <button type="button" style={BTN_DANGER} onClick={() => onDelete(item.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa' }}>
          <button
            type="button"
            style={{ ...BTN_OUTLINE, padding: '0.3rem 0.75rem' }}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={filters.page <= 1}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', flex: 1, textAlign: 'center' }}>
            Página {filters.page} de {totalPages} · {data.pagination.total ?? 0} preguntas
          </span>
          <button
            type="button"
            style={{ ...BTN_OUTLINE, padding: '0.3rem 0.75rem' }}
            onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={filters.page >= totalPages}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Formulario crear / editar */}
      <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: 20 }}>
        <h3 id="pregunta-form" style={{ ...SECTION_TITLE, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          {editingId ? `Editando pregunta #${editingId}` : 'Nueva pregunta'}
        </h3>
        <form onSubmit={editingId ? onUpdate : onCreate} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Oposición *
              <select
                value={formOposicionId}
                required
                onChange={(e) => handleFormOposicion(e.target.value)}
                style={SELECT_STYLE}
              >
                <option value="">— Selecciona oposición —</option>
                {catOposiciones.map((o) => (
                  <option key={o.id} value={String(o.id)}>{o.nombre}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Materia *
              <select
                value={formMateriaId}
                required
                disabled={!formOposicionId}
                onChange={(e) => handleFormMateria(e.target.value)}
                style={{ ...SELECT_STYLE, opacity: !formOposicionId ? 0.5 : 1 }}
              >
                <option value="">— Selecciona materia —</option>
                {formMaterias.map((m) => (
                  <option key={m.id} value={String(m.id)}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Tema *
              <select
                value={form.temaId}
                required
                disabled={!formMateriaId}
                onChange={(e) => setForm({ ...form, temaId: e.target.value })}
                style={{ ...SELECT_STYLE, opacity: !formMateriaId ? 0.5 : 1 }}
              >
                <option value="">— Selecciona tema —</option>
                {formTemas.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.nombre}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
            Enunciado *
            <textarea
              placeholder="Escribe el enunciado de la pregunta..."
              value={form.enunciado}
              required
              rows={3}
              onChange={(e) => setForm({ ...form, enunciado: e.target.value })}
              style={{ ...INPUT_STYLE, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Explicación
              <input
                placeholder="Explicación de la respuesta correcta"
                value={form.explicacion}
                onChange={(e) => setForm({ ...form, explicacion: e.target.value })}
                style={INPUT_STYLE}
              />
            </label>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Referencia normativa
              <input
                placeholder="Ej: Art. 14 Ley 39/2015"
                value={form.referenciaNormativa}
                onChange={(e) => setForm({ ...form, referenciaNormativa: e.target.value })}
                style={INPUT_STYLE}
              />
            </label>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Dificultad
              <select
                value={form.nivelDificultad}
                onChange={(e) => setForm({ ...form, nivelDificultad: Number(e.target.value) })}
                style={{ ...SELECT_STYLE, width: 130 }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Opciones de respuesta *</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {form.opciones.map((item, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${item.correcta ? '#86efac' : '#e5e7eb'}`,
                  background: item.correcta ? '#f0fdf4' : '#fafafa',
                }}>
                  <input
                    type="radio"
                    name="correcta"
                    checked={item.correcta}
                    onChange={() => {
                      const opciones = form.opciones.map((opt, idx) => ({ ...opt, correcta: idx === index }));
                      setForm({ ...form, opciones });
                    }}
                    style={{ accentColor: '#059669', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <input
                    placeholder={`Opción ${index + 1}${item.correcta ? ' (correcta)' : ''}`}
                    value={item.texto}
                    required
                    onChange={(e) => {
                      const opciones = [...form.opciones];
                      opciones[index] = { ...opciones[index], texto: e.target.value };
                      setForm({ ...form, opciones });
                    }}
                    style={{ ...INPUT_STYLE, border: 'none', background: 'transparent', padding: 0 }}
                  />
                  {item.correcta && (
                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, flexShrink: 0 }}>✓ Correcta</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={{ ...BTN_PRIMARY, padding: '0.5rem 1.25rem' }}>
              {editingId ? 'Guardar cambios' : 'Crear pregunta'}
            </button>
            {editingId && (
              <button type="button" style={BTN_SECONDARY} onClick={onCancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Importador CSV */}
      <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: 20 }}>
        <h3 style={{ ...SECTION_TITLE, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>Importador CSV</h3>
        <form onSubmit={onImportCsv} style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Formato: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3, fontSize: '0.78rem' }}>
              tema_id,enunciado,explicacion,referencia_normativa,nivel_dificultad,opcion_1,opcion_2,opcion_3,opcion_4,opcion_correcta
            </code>
          </p>
          <textarea
            rows={6}
            placeholder="Pega aquí el contenido CSV..."
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              parseCsvPreview(e.target.value);
            }}
            style={{ ...INPUT_STYLE, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
          />
          <div>
            <button type="submit" style={{ ...BTN_PRIMARY, padding: '0.5rem 1.25rem' }}>Importar CSV</button>
          </div>
        </form>

        {csvPreview.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Previsualización (máx. 5 filas)</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {Object.keys(csvPreview[0]).map((header) => (
                      <th key={header} style={TH}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(csvPreview[0]).map((header) => (
                        <td key={`${rowIndex}-${header}`} style={TD}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importResult && (
          <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#166534', fontSize: '0.875rem' }}>
              Importación: {importResult.imported} insertadas · {importResult.failed} fallidas · {importResult.totalRows} total
            </p>
            {importResult.errors?.length > 0 && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: '0.8rem', color: '#dc2626' }}>
                {importResult.errors.map((err) => (
                  <li key={err.row}>Fila {err.row}: {err.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Moderación de reportes */}
      <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <h3 style={{ ...SECTION_TITLE, marginBottom: 0, flex: 1 }}>Moderación de reportes</h3>
          <select value={reportesEstado} onChange={(e) => setReportesEstado(e.target.value)} style={SELECT_STYLE}>
            <option value="">Todos</option>
            <option value="abierto">Abierto</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelto">Resuelto</option>
            <option value="descartado">Descartado</option>
        </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ ...TH, width: 60 }}>ID</th>
                <th style={TH}>Pregunta</th>
                <th style={TH}>Usuario</th>
                <th style={TH}>Motivo</th>
                <th style={{ ...TH, width: 150 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reportes.items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>Sin reportes pendientes</td>
                </tr>
              )}
              {reportes.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...TD, color: '#9ca3af', fontSize: '0.8rem' }}>{item.id}</td>
                  <td style={{ ...TD, maxWidth: 300 }}>
                    <span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                      {item.pregunta_enunciado}
                    </span>
                  </td>
                  <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>{item.usuario_email}</td>
                  <td style={{ ...TD, fontSize: '0.85rem' }}>{item.motivo}</td>
                  <td style={TD}>
                    <select
                      value={item.estado}
                      onChange={(e) => onChangeReporteEstado(item.id, e.target.value)}
                      style={{ ...SELECT_STYLE, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      <option value="abierto">Abierto</option>
                      <option value="en_revision">En revisión</option>
                      <option value="resuelto">Resuelto</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auditoría de cambios en preguntas */}
      {user?.role === 'admin' && (
        <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: 20 }}>
          <h3 style={{ ...SECTION_TITLE, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>Auditoría de cambios</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <input
              placeholder="Pregunta ID"
              value={auditoriaFilters.preguntaId}
              onChange={(e) => setAuditoriaFilters((prev) => ({ ...prev, preguntaId: e.target.value, page: 1 }))}
              style={{ ...INPUT_STYLE, width: '120px' }}
            />
            <input
              placeholder="Usuario ID"
              value={auditoriaFilters.usuarioId}
              onChange={(e) => setAuditoriaFilters((prev) => ({ ...prev, usuarioId: e.target.value, page: 1 }))}
              style={{ ...INPUT_STYLE, width: '120px' }}
            />
            <select
              value={auditoriaFilters.accion}
              onChange={(e) => setAuditoriaFilters((prev) => ({ ...prev, accion: e.target.value, page: 1 }))}
              style={SELECT_STYLE}
            >
              <option value="">Todas las acciones</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
            </select>
            <button type="button" style={BTN_PRIMARY} onClick={loadAuditoria}>Buscar</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ ...TH, width: 60 }}>ID</th>
                  <th style={{ ...TH, width: 80 }}>Acción</th>
                  <th style={{ ...TH, width: 100 }}>Pregunta ID</th>
                  <th style={TH}>Usuario</th>
                  <th style={{ ...TH, width: 90 }}>Rol</th>
                  <th style={{ ...TH, width: 150 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.items.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: '1.5rem' }}>Sin registros de auditoría</td>
                  </tr>
                )}
                {auditoria.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ ...TD, color: '#9ca3af', fontSize: '0.8rem' }}>{item.id}</td>
                    <td style={TD}>
                      <span style={{
                        background: item.accion === 'create' ? '#dcfce7' : item.accion === 'delete' ? '#fee2e2' : '#fef3c7',
                        color: item.accion === 'create' ? '#166534' : item.accion === 'delete' ? '#991b1b' : '#854d0e',
                        padding: '2px 7px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                      }}>{item.accion}</span>
                    </td>
                    <td style={{ ...TD, color: '#6b7280', fontSize: '0.8rem' }}>{item.pregunta_id}</td>
                    <td style={{ ...TD, fontSize: '0.85rem' }}>{item.usuario_email}</td>
                    <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>{item.usuario_role}</td>
                    <td style={{ ...TD, fontSize: '0.8rem', color: '#6b7280' }}>{new Date(item.fecha).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(auditoria.pagination.total ?? 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 4px', borderTop: '1px solid #f3f4f6', marginTop: 8 }}>
              <button
                type="button"
                style={{ ...BTN_OUTLINE, padding: '0.3rem 0.75rem' }}
                onClick={() => setAuditoriaFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={auditoriaFilters.page <= 1}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '0.85rem', color: '#6b7280', flex: 1, textAlign: 'center' }}>
                Página {auditoriaFilters.page} de{' '}
                {Math.max(1, Math.ceil((auditoria.pagination.total || 0) / auditoriaFilters.pageSize))}
              </span>
              <button
                type="button"
                style={{ ...BTN_OUTLINE, padding: '0.3rem 0.75rem' }}
                onClick={() =>
                  setAuditoriaFilters((prev) => ({
                    ...prev,
                    page: Math.min(
                      Math.max(1, Math.ceil((auditoria.pagination.total || 0) / auditoriaFilters.pageSize)),
                      prev.page + 1,
                    ),
                  }))
                }
                disabled={
                  auditoriaFilters.page >=
                  Math.max(1, Math.ceil((auditoria.pagination.total || 0) / auditoriaFilters.pageSize))
                }
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}