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

// ── Brevo (HTTPS API) ──
const { emailProvider, textToHtml, BREVO_URL } = require("../services/mailer");

function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(vars)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  return Promise.resolve().then(fn).finally(() => {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  });
}

test("Brevo is used when BREVO_API_KEY is set, Gmail SMTP otherwise", () =>
  withEnv({ BREVO_API_KEY: "key", SMTP_EMAIL: "a@example.com", SMTP_PASSWORD: "p" }, async () => {
    assert.equal(emailProvider(), "brevo");
    delete process.env.BREVO_API_KEY;
    assert.equal(emailProvider(), "smtp");
    delete process.env.SMTP_PASSWORD;
    assert.equal(emailProvider(), null);
  }));

test("sends through Brevo's API over HTTPS with the verified sender", () =>
  withEnv({ BREVO_API_KEY: "brevo-key", EMAIL_FROM: "careeros.noreply@gmail.com", SMTP_EMAIL: undefined }, async () => {
    const savedFetch = global.fetch;
    let call;
    global.fetch = async (url, init) => { call = { url, init }; return { ok: true, status: 201, json: async () => ({ messageId: "m1" }) }; };
    try {
      assert.deepEqual(await sendMail({ to: "ada@example.com", subject: "Reset", text: "Open https://x.test/reset?token=a1" }), { messageId: "m1" });
    } finally {
      global.fetch = savedFetch;
    }
    assert.equal(call.url, BREVO_URL);
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.headers["api-key"], "brevo-key");
    const body = JSON.parse(call.init.body);
    assert.deepEqual(body.sender, { name: "CareerOS AI", email: "careeros.noreply@gmail.com" });
    assert.deepEqual(body.to, [{ email: "ada@example.com" }]);
    assert.equal(body.textContent, "Open https://x.test/reset?token=a1");
    assert.match(body.htmlContent, /<a href="https:\/\/x\.test\/reset\?token=a1">/);
  }));

test("a Brevo error becomes an exception with Brevo's message", () =>
  withEnv({ BREVO_API_KEY: "bad-key", EMAIL_FROM: "a@example.com" }, async () => {
    const savedFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 401, statusText: "Unauthorized", json: async () => ({ code: "unauthorized", message: "Key not found" }) });
    try {
      await assert.rejects(sendMail({ to: "b@example.com", subject: "s", text: "t" }), (err) => err.code === "unauthorized" && /401: Key not found/.test(err.message));
    } finally {
      global.fetch = savedFetch;
    }
  }));

test("the HTML version escapes text and keeps line breaks", () => {
  assert.equal(textToHtml("a < b\nsee https://x.test/r?t=1&u=2"),
    '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">a &lt; b<br>see <a href="https://x.test/r?t=1&amp;u=2">https://x.test/r?t=1&amp;u=2</a></div>');
});
