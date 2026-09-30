const fs = require('fs');
const path = require('path');
const { UPLOAD_ROOT, FIELD_RULES } = require('../config/upload');

// Columns (across all models) that may hold an uploaded file path
const FILE_COLUMNS = ['logo', 'coverImage', 'coverImage2', 'image', 'image2', 'videoPath', 'thumbnail', 'filePath', 'videoUrl'];

const toPublicPath = (file) => `/uploads/${FIELD_RULES[file.fieldname].dir}/${file.filename}`;

// { coverImage: '/uploads/images/xxx.jpg', video: '/uploads/videos/yyy.mp4' }
const uploadedPaths = (req) => {
  const out = {};
  Object.entries(req.files || {}).forEach(([field, arr]) => {
    if (arr && arr[0]) out[field] = toPublicPath(arr[0]);
  });
  return out;
};

// Deletes a stored file by its public path. Ignores external URLs (e.g. YouTube) and anything outside uploads.
const removeFile = (publicPath) => {
  if (!publicPath || typeof publicPath !== 'string' || !publicPath.startsWith('/uploads/')) return;
  const abs = path.resolve(UPLOAD_ROOT, publicPath.slice('/uploads/'.length));
  if (!abs.startsWith(UPLOAD_ROOT + path.sep)) return;
  fs.unlink(abs, () => {});
};

const removeFiles = (paths = []) => paths.forEach(removeFile);

// Removes files multer already wrote to disk (used when a request fails validation or errors out)
const removeUploadedFiles = (req) => {
  Object.values(req.files || {})
    .flat()
    .forEach((f) => fs.unlink(f.path, () => {}));
};

// Every stored file path on a model instance
const collectFiles = (instance) =>
  FILE_COLUMNS.map((c) => instance.dataValues[c]).filter(Boolean);

module.exports = { uploadedPaths, removeFile, removeFiles, removeUploadedFiles, collectFiles };
