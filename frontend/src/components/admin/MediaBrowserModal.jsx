import { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { profesorApi } from '../../services/profesorApi';
import { useAuth } from '../../state/auth.jsx';

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

export default function MediaBrowserModal({ onSelect, onClose }) {
  const { token, user } = useAuth();
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOposiciones, setOpenOposiciones] = useState(new Set());

  const mediaApi = user?.role === 'profesor' ? profesorApi : adminApi;

  useEffect(() => {
    setLoading(true);
    mediaApi.getMediaBrowser(token)
      .then((data) => {
        setTree(data ?? []);
        if (data?.length > 0) {
          setOpenOposiciones(new Set([data[0].oposicionId]));
        }
      })
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, [token, mediaApi]);

  const toggleOposicion = (id) => {
    setOpenOposiciones((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalImagenes = tree.reduce(
    (acc, oposicion) => acc + oposicion.temas.reduce((sum, tema) => sum + tema.imagenes.length, 0),
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
          maxWidth: 860,
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
              Banco de imágenes
            </h3>
            {!loading && (
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                {totalImagenes} {totalImagenes === 1 ? 'imagen subida' : 'imágenes subidas'} - haz clic para seleccionar
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
              Cargando imágenes...
            </p>
          )}

          {!loading && tree.length === 0 && (
            <div style={{ textAlign: 'center', margin: '48px 0' }}>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No hay imágenes subidas todavía.</p>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: 4 }}>
                Sube imágenes desde el formulario de edición de preguntas.
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
                  transition: 'transform 0.15s',
                  display: 'inline-block',
                  transform: openOposiciones.has(oposicion.oposicionId) ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                  ▶
                </span>
                {oposicion.oposicionNombre}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>
                  {oposicion.temas.reduce((sum, tema) => sum + tema.imagenes.length, 0)} imágenes
                </span>
              </button>

              {openOposiciones.has(oposicion.oposicionId) && (
                <div style={{ paddingLeft: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {oposicion.temas.map((tema) => (
                    <div key={tema.temaId}>
                      <p style={{ margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tema.temaNombre} ({tema.imagenes.length})
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                        {tema.imagenes.map((img) => (
                          <button
                            key={img.preguntaId}
                            type="button"
                            onClick={() => onSelect(img.imagenUrl)}
                            title={img.enunciado}
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: 8,
                              padding: 0,
                              cursor: 'pointer',
                              background: '#f9fafb',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              textAlign: 'left',
                              transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={(event) => { event.currentTarget.style.borderColor = '#ea580c'; }}
                            onMouseLeave={(event) => { event.currentTarget.style.borderColor = '#e5e7eb'; }}
                          >
                            <img
                              src={`${BACKEND_BASE}${img.imagenUrl}`}
                              alt=""
                              style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block', background: '#f3f4f6' }}
                            />
                            <span style={{ padding: '5px 7px', fontSize: '0.7rem', color: '#374151', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              #{img.preguntaId} {img.enunciado}
                            </span>
                          </button>
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
