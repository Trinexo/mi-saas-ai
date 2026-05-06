import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { useAuth } from '../../state/auth.jsx';

const EMPTY_FORM = {
  bloqueId: '',
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
const BTN_PRIMARY = { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 };
const BTN_OUTLINE = { background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 };
const SELECT_STYLE = { padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.875rem', background: '#fff' };
const INPUT_STYLE = { padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' };
const SECTION_TITLE = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#111827' };

export default function AdminNuevaPreguntaPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [formOposicionId, setFormOposicionId] = useState('');
  const [formTemaId, setFormTemaId] = useState('');
  const [catOposiciones, setCatOposiciones] = useState([]);
  const [formTemas, setFormTemas] = useState([]);
  const [formBloques, setFormBloques] = useState([]);

  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    catalogApi.getOposiciones().then(setCatOposiciones).catch(() => {});
  }, []);

  const handleFormOposicion = (oposicionId) => {
    setFormOposicionId(oposicionId);
    setFormTemaId('');
    setFormTemas([]);
    setFormBloques([]);
    setForm((prev) => ({ ...prev, bloqueId: '' }));
    if (oposicionId) {
      catalogApi.getTemas(oposicionId).then(setFormTemas).catch(() => {});
    }
  };

  const handleFormTema = (temaId) => {
    setFormTemaId(temaId);
    setFormBloques([]);
    setForm((prev) => ({ ...prev, bloqueId: '' }));
    if (temaId) {
      catalogApi.getBloques(temaId).then(setFormBloques).catch(() => {});
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

  const onCreate = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    try {
      await adminApi.createPregunta(token, {
        ...form,
        bloqueId: Number(form.bloqueId),
        nivelDificultad: Number(form.nivelDificultad),
      });
      setForm(EMPTY_FORM);
      setFormOposicionId('');
      setFormTemaId('');
      setFormTemas([]);
      setFormBloques([]);
      setMsg('Pregunta creada correctamente');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const onImportCsv = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    setImportResult(null);
    try {
      const result = await adminApi.importPreguntasCsv(token, { csv: csvText, delimiter: ',' });
      setImportResult(result);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>Nueva pregunta</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Crea una pregunta manualmente o importa varias desde un CSV
          </p>
        </div>
        <button
          type="button"
          style={{ ...BTN_OUTLINE, fontSize: '0.875rem', padding: '0.5rem 1.1rem' }}
          onClick={() => navigate('/admin/preguntas')}
        >
          ← Volver a preguntas
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', color: '#059669', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, marginBottom: 16 }}>
          {msg}
        </div>
      )}
      {error && (
        <div style={{ padding: '10px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Formulario nueva pregunta */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <h3 style={{ ...SECTION_TITLE, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          Crear pregunta
        </h3>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: 12 }}>
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
              Tema *
              <select
                value={formTemaId}
                required
                disabled={!formOposicionId}
                onChange={(e) => handleFormTema(e.target.value)}
                style={{ ...SELECT_STYLE, opacity: !formOposicionId ? 0.5 : 1 }}
              >
                <option value="">— Selecciona tema —</option>
                {formTemas.map((m) => (
                  <option key={m.id} value={String(m.id)}>{m.nombre}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
              Bloque *
              <select
                value={form.bloqueId}
                required
                disabled={!formTemaId}
                onChange={(e) => setForm({ ...form, bloqueId: e.target.value })}
                style={{ ...SELECT_STYLE, opacity: !formTemaId ? 0.5 : 1 }}
              >
                <option value="">— Selecciona bloque —</option>
                {formBloques.map((t) => (
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
              Crear pregunta
            </button>
          </div>
        </form>
      </div>

      {/* Importador CSV */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
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
    </div>
  );
}
