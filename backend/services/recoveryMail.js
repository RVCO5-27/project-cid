/**
 * Recovery email sender.
 * Supports:
 * 1) Generic SMTP via SMTP_*
 * 2) Gmail via GMAIL_USER + GMAIL_APP_PASSWORD
 * Falls back to console log in development.
 */
require('dotenv').config();

function buildRecoveryLink(token) {
  const base = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/admin/reset-access?token=${encodeURIComponent(token)}`;
}

async function sendRecoveryEmail({ to, token, username }) {
  const link = buildRecoveryLink(token);
  const subject = 'SDO SHS Portal — Account recovery';
  const text = `Hello${username ? ` ${username}` : ''},

Someone requested recovery for your administrator account after multiple failed sign-in attempts.

Open this link within 15 minutes to reset access (you will be asked to choose a new password):
${link}

If you did not attempt to sign in, contact your division ICT office immediately.

— SDO Cabuyao SHS Portal`;

  const nodemailer = require('nodemailer');
  let transporter = null;
  let fromAddress = null;
  let mode = 'none';

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    mode = 'smtp';
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
      },
    });
    fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    mode = 'gmail';
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    fromAddress = process.env.SMTP_FROM || process.env.GMAIL_USER;
  }

  if (!transporter) {
    console.warn('[recovery] SMTP not configured — recovery link (dev):');
    console.warn(link);
    return { sent: false, link, reason: 'MAIL_NOT_CONFIGURED' };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[recovery] ${mode.toUpperCase()} send failed:`, err.message);
    return { sent: false, link, reason: 'MAIL_SEND_FAILED' };
  }

}

module.exports = { sendRecoveryEmail, buildRecoveryLink };
