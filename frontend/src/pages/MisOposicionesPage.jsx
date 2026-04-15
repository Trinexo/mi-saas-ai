import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testApi } from '../services/testApi';
import { catalogApi } from '../services/catalogApi';
import { useAuth } from '../state/auth.jsx';
import { useUserAccesos } from '../hooks/useUserAccesos';
import OposicionCard from '../components/misoposiciones/OposicionCard';

function Spinner() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #dbeafe', borderTopColor: '#1d4ed8', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Cargando…</p>
    </div>
  );
}

// Tarjeta para un curso comprado sin actividad aún
function AccesoSinActividadCard({ nombre, fechaFin, onPracticar, onVerCatalogo }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '22px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>📋</span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{nombre}</h3>
          <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>✓ Acceso activo</span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
          {fechaFin ? `Acceso hasta ${new Date(fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Acceso sin fecha de expiración'}
          {' · '}Todavía no has practicado esta oposición.
        </p>
      </div>
      <button
        onClick={onPracticar}
        style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', flexShrink: 0 }}
      >
        ▷ Empezar a practicar
      </button>
    </div>
  );
}

export default function MisOposicionesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { accesos, loading: loadingAccesos } = useUserAccesos();
  const [statsOps, setStatsOps] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [error, setError] = useState('');
  const [showDemos, setShowDemos] = useState(false);

  useEffect(() => {
    Promise.all([
      testApi.getMisOposiciones(token),
      catalogApi.getOposiciones(),
    ])
      .then(([statsData, catalogoData]) => {
        setStatsOps(Array.isArray(statsData) ? statsData : []);
        setCatalogo(Array.isArray(catalogoData) ? catalogoData : (catalogoData?.data ?? []));
      })
      .catch((e) => setError(e.message || 'No se pudo cargar la información'));
  }, [token]);

  if (loadingAccesos || !statsOps) return <Spinner />;
  if (error) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>⚠️</div>
      <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
    </div>
  );

  // Mapa de stats por oposicionId
  const statsMap = {};
  statsOps.forEach((op) => { statsMap[op.oposicionId] = op; });

  // Mapa de nombres del catálogo
  const nombreMap = {};
  catalogo.forEach((op) => { nombreMap[op.id] = op.nombre; });

  // Cursos comprados (acceso activo)
  const cursosComprados = accesos.map((a) => ({
    oposicionId: Number(a.oposicion_id),
    nombre: nombreMap[a.oposicion_id] ?? `Oposición ${a.oposicion_id}`,
    fechaFin: a.fecha_fin,
    stats: statsMap[Number(a.oposicion_id)] ?? null,
  }));

  // Ids con acceso
  const idsConAcceso = new Set(cursosComprados.map((c) => c.oposicionId));

  // Demos: oposiciones con actividad pero sin acceso comprado
  const demos = statsOps.filter((op) => !idsConAcceso.has(op.oposicionId));

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Mis cursos</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
            {cursosComprados.length === 0
              ? 'Todavía no tienes ningún curso activo.'
              : `${cursosComprados.length} ${cursosComprados.length === 1 ? 'curso activo' : 'cursos activos'}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/catalogo')}
          style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #1d4ed8', background: '#fff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Ver catálogo →
        </button>
      </div>

      {/* Sin cursos comprados */}
      {cursosComprados.length === 0 && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '28px 24px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📚</div>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e40af' }}>Todavía no tienes ningún curso activo</p>
          <p style={{ margin: '6px 0 16px', fontSize: '0.85rem', color: '#3b82f6' }}>
            Compra acceso al banco de preguntas de la oposición que quieres preparar.
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Ver catálogo de cursos
          </button>
        </div>
      )}

      {/* Cursos comprados */}
      {cursosComprados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {cursosComprados.map((c) =>
            c.stats ? (
              <div key={c.oposicionId} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 1 }}>
                  <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>✓ Acceso activo</span>
                </div>
                <OposicionCard
                  op={c.stats}
                  onNavigate={(id) => navigate(`/oposicion/${id}`)}
                  onPracticar={(id) => navigate('/configurar-test', { state: { oposicionId: id } })}
                />
              </div>
            ) : (
              <AccesoSinActividadCard
                key={c.oposicionId}
                nombre={c.nombre}
                fechaFin={c.fechaFin}
                onPracticar={() => navigate('/configurar-test', { state: { oposicionId: c.oposicionId } })}
              />
            )
          )}
        </div>
      )}

      {/* Demos (actividad sin curso) */}
      {demos.length > 0 && (
        <div>
          <button
            onClick={() => setShowDemos((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.82rem', fontWeight: 600, padding: '4px 0', marginBottom: showDemos ? 12 : 0 }}
          >
            <span style={{ transform: showDemos ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>▶</span>
            {demos.length} oposición{demos.length !== 1 ? 'es' : ''} practicada{demos.length !== 1 ? 's' : ''} en modo demo
          </button>
          {showDemos && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {demos.map((op) => (
                <div key={op.oposicionId} style={{ position: 'relative', opacity: 0.75 }}>
                  <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 1, display: 'flex', gap: 6 }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>Demo</span>
                    <button
                      onClick={() => navigate('/catalogo')}
                      style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', cursor: 'pointer' }}
                    >
                      Comprar acceso
                    </button>
                  </div>
                  <OposicionCard
                    op={op}
                    onNavigate={(id) => navigate(`/oposicion/${id}`)}
                    onPracticar={(id) => navigate('/configurar-test', { state: { oposicionId: id } })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
