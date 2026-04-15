import { useEffect, useState } from 'react';
import { useAuth } from '../../state/auth.jsx';
import { adminApi } from '../../services/adminApi';

// ─── Estilos inline (patrón consistente con el resto del admin) ───────────────
const CARD = {
  background: '#fff',
  borderRadius: 10,
  padding: '24px 28px',
  boxShadow: '0 1px 3px rgba(0,0,0,.08)',
  marginBottom: 24,
};
const LABEL = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
};
const INPUT = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};
const INPUT_MONO = { ...INPUT, fontFamily: 'monospace', letterSpacing: '0.02em' };
const BTN_PRIMARY = {
  padding: '8px 20px',
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};
const BTN_SECONDARY = {
  padding: '8px 20px',
  background: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
};
const BADGE_OK  = { background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 };
const BADGE_NOK = { background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const row = (cfg, clave) => cfg.find((c) => c.clave === clave) || {};
const isConfigured = (cfg, clave) => row(cfg, clave).configurado;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { token } = useAuth();

  const [cfg, setCfg] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Email form ──
  const [email, setEmail] = useState({
    smtp_host: '', smtp_port: '', smtp_secure: 'true',
    smtp_user: '', smtp_pass: '', email_from: '', app_name: '',
  });
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  const [mensajeEmail, setMensajeEmail] = useState(null); // {tipo: 'ok'|'error', texto}
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // ── Stripe form ──
  const [stripe, setStripe] = useState({ stripe_secret_key: '', stripe_webhook_secret: '' });
  const [guardandoStripe, setGuardandoStripe] = useState(false);
  const [mensajeStripe, setMensajeStripe] = useState(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  // ── Test email ──
  const [testDest, setTestDest] = useState('');
  const [testando, setTestando] = useState(false);
  const [mensajeTest, setMensajeTest] = useState(null);

  useEffect(() => {
    adminApi.getSettings(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCfg(list);
        // Pre-rellenar valores no secretos
        const byKey = Object.fromEntries(list.map((r) => [r.clave, r]));
        setEmail((prev) => ({
          ...prev,
          smtp_host:    byKey.smtp_host?.valor     || '',
          smtp_port:    byKey.smtp_port?.valor     || '',
          smtp_secure:  byKey.smtp_secure?.valor   || 'true',
          smtp_user:    byKey.smtp_user?.valor     || '',
          email_from:   byKey.email_from?.valor    || '',
          app_name:     byKey.app_name?.valor      || '',
        }));
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [token]);

  // ── Guardar email ──
  const onGuardarEmail = async () => {
    setGuardandoEmail(true);
    setMensajeEmail(null);
    try {
      const payload = { ...email };
      if (!payload.smtp_pass) delete payload.smtp_pass; // no sobreescribir con vacío
      await adminApi.updateEmailSettings(token, payload);
      setMensajeEmail({ tipo: 'ok', texto: 'Configuración guardada' });
      setEmail((p) => ({ ...p, smtp_pass: '' }));
    } catch (e) {
      setMensajeEmail({ tipo: 'error', texto: e.message || 'Error al guardar' });
    } finally {
      setGuardandoEmail(false);
    }
  };

  // ── Guardar Stripe ──
  const onGuardarStripe = async () => {
    setGuardandoStripe(true);
    setMensajeStripe(null);
    try {
      const payload = { ...stripe };
      if (!payload.stripe_secret_key) delete payload.stripe_secret_key;
      if (!payload.stripe_webhook_secret) delete payload.stripe_webhook_secret;
      await adminApi.updateStripeSettings(token, payload);
      setMensajeStripe({ tipo: 'ok', texto: 'Configuración guardada' });
      setStripe({ stripe_secret_key: '', stripe_webhook_secret: '' });
    } catch (e) {
      setMensajeStripe({ tipo: 'error', texto: e.message || 'Error al guardar' });
    } finally {
      setGuardandoStripe(false);
    }
  };

  // ── Test email ──
  const onTestEmail = async () => {
    if (!testDest) return;
    setTestando(true);
    setMensajeTest(null);
    try {
      await adminApi.testEmailSettings(token, testDest);
      setMensajeTest({ tipo: 'ok', texto: `Email enviado a ${testDest}` });
    } catch (e) {
      setMensajeTest({ tipo: 'error', texto: e.message || 'Error al enviar' });
    } finally {
      setTestando(false);
    }
  };

  if (cargando) return <p style={{ padding: 24 }}>Cargando configuración…</p>;

  return (
    <div style={{ maxWidth: 740 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: '1.375rem', fontWeight: 700, color: '#111827' }}>
        Ajustes del sistema
      </h1>

      {/* ── Email ─────────────────────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: '1.1rem' }}>✉️</span>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
            Configuración de correo electrónico
          </h2>
          <span style={isConfigured(cfg, 'smtp_host') ? BADGE_OK : BADGE_NOK}>
            {isConfigured(cfg, 'smtp_host') ? 'Configurado' : 'Sin configurar'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
          <div>
            <label style={LABEL}>Servidor SMTP <em style={{ color: '#9ca3af', fontWeight: 400 }}>(ej: smtp.resend.com)</em></label>
            <input style={INPUT} value={email.smtp_host} onChange={(e) => setEmail({ ...email, smtp_host: e.target.value })} placeholder="smtp.ejemplo.com" />
          </div>
          <div>
            <label style={LABEL}>Puerto</label>
            <input style={INPUT} type="number" value={email.smtp_port} onChange={(e) => setEmail({ ...email, smtp_port: e.target.value })} placeholder="465" />
          </div>
          <div>
            <label style={LABEL}>TLS / SSL</label>
            <select style={INPUT} value={email.smtp_secure} onChange={(e) => setEmail({ ...email, smtp_secure: e.target.value })}>
              <option value="true">Activado (puerto 465)</option>
              <option value="false">Desactivado (puerto 587)</option>
            </select>
          </div>
          <div>
            <label style={LABEL}>Usuario SMTP</label>
            <input style={INPUT} value={email.smtp_user} onChange={(e) => setEmail({ ...email, smtp_user: e.target.value })} placeholder="resend (para Resend.com)" />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={LABEL}>
              Contraseña SMTP
              {isConfigured(cfg, 'smtp_pass') && <span style={{ ...BADGE_OK, marginLeft: 8 }}>Guardada</span>}
            </label>
            <input
              style={INPUT}
              type={showSmtpPass ? 'text' : 'password'}
              value={email.smtp_pass}
              onChange={(e) => setEmail({ ...email, smtp_pass: e.target.value })}
              placeholder={isConfigured(cfg, 'smtp_pass') ? '(dejar vacío = no cambiar)' : 're_xxxxxxxxxx'}
            />
            <button
              type="button"
              style={{ position: 'absolute', right: 8, top: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem' }}
              onClick={() => setShowSmtpPass((v) => !v)}
            >
              {showSmtpPass ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <div />
          <div>
            <label style={LABEL}>Dirección remitente (from)</label>
            <input style={INPUT} value={email.email_from} onChange={(e) => setEmail({ ...email, email_from: e.target.value })} placeholder='"Plataforma Test" <noreply@dominio.es>' />
          </div>
          <div>
            <label style={LABEL}>Nombre de la aplicación</label>
            <input style={INPUT} value={email.app_name} onChange={(e) => setEmail({ ...email, app_name: e.target.value })} placeholder="Plataforma Test" />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={BTN_PRIMARY} onClick={onGuardarEmail} disabled={guardandoEmail}>
            {guardandoEmail ? 'Guardando…' : 'Guardar configuración'}
          </button>
          {mensajeEmail && (
            <span style={mensajeEmail.tipo === 'ok' ? BADGE_OK : BADGE_NOK}>{mensajeEmail.texto}</span>
          )}
        </div>

        {/* Test de envío */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
            Enviar email de prueba
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              style={{ ...INPUT, maxWidth: 280 }}
              type="email"
              value={testDest}
              onChange={(e) => setTestDest(e.target.value)}
              placeholder="tu@email.com"
            />
            <button style={BTN_SECONDARY} onClick={onTestEmail} disabled={testando || !testDest}>
              {testando ? 'Enviando…' : 'Probar envío'}
            </button>
          </div>
          {mensajeTest && (
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: mensajeTest.tipo === 'ok' ? '#166534' : '#991b1b' }}>
              {mensajeTest.texto}
            </p>
          )}
        </div>
      </div>

      {/* ── Stripe ────────────────────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: '1.1rem' }}>💳</span>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
            Configuración de Stripe
          </h2>
          <span style={isConfigured(cfg, 'stripe_secret_key') ? BADGE_OK : BADGE_NOK}>
            {isConfigured(cfg, 'stripe_secret_key') ? 'Configurado' : 'Sin configurar'}
          </span>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#6b7280' }}>
          Obtén las claves en{' '}
          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
            dashboard.stripe.com/apikeys
          </a>{' '}
          y el webhook secret en la sección Webhooks del dashboard.
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <label style={LABEL}>
              Clave secreta (Secret key)
              {isConfigured(cfg, 'stripe_secret_key') && <span style={{ ...BADGE_OK, marginLeft: 8 }}>Guardada</span>}
            </label>
            <input
              style={INPUT_MONO}
              type={showSecretKey ? 'text' : 'password'}
              value={stripe.stripe_secret_key}
              onChange={(e) => setStripe({ ...stripe, stripe_secret_key: e.target.value })}
              placeholder={isConfigured(cfg, 'stripe_secret_key') ? '(dejar vacío = no cambiar)' : 'sk_test_…'}
            />
            <button
              type="button"
              style={{ position: 'absolute', right: 8, top: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem' }}
              onClick={() => setShowSecretKey((v) => !v)}
            >
              {showSecretKey ? 'Ocultar' : 'Ver'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={LABEL}>
              Webhook Secret
              {isConfigured(cfg, 'stripe_webhook_secret') && <span style={{ ...BADGE_OK, marginLeft: 8 }}>Guardado</span>}
            </label>
            <input
              style={INPUT_MONO}
              type={showWebhook ? 'text' : 'password'}
              value={stripe.stripe_webhook_secret}
              onChange={(e) => setStripe({ ...stripe, stripe_webhook_secret: e.target.value })}
              placeholder={isConfigured(cfg, 'stripe_webhook_secret') ? '(dejar vacío = no cambiar)' : 'whsec_…'}
            />
            <button
              type="button"
              style={{ position: 'absolute', right: 8, top: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem' }}
              onClick={() => setShowWebhook((v) => !v)}
            >
              {showWebhook ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={BTN_PRIMARY} onClick={onGuardarStripe} disabled={guardandoStripe}>
            {guardandoStripe ? 'Guardando…' : 'Guardar configuración'}
          </button>
          {mensajeStripe && (
            <span style={mensajeStripe.tipo === 'ok' ? BADGE_OK : BADGE_NOK}>{mensajeStripe.texto}</span>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: -12 }}>
        Los valores secretos se almacenan cifrados (AES-256-GCM). El servidor los descifra en memoria al enviar emails o procesar pagos.
      </p>
    </div>
  );
}
