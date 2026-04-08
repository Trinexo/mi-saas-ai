import { useAuth } from '../state/auth.jsx';
import DashboardWidget from '../components/DashboardWidget.jsx';
import PasswordFormSection from '../components/profile/PasswordFormSection';
import ProfileFormSection from '../components/profile/ProfileFormSection';

const ROLE_BADGE = {
  admin: { label: 'Administrador', bg: '#fef3c7', color: '#92400e' },
  user: { label: 'Alumno', bg: '#eff6ff', color: '#1d4ed8' },
};

export default function ProfilePage() {
  const { token, user, refreshUser } = useAuth();
  const role = user?.role || 'user';
  const badge = ROLE_BADGE[role] || { label: role, bg: '#f3f4f6', color: '#374151' };
  const inicial = (user?.nombre || user?.email || '?')[0].toUpperCase();

  return (
    <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>Mi perfil</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>Gestiona tu informacion personal y contrasena</p>
      </div>

      {/* Tarjeta de identidad */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1d4ed8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem', fontWeight: 700, flexShrink: 0 }}>
          {inicial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{user?.nombre || '—'}</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 2 }}>{user?.email || ''}</div>
        </div>
        <span style={{ background: badge.bg, color: badge.color, fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{badge.label}</span>
      </div>

      {/* Resumen */}
      <div style={{ marginBottom: 16 }}>
        <DashboardWidget />
      </div>

      {/* Datos personales */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#111827', paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>Datos personales</h3>
        <ProfileFormSection token={token} refreshUser={refreshUser} />
      </div>

      {/* Contrasena */}
      <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#111827', paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>Cambiar contrasena</h3>
        <PasswordFormSection token={token} />
      </div>
    </div>
  );
}
