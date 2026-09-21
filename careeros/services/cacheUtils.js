const CACHE_TTL_HOURS = parseInt(process.env.AI_CACHE_TTL_HOURS || "24", 10);

function isStale(computedAt, ttlHours = CACHE_TTL_HOURS) {
  return !computedAt || Date.now() - new Date(computedAt).getTime() > ttlHours * 60 * 60 * 1000;
}

module.exports = { CACHE_TTL_HOURS, isStale };
