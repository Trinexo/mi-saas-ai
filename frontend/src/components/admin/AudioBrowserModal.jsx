import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

export default function AudioBrowserModal({ onSelect, onClose, readOnly = false }) {
  const { token, user } = useAuth();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOposiciones, setOpenOposiciones] = useState(new Set());
  const [deleting, setDeleting] = useState(null);

  const mediaApi = user?.role === 'profesor' ? profesorApi : adminApi;

  const loadTree = () => {
    setLoading(true);
    mediaApi.getAudioBrowser(token)
      .then((data) => {
        setTree(data ?? []);
        if (data?.length > 0) setOpenOposiciones(new Set([data[0].oposicionId]));
      })
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadTree, [token, mediaApi]);

  const toggleOposicion = (id) =>
    setOpenOposiciones((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleDelete = async (preguntaId) => {
    if (!window.confirm('¿Eliminar este audio? No se puede deshacer.')) return;
    setDeleting(preguntaId);
    try {
      await mediaApi.deleteAudioPregunta(token, preguntaId);
      loadTree();
    } catch {
      alert('No se pudo eliminar el audio.');
    } finally {
      setDeleting(null);
    }
  };

  const totalAudios = tree.reduce(
    (acc, oposicion) => acc + oposicion.temas.reduce((sum, tema) => sum + tema.audios.length, 0),
    0,
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 780,
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 80px)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
              Biblioteca de audios
            </h3>
            {!loading && (
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                {totalAudios} {totalAudios === 1 ? 'audio guardado' : 'audios guardados'}
                {!readOnly && ' - haz clic en "Usar" para seleccionar'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#374151',
            }}
          >
            Cerrar
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
          {loading && (
            <p style={{ textAlign: 'center', color: '#9ca3af', margin: '40px 0', fontSize: '0.9rem' }}>
              Cargando audios...
            </p>
          )}

          {!loading && tree.length === 0 && (
            <div style={{ textAlign: 'center', margin: '48px 0' }}>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No hay audios grabados todavía.</p>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 4 }}>
                Graba explicaciones desde el formulario de edición de preguntas.
              </p>
            </div>
          )}

          {!loading && tree.map((oposicion) => (
            <div key={oposicion.oposicionId} style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => toggleOposicion(oposicion.oposicionId)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  color: '#9ca3af',
                  display: 'inline-block',
                  transform: openOposiciones.has(oposicion.oposicionId) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}>
                  ▶
                </span>
                {oposicion.oposicionNombre}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>
                  {oposicion.temas.reduce((sum, tema) => sum + tema.audios.length, 0)} audios
                </span>
              </button>

              {openOposiciones.has(oposicion.oposicionId) && (
                <div style={{ paddingLeft: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {oposicion.temas.map((tema) => (
                    <div key={tema.temaId}>
                      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tema.temaNombre} ({tema.audios.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {tema.audios.map((item) => (
                          <div
                            key={item.preguntaId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #e5e7eb',
                              background: '#fafafa',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', minWidth: 28 }}>
                              #{item.preguntaId}
                            </span>
                            <audio
                              controls
                              src={`${BACKEND_BASE}${item.audioUrl}`}
                              style={{ height: 32, flex: '1 1 200px', minWidth: 160 }}
                            />
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#374151',
                              flex: '2 1 180px',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {item.enunciado}
                            </span>
                            {!readOnly && onSelect && (
                              <button
                                type="button"
                                onClick={() => onSelect(item.audioUrl)}
                                style={{
                                  border: 'none',
                                  borderRadius: 5,
                                  padding: '4px 10px',
                                  background: '#ea580c',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                Usar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.preguntaId)}
                              disabled={deleting === item.preguntaId}
                              style={{
                                border: '1px solid #fecaca',
                                borderRadius: 5,
                                padding: '4px 10px',
                                background: deleting === item.preguntaId ? '#f9fafb' : '#fff',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {deleting === item.preguntaId ? '...' : 'Borrar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
