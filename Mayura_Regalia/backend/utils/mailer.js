// Sends email through any SMTP service (Gmail, Brevo, Zoho, your host...).
// Configure in backend/.env - see .env.example. If SMTP is not configured, or the "nodemailer"
// package is not installed yet, sending is skipped with a log line and NEVER breaks an order.
let transporter;
let warned = false;

function configured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (transporter !== undefined) return transporter;
  transporter = null;
  if (!configured()) return transporter;
  try {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } catch (e) {
    console.warn('Email disabled: "nodemailer" is not installed. Run "npm install" in the backend folder.');
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  if (!to) return false;
  const t = getTransporter();
  if (!t) {
    if (!warned) {
      warned = true;
      console.log('Order emails are OFF (set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env to turn them on).');
    }
    return false;
  }
  try {
    const from = process.env.MAIL_FROM || `"Mayura Regalia" <${process.env.SMTP_USER}>`;
    await t.sendMail({ from, to, subject, html, text, replyTo: process.env.MAIL_REPLY_TO || undefined });
    return true;
  } catch (error) {
    console.error('Email failed:', error.message);
    return false;
  }
}

module.exports = { sendMail, configured };
