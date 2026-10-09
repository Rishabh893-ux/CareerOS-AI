// Outgoing email (password resets) through Gmail SMTP.
const dns = require("dns");
const nodemailer = require("nodemailer");

const SMTP_HOST = "smtp.gmail.com";

/**
 * Sends one email. Connects over IPv4 on purpose: nodemailer picks a random
 * address from both the IPv4 and IPv6 records, and many hosts (Render, Railway,
 * home networks) have an IPv6 interface but no IPv6 route out, which fails
 * with ENETUNREACH. The TLS certificate is still checked against Gmail's name.
 */
async function sendMail({ to, subject, text }) {
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

module.exports = { sendMail, SMTP_HOST };
