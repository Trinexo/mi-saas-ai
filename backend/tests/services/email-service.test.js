import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { settingsService } from '../../src/services/settings.service.js';
import { emailService } from '../../src/services/email.service.js';

const originalNodeEnv = process.env.NODE_ENV;
const originalGetEmailConfig = settingsService.getEmailConfig;
const originalCreateTransport = nodemailer.createTransport;
const originalGetTestMessageUrl = nodemailer.getTestMessageUrl;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  settingsService.getEmailConfig = originalGetEmailConfig;
  nodemailer.createTransport = originalCreateTransport;
  nodemailer.getTestMessageUrl = originalGetTestMessageUrl;
});

test('emailService no crea transporter ni consulta config en NODE_ENV=test', async () => {
  process.env.NODE_ENV = 'test';
  settingsService.getEmailConfig = async () => {
    throw new Error('No debe consultar configuracion SMTP en test');
  };
  nodemailer.createTransport = () => {
    throw new Error('No debe crear transporter SMTP en test');
  };

  await emailService.sendWelcome({ to: 'alumno@example.test', nombre: 'Alumno' });
  await emailService.sendAccesoConfirmado({
    to: 'alumno@example.test',
    nombre: 'Alumno',
    oposicionNombre: 'Auxiliar',
  });
  await emailService.sendSuscripcionConfirmada({
    to: 'alumno@example.test',
    nombre: 'Alumno',
    plan: 'Pro',
  });
  await emailService.sendPasswordReset({
    to: 'alumno@example.test',
    nombre: 'Alumno',
    token: 'token-test',
  });
});

test('emailService mantiene envio normal fuera de NODE_ENV=test', async () => {
  process.env.NODE_ENV = 'development';
  const sent = [];
  let transportOptions = null;

  settingsService.getEmailConfig = async () => ({
    host: 'smtp.local.test',
    port: 2525,
    secure: false,
    user: 'smtp-user',
    pass: 'smtp-pass',
    from: 'no-reply@example.test',
    appName: 'Albacer Test',
  });
  nodemailer.createTransport = (options) => {
    transportOptions = options;
    return {
      sendMail: async (payload) => {
        sent.push(payload);
        return { messageId: 'message-id' };
      },
    };
  };
  nodemailer.getTestMessageUrl = () => null;

  await emailService.sendWelcome({ to: 'alumno@example.test', nombre: 'Alumno' });

  assert.deepEqual(transportOptions, {
    host: 'smtp.local.test',
    port: 2525,
    secure: false,
    auth: { user: 'smtp-user', pass: 'smtp-pass' },
    tls: { rejectUnauthorized: false },
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].from, 'no-reply@example.test');
  assert.equal(sent[0].replyTo, 'no-reply@example.test');
  assert.equal(sent[0].to, 'alumno@example.test');
  assert.match(sent[0].subject, /Albacer Test/);
  assert.equal(typeof sent[0].html, 'string');
  assert.equal(typeof sent[0].text, 'string');
});
