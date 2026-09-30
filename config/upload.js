const path = require('path');
const fs = require('fs');

const MB = 1024 * 1024;
const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// File extension is derived from the MIME type, never from the client's filename
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

// Multipart field name -> where it is stored and what it may contain
const FIELD_RULES = {
  logo: { dir: 'images', mimes: IMAGE_MIMES, maxSize: 5 * MB },
  coverImage: { dir: 'images', mimes: IMAGE_MIMES, maxSize: 5 * MB },
  coverImage2: { dir: 'images', mimes: IMAGE_MIMES, maxSize: 5 * MB },
  image: { dir: 'images', mimes: IMAGE_MIMES, maxSize: 5 * MB },
  image2: { dir: 'images', mimes: IMAGE_MIMES, maxSize: 5 * MB },
  thumbnail: { dir: 'thumbnails', mimes: IMAGE_MIMES, maxSize: 5 * MB },
  video: { dir: 'videos', mimes: VIDEO_MIMES, maxSize: 200 * MB },
  file: { dir: 'documents', mimes: DOC_MIMES, maxSize: 20 * MB },
};

const ensureUploadDirs = () =>
  ['images', 'videos', 'documents', 'thumbnails'].forEach((d) =>
    fs.mkdirSync(path.join(UPLOAD_ROOT, d), { recursive: true })
  );

module.exports = { UPLOAD_ROOT, FIELD_RULES, MIME_EXT, ensureUploadDirs };
