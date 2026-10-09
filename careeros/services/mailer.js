// Outgoing email (password resets). Two ways to send, picked by env vars:
//
// - Brevo's HTTP API (BREVO_API_KEY): goes out over HTTPS, so it works on hosts
//   that block SMTP ports, such as Render's free plan (where a Gmail SMTP
//   connection just times out).
// - Gmail SMTP (SMTP_EMAIL + SMTP_PASSWORD): for your own machine or a host
//   that allows outgoing SMTP.
const dns = require("dns");
const nodemailer = require("nodemailer");

const SMTP_HOST = "smtp.gmail.com";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_NAME = "CareerOS AI";

function emailProvider() {
  if (process.env.BREVO_API_KEY) return "brevo";
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) return "smtp";
  return null;
}

const isEmailConfigured = () => emailProvider() !== null;

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Plain text as simple HTML: escaped, line breaks kept, links clickable. */
function textToHtml(text) {
  const html = escapeHtml(text.trim())
    .replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}">${url}</a>`)
    .replace(/\n/g, "<br>");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${html}</div>`;
}

async function sendViaBrevo({ to, subject, text }) {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      // Must be a sender verified in Brevo (Senders, domains & dedicated IPs)
      sender: { name: SENDER_NAME, email: process.env.EMAIL_FROM || process.env.SMTP_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: textToHtml(text),
      textContent: text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`Brevo API ${res.status}: ${body.message || res.statusText}`), { code: body.code || `HTTP_${res.status}` });
  }
  return res.json().catch(() => ({}));
}

/**
 * Connects over IPv4 on purpose: nodemailer picks a random address from both
 * the IPv4 and IPv6 records, and many hosts have an IPv6 interface but no IPv6
 * route out (ENETUNREACH). The TLS certificate is still checked as Gmail's.
 */
async function sendViaSmtp({ to, subject, text }) {
  const { address } = await dns.promises.lookup(SMTP_HOST, { family: 4 });
  const transporter = nodemailer.createTransport({
    host: address,
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
    tls: { servername: SMTP_HOST },
  });
  return transporter.sendMail({ from: process.env.SMTP_EMAIL, to, subject, text });
}

/** Sends one email with whichever provider is configured. */
async function sendMail(message) {
  const provider = emailProvider();
  if (provider === "brevo") return sendViaBrevo(message);
  if (provider === "smtp") return sendViaSmtp(message);
  throw new Error("No email provider configured (set BREVO_API_KEY, or SMTP_EMAIL and SMTP_PASSWORD).");
}

module.exports = { sendMail, isEmailConfigured, emailProvider, textToHtml, SMTP_HOST, BREVO_URL };
