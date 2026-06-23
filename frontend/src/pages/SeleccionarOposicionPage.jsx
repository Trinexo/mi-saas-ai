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
        borderRadius: 14,
        padding: 'clamp(14px, 3vw, 20px) clamp(14px, 4vw, 24px)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: 0,
        overflow: 'hidden',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, minWidth: 0 }}>
        <span style={{ fontSize: '1.4rem' }}>📋</span>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: DK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{nombre}</span>
        <span style={{ marginLeft: 'auto', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
          ✓ Activo
        </span>
      </div>
      {fechaFin && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: GL }}>
          Acceso hasta {new Date(fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      )}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: O, fontSize: '0.82rem', fontWeight: 700 }}>
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
      setOposicionActiva({
        id: accesos[0].oposicion_id,
        nombre: accesos[0].nombre,
        modoPreparacion: accesos[0].modo_preparacion,
        tipoAlumno: accesos[0].tipo_alumno,
      });
      navigate('/', { replace: true });
    }
  }, [loading, accesos, setOposicionActiva, navigate]);

  const handleSeleccionar = (acceso) => {
    setOposicionActiva({
      id: acceso.oposicion_id,
      nombre: acceso.nombre,
      modoPreparacion: acceso.modo_preparacion,
      tipoAlumno: acceso.tipo_alumno,
    });
    navigate('/', { replace: true });
  };

  if (loading || accesos.length === 1) return <Spinner />;

  return (
    <div className="auth-screen">
      {/* Logo / Marca */}
      <div className="auth-logo-area">
        <div style={{ width: 44, height: 44, borderRadius: 14, background: OBG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 10px' }}>
          🎯
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 5vw, 1.5rem)', fontWeight: 900, color: DK }}>¿Con qué oposición trabajamos hoy?</h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: GL }}>
          Tienes acceso a {accesos.length} oposicion{accesos.length !== 1 ? 'es' : ''}. Elige una.
        </p>
      </div>

      {/* Tarjetas */}
      <div className="auth-cards-list">
        {accesos.map((acceso) => (
          <OposicionOpcionCard
            key={acceso.oposicion_id}
            nombre={acceso.nombre}
            fechaFin={acceso.fecha_fin}
            onClick={() => handleSeleccionar(acceso)}
          />
        ))}
      </div>

      <p style={{ marginTop: 16, fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center', flexShrink: 0 }}>
        Puedes cambiar de oposición desde tu perfil.
      </p>
    </div>
  );
}
