const nodemailer = require('nodemailer');

const FROM = process.env.SMTP_FROM || 'no-reply@example.com';

let transporter = null;
let warnedNoSmtp = false;

// Real SMTP when configured; otherwise a dev fallback that just logs the email to the console
// (so OTP / newsletter flows are fully testable without real mail credentials).
const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    if (!warnedNoSmtp) {
      console.warn('[mailService] SMTP_* env vars not set — emails will be logged to the console instead of sent.');
      warnedNoSmtp = true;
    }
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const info = await getTransporter().sendMail({ from: FROM, to, subject, html, text });
  if (info.message) console.log(`[mailService] (dev) email to ${to}: ${subject}`); // jsonTransport path
  return info;
};

module.exports = { sendMail };
