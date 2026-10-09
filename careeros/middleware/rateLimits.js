const { rateLimit } = require("express-rate-limit");

// Per-IP limits on the unauthenticated auth endpoints, so a script can't guess
// passwords, mass-register accounts or flood reset emails. In-memory, so they
// count per server process (like the AI rate limits in services/aiService.js).
// Behind a proxy these rely on `trust proxy` (set in server.js) to see real IPs.
const MINUTE = 60 * 1000;

const limiter = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * MINUTE,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message },
  });

module.exports = {
  login: limiter(10, 15, "Too many sign-in attempts. Try again in 15 minutes."),
  register: limiter(10, 60, "Too many accounts created from this network. Try again later."),
  passwordReset: limiter(10, 15, "Too many password reset requests. Try again in 15 minutes."),
  demo: limiter(30, 15, "Too many demo sign-ins. Try again in a few minutes."),
};
