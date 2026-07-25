const express = require("express");
const UsageLog = require("../models/UsageLog");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/today", async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  const logs = await UsageLog.find({ date });
  const total = logs.reduce((sum, l) => sum + l.count, 0);
  res.json({
    date,
    total,
    limit: parseInt(process.env.GEMINI_DAILY_LIMIT || "1400", 10),
    byFeature: logs.map((l) => ({ feature: l.feature, count: l.count })),
  });
});

module.exports = router;
