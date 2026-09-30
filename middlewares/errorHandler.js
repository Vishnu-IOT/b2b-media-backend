const AppError = require('../utils/AppError');
const { removeUploadedFiles } = require('../utils/fileUtils');

const notFound = (req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  removeUploadedFiles(req); // never keep files from a failed request

  let status = err.statusCode || 500;
  let message = err.message;
  let errors = err.errors || undefined;

  switch (err.name) {
    case 'SequelizeValidationError':
      status = 422;
      message = 'Validation failed';
      errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
      break;
    case 'SequelizeUniqueConstraintError':
      status = 409;
      message = `${(err.errors && err.errors[0] && err.errors[0].path) || 'value'} already exists`;
      break;
    case 'SequelizeForeignKeyConstraintError':
      if (err.parent && err.parent.code === 'ER_ROW_IS_REFERENCED_2') {
        status = 409;
        message = 'Cannot delete: this record is still in use';
      } else {
        status = 400;
        message = 'Invalid reference: a related record does not exist';
      }
      break;
    case 'JsonWebTokenError':
      status = 401;
      message = 'Invalid token';
      break;
    case 'TokenExpiredError':
      status = 401;
      message = 'Token expired';
      break;
    case 'MulterError':
      status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      message = err.code === 'LIMIT_UNEXPECTED_FILE' ? `Unexpected file field "${err.field}"` : err.message;
      break;
    default:
      if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'Invalid JSON body';
      }
  }

  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (status >= 500 && process.env.NODE_ENV !== 'production') body.stack = err.stack;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
