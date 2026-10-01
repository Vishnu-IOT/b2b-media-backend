// Shared HTML wrapper for every transactional email (OTP, welcome, newsletter).
// Table-based layout + inline styles because most email clients strip <style> blocks
// and ignore external fonts, so DM Sans falls back to a safe system stack.
const FONT_STACK =
  "'DM Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const BRAND = process.env.EMAIL_BRAND_NAME || "Vartha";
const ACCENT = "#6c5ce7"; // swap for your brand color
const BG = "#e7e9ee";
const CARD = "#9aa0ab";
const TEXT = "#0f1115";
const MUTED = "#1a1d24";

const escapeHtml = (s) =>
  String(s || "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );

const button = (label, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px">
    <tr><td style="border-radius:8px;background:${ACCENT}">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;

// title: shown as the H1 inside the card. preheader: hidden inbox-preview snippet. bodyHtml: the message content.
const wrapEmail = ({
  title,
  preheader = "",
  bodyHtml,
  footerHtml = "",
}) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:${FONT_STACK}">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:${CARD};border-radius:14px;overflow:hidden" cellpadding="0" cellspacing="0">
        <tr><td style="padding:28px 32px 4px;text-align:center">
          <span style="font-family:${FONT_STACK};font-size:15px;font-weight:700;letter-spacing:.04em;color:${MUTED};text-transform:uppercase">${escapeHtml(BRAND)}</span>
        </tr></td>
        <tr><td style="padding:12px 32px 32px">
          <h1 style="margin:0 0 14px;font-family:${FONT_STACK};font-size:21px;font-weight:700;color:${TEXT};text-align:center">${escapeHtml(title)}</h1>
          <div style="font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${TEXT};text-align:center">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,.08);text-align:center">
          <span style="font-family:${FONT_STACK};font-size:12px;color:${MUTED}">${footerHtml || `&copy; ${new Date().getFullYear()} ${escapeHtml(BRAND)}`}</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// --- specific emails ---

const otpEmail = ({ otp, ttlMinutes }) => ({
  subject: "Verify your email",
  text: `Your verification code is ${otp}. It expires in ${ttlMinutes} minutes.`,
  html: wrapEmail({
    title: "Verify your email",
    preheader: `Your code is ${otp}`,
    bodyHtml: `
      <p style="margin:0 0 18px;color:${MUTED}">Use this code to finish creating your account. It expires in ${ttlMinutes} minutes.</p>
      <div style="margin:0 auto;display:inline-block;padding:14px 26px;background:${BG};border:1px solid rgba(255,255,255,.1);border-radius:10px;font-size:28px;font-weight:700;letter-spacing:8px;color:${TEXT}">${escapeHtml(otp)}</div>
      <p style="margin:18px 0 0;font-size:13px;color:${MUTED}">Didn't request this? You can safely ignore this email.</p>`,
  }),
});

// Sent right after a registration OTP is confirmed — the account is live, here's where to log in.
const welcomeEmail = ({ name, loginUrl }) => ({
  subject: "Your account is ready",
  text: `Welcome${name ? `, ${name}` : ""}! Your account is verified. Log in to your admin panel: ${loginUrl}`,
  html: wrapEmail({
    title: `Welcome${name ? `, ${escapeHtml(name)}` : ""} 👋`,
    preheader: "Your account is verified — here is your admin panel link",
    bodyHtml: `
      <p style="margin:0 0 4px;color:${MUTED}">Your email is verified and your account is ready to go.</p>
      <p style="margin:0;color:${MUTED}">Use the button below to open your admin panel and get started.</p>
      ${button("Open admin panel", loginUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:${MUTED};word-break:break-all">Or paste this link into your browser:<br/><a href="${loginUrl}" style="color:${ACCENT}">${escapeHtml(loginUrl)}</a></p>`,
  }),
});

const subscribeWelcomeEmail = ({ unsubscribeUrl }) => ({
  subject: "You're subscribed",
  text: `Thanks for subscribing! You'll get an email whenever we publish something new.\n\nUnsubscribe: ${unsubscribeUrl}`,
  html: wrapEmail({
    title: "You're subscribed 🎉",
    preheader: "You'll hear from us whenever we publish something new",
    bodyHtml: `<p style="margin:0;color:${MUTED}">Thanks for subscribing! You'll get an email whenever we publish something new.</p>`,
    footerHtml: `<a href="${unsubscribeUrl}" style="color:${MUTED}">Unsubscribe</a>`,
  }),
});

const newPostEmail = ({
  title,
  summary,
  category,
  postUrl,
  unsubscribeUrl,
}) => ({
  subject: `New post: ${title}`,
  text: `${title}\n\n${summary || ""}\n\nRead more: ${postUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
  html: wrapEmail({
    title: escapeHtml(title),
    preheader: summary || "A new post was just published",
    bodyHtml: `
      ${category ? `<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${ACCENT}">${escapeHtml(category)}</p>` : ""}
      <p style="margin:0 0 4px;color:${MUTED}">${escapeHtml(summary || "")}</p>
      ${button("Read the full post", postUrl)}`,
    footerHtml: `<a href="${unsubscribeUrl}" style="color:${MUTED}">Unsubscribe</a>`,
  }),
});

module.exports = {
  wrapEmail,
  otpEmail,
  welcomeEmail,
  subscribeWelcomeEmail,
  newPostEmail,
};
