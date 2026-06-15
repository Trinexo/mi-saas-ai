import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { catalogApi } from '../../services/catalogApi';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';
import MediaBrowserModal from '../../components/admin/MediaBrowserModal.jsx';
import AudioRecorder from '../../components/admin/AudioRecorder.jsx';
import AudioBrowserModal from '../../components/admin/AudioBrowserModal.jsx';

const EMPTY_FORM = {
  temaId: '',
  enunciado: '',
  explicacion: '',
  referenciaNormativa: '',
  nivelDificultad: 'media',
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
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isProfesor = user?.role === 'profesor';
  const backPath = isProfesor ? '/profesor/preguntas' : '/admin/preguntas';
  const mediaApi = isProfesor ? profesorApi : adminApi;

  const [form, setForm] = useState(EMPTY_FORM);
  const [formOposicionId, setFormOposicionId] = useState('');
  const [formTemaId, setFormTemaId] = useState('');
  const [catOposiciones, setCatOposiciones] = useState([]);
  const [formTemas, setFormTemas] = useState([]);

  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [pendingImage, setPendingImage] = useState(null);       // File para subir
  const [pendingImageUrl, setPendingImageUrl] = useState(null); // URL seleccionada del banco
  const [imgLoading, setImgLoading] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [pendingAudioBlob, setPendingAudioBlob] = useState(null); // Blob grabado
  const [pendingAudioUrl, setPendingAudioUrl] = useState(null);   // URL seleccionada del banco
  const [audioUploading, setAudioUploading] = useState(false);
  const [showAudioBrowser, setShowAudioBrowser] = useState(false);

  useEffect(() => {
    const request = isProfesor
      ? profesorApi.getMisOposiciones(token)
      : catalogApi.getOposiciones(token);

    Promise.resolve(request)
      .then((items) => {
        const oposiciones = items ?? [];
        setCatOposiciones(oposiciones);
        if (isProfesor && oposiciones.length === 1) {
          handleFormOposicion(String(oposiciones[0].id));
        }
      })
      .catch(() => setCatOposiciones([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isProfesor]);

  const handleFormOposicion = (oposicionId) => {
    setFormOposicionId(oposicionId);
    setFormTemaId('');
    setFormTemas([]);
    setForm((prev) => ({ ...prev, temaId: '' }));
    if (oposicionId) {
      catalogApi.getTemas(oposicionId).then(setFormTemas).catch(() => {});
    }
  };

  const handleFormTema = (temaId) => {
    setFormTemaId(temaId);
    setForm((prev) => ({ ...prev, temaId }));
  };

  const detectDelimiter = (firstLine) => {
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    return semicolons > commas ? ';' : ',';
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

    const delimiter = detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((value) => value.trim());
    const previewRows = lines.slice(1, 6).map((line) => {
      const values = line.split(delimiter).map((value) => value.trim());
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
      const questionApi = isProfesor ? profesorApi : adminApi;
      const result = await questionApi.createPregunta(token, {
        ...form,
        temaId: Number(form.temaId),
        nivelDificultad: form.nivelDificultad,
        imagenUrl: pendingImageUrl || undefined,
        audioUrl: pendingAudioUrl || undefined,
      });
      if (pendingImage && result?.id) {
        setImgLoading(true);
        try {
          await mediaApi.uploadImagenPregunta(token, result.id, pendingImage);
        } catch {
          // La pregunta se creó; la imagen falló — avisar sin bloquear
          setMsg('Pregunta creada. No se pudo subir la imagen, inténtalo desde la edición.');
          setImgLoading(false);
          setPendingImage(null);
          setForm(EMPTY_FORM);
          if (isProfesor && catOposiciones.length === 1) {
            handleFormOposicion(String(catOposiciones[0].id));
          } else {
            setFormOposicionId('');
            setFormTemaId('');
            setFormTemas([]);
          }
          return;
        }
        setImgLoading(false);
      }
      // Subir audio si se grabó antes de crear
      if (pendingAudioBlob && result?.id) {
        setAudioUploading(true);
        try {
          await mediaApi.uploadAudioPregunta(token, result.id, pendingAudioBlob);
        } catch {
          // No bloquear — la pregunta ya se creó
        } finally {
          setAudioUploading(false);
        }
      }
      setPendingImage(null);
      setPendingImageUrl(null);
      setPendingAudioBlob(null);
      setPendingAudioUrl(null);
      setForm(EMPTY_FORM);
      if (isProfesor && catOposiciones.length === 1) {
        handleFormOposicion(String(catOposiciones[0].id));
      } else {
        setFormOposicionId('');
        setFormTemaId('');
        setFormTemas([]);
      }
      setMsg('Pregunta creada correctamente');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const CSV_REQUIRED_HEADERS = [
    'tema_id', 'enunciado', 'opcion_1', 'opcion_2',
    'explicacion',
  ];

  const onImportCsv = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');
    setImportResult(null);
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      setError('El CSV debe tener al menos una fila de cabecera y una fila de datos.');
      return;
    }
    const delimiter = detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const missing = CSV_REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      setError(`Faltan columnas obligatorias: ${missing.join(', ')}`);
      return;
    }
    try {
      const questionApi = isProfesor ? profesorApi : adminApi;
      const result = await questionApi.importPreguntasCsv(token, { csv: csvText, delimiter });
      setImportResult(result);
      setShowImportModal(true);
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
            {isProfesor ? 'Crea una pregunta o importa un CSV para tus oposiciones asignadas' : 'Crea una pregunta manualmente o importa varias desde un CSV'}
          </p>
        </div>
        <button
          type="button"
          style={{ ...BTN_OUTLINE, fontSize: '0.875rem', padding: '0.5rem 1.1rem' }}
          onClick={() => navigate(backPath)}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <option key={m.id} value={String(m.id)}>{m.nombre} ({m.id})</option>
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

          {/* Imagen opcional */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Imagen del enunciado (opcional)</p>
            {pendingImageUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#374151', fontStyle: 'italic' }}>Imagen del banco seleccionada</span>
                <button type="button" onClick={() => setShowMediaBrowser(true)} style={{ ...BTN_OUTLINE, fontSize: '0.78rem', padding: '0.25rem 0.7rem' }}>Cambiar</button>
                <button type="button" onClick={() => setPendingImageUrl(null)} style={{ ...BTN_OUTLINE, fontSize: '0.78rem', padding: '0.25rem 0.7rem', color: '#dc2626', borderColor: '#fecaca' }}>Quitar</button>
              </div>
            ) : pendingImage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#374151' }}>{pendingImage.name}</span>
                <button type="button" onClick={() => setShowMediaBrowser(true)} style={{ ...BTN_OUTLINE, fontSize: '0.78rem', padding: '0.25rem 0.7rem' }}>Banco de medios</button>
                <button type="button" onClick={() => setPendingImage(null)} style={{ ...BTN_OUTLINE, fontSize: '0.78rem', padding: '0.25rem 0.7rem', color: '#dc2626', borderColor: '#fecaca' }}>Quitar</button>
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Se convertirá a WebP · calidad 75%</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ cursor: 'pointer' }}>
                  <span style={{ ...BTN_OUTLINE, display: 'inline-block', fontSize: '0.82rem' }}>
                    + Subir imagen nueva
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => { setPendingImage(e.target.files?.[0] ?? null); setPendingImageUrl(null); }}
                    style={{ display: 'none' }}
                  />
                </label>
                <button type="button" onClick={() => setShowMediaBrowser(true)} style={{ ...BTN_OUTLINE, fontSize: '0.82rem' }}>
                  Banco de medios
                </button>
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Se subirá al guardar · máx. 1200px</span>
              </div>
            )}
          </div>

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
                onChange={(e) => setForm({ ...form, nivelDificultad: e.target.value })}
                style={{ ...SELECT_STYLE, width: 130 }}
              >
                <option value="facil">Fácil</option>
                <option value="media">Media</option>
                <option value="dificil">Difícil</option>
              </select>
            </label>
          </div>

          {/* Audio de explicación — se graba antes de crear y se sube junto con la pregunta */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fafafa' }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>Audio de explicación (opcional)</p>
            <AudioRecorder
              existingUrl={pendingAudioUrl}
              uploading={audioUploading}
              onRecorded={(blob) => {
                setPendingAudioBlob(blob);
                setPendingAudioUrl(null);
              }}
              onDelete={() => {
                setPendingAudioBlob(null);
                setPendingAudioUrl(null);
              }}
              onOpenBrowser={() => setShowAudioBrowser(true)}
            />
            {pendingAudioBlob && (
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#059669' }}>Audio listo. Se subirá al crear la pregunta.</p>
            )}
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
            <button type="submit" disabled={imgLoading} style={{ ...BTN_PRIMARY, padding: '0.5rem 1.25rem', opacity: imgLoading ? 0.7 : 1 }}>
              {imgLoading ? 'Subiendo imagen...' : 'Crear pregunta'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <h3 style={{ ...SECTION_TITLE, paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>Importador CSV</h3>
        <form onSubmit={onImportCsv} style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Columnas obligatorias: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3, fontSize: '0.78rem' }}>
              tema_id, enunciado, opcion_1, opcion_2, explicacion
            </code>
            <br />
            Columnas opcionales: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3, fontSize: '0.78rem' }}>
              opcion_3, opcion_4, referencia_normativa, nivel_dificultad
            </code>{' '}(si se omiten: sin referencia y dificultad media)
            <br />
            <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
              Marca la opción correcta con <strong>*</strong> al inicio del texto. Ej: <em>*Ley Orgánica 3/2018</em>
            </span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button type="submit" style={{ ...BTN_PRIMARY, padding: '0.5rem 1.25rem' }}>Importar CSV</button>
            <a
              href="/plantilla-importacion-preguntas.csv"
              download="plantilla-importacion-preguntas.csv"
              style={{ fontSize: '0.8rem', color: '#6b7280', textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              Descargar plantilla de ejemplo (.csv)
            </a>
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

        {null /* resultado gestionado por modal */}
      </div>

      {showMediaBrowser && (
        <MediaBrowserModal
          onSelect={(url) => {
            setPendingImageUrl(url);
            setPendingImage(null);
            setShowMediaBrowser(false);
          }}
          onClose={() => setShowMediaBrowser(false)}
        />
      )}

      {showAudioBrowser && (
        <AudioBrowserModal
          onSelect={(url) => {
            setPendingAudioUrl(url);
            setPendingAudioBlob(null);
            setShowAudioBrowser(false);
          }}
          onClose={() => setShowAudioBrowser(false)}
        />
      )}

      {showImportModal && importResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 520, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{importResult.imported > 0 ? '✅' : '⚠️'}</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                {importResult.imported > 0 ? 'Importación completada' : 'Importación sin resultados'}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Importadas', value: importResult.imported, bg: '#f0fdf4', color: '#166534' },
                { label: 'Fallidas', value: importResult.failed, bg: importResult.failed > 0 ? '#fef2f2' : '#f9fafb', color: importResult.failed > 0 ? '#991b1b' : '#6b7280' },
                { label: 'Total', value: importResult.totalRows, bg: '#eff6ff', color: '#1e40af' },
              ].map(({ label, value, bg, color }) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {importResult.errors?.length > 0 && (
              <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 16, padding: '10px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 600, color: '#991b1b' }}>Filas con error:</p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: '#7f1d1d' }}>
                  {importResult.errors.map((err) => (
                    <li key={err.row}>Fila {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setCsvText(''); setCsvPreview([]); setImportResult(null); }}
                style={{ ...BTN_OUTLINE, padding: '0.5rem 1.1rem' }}
              >
                Cerrar
              </button>
              {importResult.imported > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    const oid = importResult.oposicionId;
                    const base = isProfesor ? '/profesor/preguntas' : '/admin/preguntas';
                    navigate(oid ? `${base}?oposicion_id=${oid}` : base);
                  }}
                  style={{ ...BTN_PRIMARY, padding: '0.5rem 1.25rem' }}
                >
                  Ir a preguntas
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
