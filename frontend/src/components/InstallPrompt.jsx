import { useState, useEffect } from 'react';

/**
 * Banner de instalación PWA.
 * Se muestra automáticamente en móvil cuando el navegador dispara 
 * el evento `beforeinstallprompt`, y se descarta al instalar o cerrar.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No mostrar si ya está instalado como PWA (display=standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    // No volver a mostrar en esta sesión
    sessionStorage.setItem('pwa_dismissed', '1');
  };

  return (
    <div className="pwa-install-bar" role="banner">
      {/* Icono */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: '#ea580c', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem', fontWeight: 900, color: '#fff',
      }}>
        A
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f9fafb', lineHeight: 1.3 }}>
          Instalar AlbacerTest
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>
          Accede sin internet y más rápido
        </div>
      </div>

      {/* Botón instalar */}
      <button
        onClick={handleInstall}
        style={{
          background: '#ea580c', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 14px',
          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
          flexShrink: 0, minHeight: 36,
        }}
      >
        Instalar
      </button>

      {/* Cerrar */}
      <button
        onClick={handleDismiss}
        aria-label="Cerrar"
        style={{
          background: 'transparent', border: 'none', color: '#6b7280',
          cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
          flexShrink: 0, minWidth: 28, minHeight: 28,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
