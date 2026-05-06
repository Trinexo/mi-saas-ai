import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAccesos } from '../hooks/useUserAccesos';
import { useOposicionActiva } from '../state/oposicionActiva';

/* ── Paleta ─────────────────────────────────────────── */
const O    = '#ea580c';
const OBG  = '#fff7ed';
const BD   = '#e5e7eb';
const DK   = '#111827';
const GL   = '#6b7280';

/* ── Spinner ──────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 38, height: 38, borderRadius: '50%', border: `4px solid ${OBG}`, borderTopColor: O, animation: 'spin .8s linear infinite' }} />
      <p style={{ margin: 0, color: GL, fontSize: '0.875rem' }}>Cargando…</p>
    </div>
  );
}

/* ── Tarjeta de oposición ─────────────────────────── */
function OposicionOpcionCard({ nombre, fechaFin, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff',
        border: `2px solid ${BD}`,
        borderRadius: 16,
        padding: '24px 28px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = O;
        e.currentTarget.style.boxShadow = `0 4px 18px rgba(234,88,12,.12)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = BD;
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: '1.4rem' }}>📋</span>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: DK }}>{nombre}</span>
        <span style={{ marginLeft: 'auto', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
          ✓ Activo
        </span>
      </div>
      {fechaFin && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>
          Acceso hasta {new Date(fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      )}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: O, fontSize: '0.85rem', fontWeight: 700 }}>
        Seleccionar esta oposición <span style={{ fontSize: '1rem' }}>→</span>
      </div>
    </button>
  );
}

/* ── Página ───────────────────────────────────────── */
export default function SeleccionarOposicionPage() {
  const navigate = useNavigate();
  const { accesos, loading } = useUserAccesos();
  const { setOposicionActiva } = useOposicionActiva();

  // Auto-selección si solo queda una (salvaguarda)
  useEffect(() => {
    if (!loading && accesos.length === 1) {
      setOposicionActiva({ id: accesos[0].oposicion_id, nombre: accesos[0].nombre });
      navigate('/', { replace: true });
    }
  }, [loading, accesos, setOposicionActiva, navigate]);

  const handleSeleccionar = (acceso) => {
    setOposicionActiva({ id: acceso.oposicion_id, nombre: acceso.nombre });
    navigate('/', { replace: true });
  };

  if (loading || accesos.length === 1) return <Spinner />;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Logo / Marca */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: OBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 12px' }}>
          🎯
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: DK }}>¿Con qué oposición trabajamos hoy?</h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: GL }}>
          Tienes acceso a {accesos.length} oposiciones. Elige una para filtrar toda la plataforma.
        </p>
      </div>

      {/* Tarjetas */}
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {accesos.map((acceso) => (
          <OposicionOpcionCard
            key={acceso.oposicion_id}
            nombre={acceso.nombre}
            fechaFin={acceso.fecha_fin}
            onClick={() => handleSeleccionar(acceso)}
          />
        ))}
      </div>

      <p style={{ marginTop: 28, fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
        Puedes cambiar de oposición en cualquier momento desde tu perfil.
      </p>
    </div>
  );
}
