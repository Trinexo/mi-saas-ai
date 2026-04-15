-- Migración 009: tabla de configuración del sistema (email + stripe)
-- Los valores secretos se almacenan cifrados con AES-256-GCM en el backend.

CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave           VARCHAR(100)  PRIMARY KEY,
  valor           TEXT,
  es_secreto      BOOLEAN       NOT NULL DEFAULT false,
  descripcion     VARCHAR(255),
  actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Registra las claves conocidas (sin valores — se configuran desde el panel admin)
INSERT INTO configuracion_sistema (clave, es_secreto, descripcion) VALUES
  ('smtp_host',              false, 'Servidor SMTP (ej: smtp.resend.com)'),
  ('smtp_port',              false, 'Puerto SMTP (ej: 465, 587)'),
  ('smtp_secure',            false, 'TLS activado: true o false'),
  ('smtp_user',              false, 'Usuario SMTP'),
  ('smtp_pass',              true,  'Contraseña SMTP (almacenada cifrada)'),
  ('email_from',             false, 'Dirección remitente (ej: "App" <noreply@dominio.es>)'),
  ('app_name',               false, 'Nombre de la aplicación en los emails'),
  ('stripe_secret_key',      true,  'Clave secreta Stripe (sk_test_... o sk_live_...)'),
  ('stripe_webhook_secret',  true,  'Secreto del webhook Stripe (whsec_...)')
ON CONFLICT (clave) DO NOTHING;
