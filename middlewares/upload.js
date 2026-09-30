const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { FIELD_RULES, MIME_EXT, UPLOAD_ROOT } = require('../config/upload');
const AppError = require('../utils/AppError');
const { removeUploadedFiles } = require('../utils/fileUtils');

const MAX_SIZE = Math.max(...Object.values(FIELD_RULES).map((r) => r.maxSize));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, FIELD_RULES[file.fieldname].dir)),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${MIME_EXT[file.mimetype]}`),
});

const fileFilter = (req, file, cb) => {
  const rule = FIELD_RULES[file.fieldname];
  if (!rule) return cb(new AppError(`Unexpected file field "${file.fieldname}"`, 400));
  if (!rule.mimes.includes(file.mimetype)) {
    return cb(new AppError(`Invalid file type for "${file.fieldname}". Allowed: ${rule.mimes.join(', ')}`, 415));
  }
  return cb(null, true);
};

const uploader = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

/**
 * uploadFields(['coverImage', 'video']) -> middleware. JSON (non-multipart) requests pass straight through.
 * Files land in public/uploads/<images|videos|documents|thumbnails>/ and are exposed on req.files.
 */
const uploadFields = (names) => {
  const handler = uploader.fields(names.map((name) => ({ name, maxCount: 1 })));
  return (req, res, next) =>
    handler(req, res, (err) => {
      if (err) {
        removeUploadedFiles(req);
        return next(err);
      }
      // Per-type size limits (multer only enforces one global limit)
      const files = Object.values(req.files || {}).flat();
      const tooBig = files.find((f) => f.size > FIELD_RULES[f.fieldname].maxSize);
      if (tooBig) {
        removeUploadedFiles(req);
        const mb = Math.round(FIELD_RULES[tooBig.fieldname].maxSize / (1024 * 1024));
        return next(new AppError(`"${tooBig.fieldname}" must be smaller than ${mb} MB`, 413));
      }
      return next();
    });
};

module.exports = { uploadFields };
