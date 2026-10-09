const { defaultErrorMap } = require("zod");

// Validates req.body / req.query against a zod schema before the route runs.
// On success the parsed value replaces the original, so routes only ever see
// fields of the expected types (unknown keys are stripped). On failure the
// request gets a 400 with the same { error } shape every other route uses.
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        error: describe(issue),
        issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}

// Schema messages are full sentences ("Company and role are required.");
// zod's generic ones ("Required") need the field name to make sense.
function describe(issue) {
  const field = issue.path.join(".");
  const isGeneric = issue.message === defaultErrorMap(issue, { defaultError: issue.message, data: undefined }).message;
  return field && isGeneric ? `${field}: ${issue.message}` : issue.message;
}

module.exports = validate;
