const nodemailer = require('nodemailer');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

let transporter;

function isEmailConfigured() {
  return Boolean(env.smtpHost && env.smtpFromEmail);
}

function getTransporter() {
  if (!isEmailConfigured()) {
    throw new AppError(500, 'Email delivery is not configured. Set SMTP credentials in backend/.env.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      connectionTimeout: env.smtpTimeoutMs,
      greetingTimeout: env.smtpTimeoutMs,
      socketTimeout: env.smtpTimeoutMs,
      auth: env.smtpUser ? {
        user: env.smtpUser,
        pass: env.smtpPass,
      } : undefined,
    });
  }

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const client = getTransporter();
  return client.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
    to,
    subject,
    text,
    html,
  });
}

function buildProvisioningEmail({ name, email, password, role }) {
  const loginUrl = env.appLoginUrl;
  const roleLabel = role === 'admin' ? 'Administrator' : 'Owner';
  const lines = [
    `Hello ${name},`,
    '',
    'Your FleetPulse account is ready.',
    '',
    `Role: ${roleLabel}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    '',
    `Sign in: ${loginUrl}`,
    '',
    'For security, you will be required to change this password the first time you sign in.',
    '',
    'If you were not expecting this account, contact your administrator immediately.',
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Your FleetPulse account is ready</h2>
      <p>Hello ${name},</p>
      <p>Your FleetPulse access has been created.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 12px 6px 0; font-weight: 700;">Role</td><td>${roleLabel}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; font-weight: 700;">Email</td><td>${email}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; font-weight: 700;">Temporary password</td><td>${password}</td></tr>
      </table>
      <p><a href="${loginUrl}" style="display: inline-block; background: #4F6EF7; color: #FFFFFF; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Open FleetPulse</a></p>
      <p>For security, you will be required to change this password the first time you sign in.</p>
      <p>If you were not expecting this account, contact your administrator immediately.</p>
    </div>
  `;

  return { text: lines.join('\n'), html };
}

function buildPasswordResetEmail({ name, resetToken }) {
  const loginUrl = env.appLoginUrl;
  const lines = [
    `Hello ${name},`,
    '',
    'A FleetPulse password reset was requested for your account.',
    '',
    `Reset token: ${resetToken}`,
    `Open FleetPulse: ${loginUrl}`,
    '',
    `This token expires in ${env.passwordResetTokenTtlMinutes} minutes.`,
    '',
    'If you did not request this reset, you can ignore this email.',
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">FleetPulse password reset</h2>
      <p>Hello ${name},</p>
      <p>A FleetPulse password reset was requested for your account.</p>
      <p style="font-size: 16px;"><strong>Reset token:</strong> ${resetToken}</p>
      <p><a href="${loginUrl}" style="display: inline-block; background: #4F6EF7; color: #FFFFFF; padding: 10px 16px; border-radius: 8px; text-decoration: none;">Open FleetPulse</a></p>
      <p>This token expires in ${env.passwordResetTokenTtlMinutes} minutes.</p>
      <p>If you did not request this reset, you can ignore this email.</p>
    </div>
  `;

  return { text: lines.join('\n'), html };
}

async function sendProvisioningEmail(payload) {
  const content = buildProvisioningEmail(payload);
  return sendEmail({
    to: payload.email,
    subject: 'Your FleetPulse account credentials',
    ...content,
  });
}

async function sendPasswordResetEmail(payload) {
  const content = buildPasswordResetEmail(payload);
  return sendEmail({
    to: payload.email,
    subject: 'FleetPulse password reset',
    ...content,
  });
}

module.exports = {
  isEmailConfigured,
  sendProvisioningEmail,
  sendPasswordResetEmail,
};
