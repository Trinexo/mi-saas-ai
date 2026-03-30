import { useAuth } from '../state/auth.jsx';
import DashboardWidget from '../components/DashboardWidget.jsx';
import PasswordFormSection from '../components/profile/PasswordFormSection';
import ProfileFormSection from '../components/profile/ProfileFormSection';

export default function ProfilePage() {
  const { token, user, refreshUser } = useAuth();

  return (
    <div style={{ maxWidth: 540, margin: '2rem auto', padding: '0 1rem' }}>
      <h2>Mi perfil</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Rol: <strong>{user?.role}</strong></p>
      <DashboardWidget />
      <ProfileFormSection token={token} refreshUser={refreshUser} />
      <PasswordFormSection token={token} />
    </div>
  );
}
