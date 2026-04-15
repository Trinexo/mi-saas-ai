import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';
import DashboardWidget from '../components/DashboardWidget.jsx';
import PasswordFormSection from '../components/profile/PasswordFormSection';
import ProfileFormSection from '../components/profile/ProfileFormSection';
import { subscriptionApi } from '../services/subscriptionApi';

const ROLE_BADGE = {
  admin:   { label: 'Administrador', bg: '#fef3c7', color: '#92400e' },
  alumno:  { label: 'Alumno',         bg: '#eff6ff', color: '#1d4ed8' },
  editor:  { label: 'Editor',         bg: '#dbeafe', color: '#1d4ed8' },
  revisor: { label: 'Revisor',        bg: '#fef9c3', color: '#a16207' },
  user:    { label: 'Alumno',         bg: '#eff6ff', color: '#1d4ed8' },
};

const PLAN_BADGE = {
  free:  { label: 'Gratuito', bg: '#f3f4f6', color: '#6b7280' },
  pro:   { label: 'Pro',      bg: '#eff6ff', color: '#1d4ed8' },
  elite: { label: 'Elite',    bg: '#fef9c3', color: '#92400e' },
};

export default function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'user';
  const badge = ROLE_BADGE[role] || { label: role, bg: '#f3f4f6', color: '#374151' };
  const inicial = (user?.nombre || user?.email || '?')[0].toUpperCase();

  const [planActual, setPlanActual] = useState(null);

  useEffect(() => {
    if (!token) return;
    subscriptionApi.getMyPlan(token)
      .then((res) => setPlanActual(res?.data?.planActual ?? 'free'))
      .catch(() => setPlanActual('free'));
  }, [token]);

  const planBadge = PLAN_BADGE[planActual] ?? PLAN_BADGE.free;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>Mi perfil</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Gestiona tu información personal y contraseña</p>
      </div>

      {/* Tarjeta de identidad */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0, boxShadow: '0 2px 8px rgba(29,78,216,.25)' }}>
          {inicial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombre || '—'}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>{user?.email || ''}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{ background: badge.bg, color: badge.color, fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>{badge.label}</span>
          {planActual && (
            <span style={{ background: planBadge.bg, color: planBadge.color, fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
              Plan {planBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Banner de upgrade si el plan es free */}
      {planActual === 'free' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e40af' }}>Actualiza a Pro</div>
            <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: 2 }}>Simulacros, repetición espaciada e historial completo por 9,99€/mes</div>
          </div>
          <button
            onClick={() => navigate('/planes')}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', flexShrink: 0 }}
          >
            Ver planes →
          </button>
        </div>
      )}

      {/* Resumen de actividad */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
        <DashboardWidget />
      </div>

      {/* Datos personales */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#111827', paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>Datos personales</h3>
        <ProfileFormSection token={token} refreshUser={refreshUser} />
      </div>

      {/* Contraseña */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.07)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#111827', paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>Cambiar contraseña</h3>
        <PasswordFormSection token={token} />
      </div>

    </div>
  );
}
