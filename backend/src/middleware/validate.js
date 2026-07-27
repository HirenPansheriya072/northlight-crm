const ApiError = require('../utils/ApiError');

// validate({ body: schema, query: schema, params: schema })
module.exports = (schemas) => (req, res, next) => {
  for (const key of ['body', 'query', 'params']) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Check the highlighted fields', details));
    }
    // Zod strips unknown keys, which is exactly what we want before it hits Mongoose.
    if (key === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[key] = result.data;
    }
  }
  next();
};
