const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// validate([...rules]) -> array of middlewares: run the rules, then fail with 422 if any rule failed
const validate = (rules = []) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new AppError('Validation failed', 422, errors));
  },
];

const numericId = (req, res, next) =>
  /^\d+$/.test(req.params.id) ? next() : next(new AppError('Invalid id', 400));

module.exports = { validate, numericId };
