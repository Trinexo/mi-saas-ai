import crypto from 'node:crypto';
import { settingsRepository } from '../repositories/settings.repository.js';

// ─── Cifrado AES-256-GCM ──────────────────────────────────────────────────────
// La clave de cifrado se deriva de JWT_SECRET con scrypt.
// Formato del valor almacenado en BD: base64(iv[12] + authTag[16] + ciphertext)

const ALGORITHM = 'aes-256-gcm';
const SALT = 'plataforma-settings-salt-v1';

function deriveKey() {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
  return crypto.scryptSync(secret, SALT, 32);
}

function encrypt(plaintext) {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext) {
  try {
    const buf = Buffer.from(ciphertext, 'base64');
    const key = deriveKey();
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return null;
  }
}

// ─── Definición de claves conocidas ──────────────────────────────────────────

const DEFINICIONES = {
  smtp_host:             { grupo: 'email',  esSecreto: false, label: 'Servidor SMTP' },
  smtp_port:             { grupo: 'email',  esSecreto: false, label: 'Puerto SMTP' },
  smtp_secure:           { grupo: 'email',  esSecreto: false, label: 'TLS activado' },
  smtp_user:             { grupo: 'email',  esSecreto: false, label: 'Usuario SMTP' },
  smtp_pass:             { grupo: 'email',  esSecreto: true,  label: 'Contraseña SMTP' },
  email_from:            { grupo: 'email',  esSecreto: false, label: 'Remitente (from)' },
  app_name:              { grupo: 'email',  esSecreto: false, label: 'Nombre app' },
  stripe_secret_key:     { grupo: 'stripe', esSecreto: true,  label: 'Clave secreta Stripe' },
  stripe_webhook_secret: { grupo: 'stripe', esSecreto: true,  label: 'Webhook secret Stripe' },
};

// ─── Cache en memoria ─────────────────────────────────────────────────────────
// TTL de 5 minutos. Se invalida al guardar un cambio.

let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── settingsService ──────────────────────────────────────────────────────────

export const settingsService = {
  invalidateCache() {
    _cache = null;
  },

  /** Carga y cachea todas las claves (descifra los secretos). */
  async _load() {
    if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) return _cache;

    const rows = await settingsRepository.getAll();
    const map = {};
    for (const row of rows) {
      if (!row.valor) continue;
      const def = DEFINICIONES[row.clave];
      map[row.clave] = def?.esSecreto ? decrypt(row.valor) : row.valor;
    }
    _cache = map;
    _cacheAt = Date.now();
    return _cache;
  },

  /**
   * Configuración de email: BD primero, luego variables de entorno.
   */
  async getEmailConfig() {
    const s = await this._load();
    return {
      host:    s.smtp_host    || process.env.SMTP_HOST    || null,
      port:    Number(s.smtp_port || process.env.SMTP_PORT || 465),
      secure:  (s.smtp_secure ?? process.env.SMTP_SECURE) !== 'false',
      user:    s.smtp_user    || process.env.SMTP_USER    || null,
      pass:    s.smtp_pass    || process.env.SMTP_PASS    || null,
      from:    s.email_from   || process.env.EMAIL_FROM   || '"Plataforma Test" <noreply@plataformatest.es>',
      appName: s.app_name     || process.env.APP_NAME     || 'Plataforma Test',
    };
  },

  /**
   * Configuración de Stripe: BD primero, luego variables de entorno.
   */
  async getStripeConfig() {
    const s = await this._load();
    return {
      secretKey:     s.stripe_secret_key     || process.env.STRIPE_SECRET_KEY     || null,
      webhookSecret: s.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || null,
    };
  },

  /**
   * Devuelve todos los ajustes para la UI del admin.
   * Los secretos sólo informan si están configurados (valor = null en la respuesta).
   */
  async getForAdmin() {
    const rows = await settingsRepository.getAll();
    return rows.map((row) => ({
      clave:          row.clave,
      configurado:    Boolean(row.valor),
      valor:          row.es_secreto ? null : (row.valor ?? null),
      es_secreto:     row.es_secreto,
      descripcion:    row.descripcion,
      actualizado_en: row.actualizado_en,
    }));
  },

  /**
   * Guarda un grupo de claves (email | stripe).
   * Cifra los secretos antes de persistir.
   * Ignora entradas vacías.
   */
  async updateGrupo(grupo, datos) {
    const entries = [];

    for (const [clave, valor] of Object.entries(datos)) {
      // Omite valores vacíos (no sobreescribir con nada)
      if (valor === null || valor === undefined || valor === '') continue;

      const def = DEFINICIONES[clave];
      if (!def || def.grupo !== grupo) continue;

      entries.push({
        clave,
        valor: def.esSecreto ? encrypt(String(valor)) : String(valor),
      });
    }

    await settingsRepository.upsertMany(entries);
    this.invalidateCache();
  },
};
