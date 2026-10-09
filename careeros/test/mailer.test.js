// Mailer tests. Stubs DNS and nodemailer, so nothing is sent.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const dns = require("dns");
const nodemailer = require("nodemailer");
const { sendMail, SMTP_HOST } = require("../services/mailer");

test("connects to Gmail over IPv4 while still checking Gmail's certificate name", async () => {
  process.env.SMTP_EMAIL = "app@example.com";
  process.env.SMTP_PASSWORD = "app-password";
  const lookups = [];
  let transportOptions, sent;
  const originals = { lookup: dns.promises.lookup, createTransport: nodemailer.createTransport };
  dns.promises.lookup = async (host, opts) => { lookups.push({ host, opts }); return { address: "142.250.4.108", family: 4 }; };
  nodemailer.createTransport = (opts) => {
    transportOptions = opts;
    return { sendMail: async (msg) => { sent = msg; return { messageId: "1" }; } };
  };
  try {
    await sendMail({ to: "ada@example.com", subject: "Hi", text: "Body" });
  } finally {
    Object.assign(dns.promises, { lookup: originals.lookup });
    nodemailer.createTransport = originals.createTransport;
  }
  assert.deepEqual(lookups, [{ host: SMTP_HOST, opts: { family: 4 } }]);
  assert.equal(transportOptions.host, "142.250.4.108");
  assert.equal(transportOptions.tls.servername, "smtp.gmail.com");
  assert.equal(transportOptions.secure, true);
  assert.deepEqual(sent, { from: "app@example.com", to: "ada@example.com", subject: "Hi", text: "Body" });
});
