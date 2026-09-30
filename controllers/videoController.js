const factory = require('./factories/businessContentFactory');
const { BusinessVideo } = require('../models');
const AppError = require('../utils/AppError');
const { normalizeYoutubeUrl } = require('../utils/youtube');

// A video is either a YouTube link or an uploaded file. Sending one replaces the other.
const prepare = async ({ req, data, files, existing }) => {
  const rawUrl = req.body.youtubeUrl;
  const hasUrl = Boolean(rawUrl);
  const hasFile = Boolean(files.video);

  if (hasUrl && hasFile) throw new AppError('Provide either youtubeUrl or an uploaded video, not both', 400);
  if (!existing && !hasUrl && !hasFile) throw new AppError('Provide either youtubeUrl or an uploaded video', 400);

  if (hasUrl) {
    const url = normalizeYoutubeUrl(rawUrl);
    if (!url) throw new AppError('youtubeUrl must be a valid YouTube URL', 400);
    Object.assign(data, { youtubeUrl: url, videoPath: null, type: 'YOUTUBE' });
  } else if (hasFile) {
    Object.assign(data, { videoPath: files.video, youtubeUrl: null, type: 'UPLOAD' });
  } else {
    delete data.youtubeUrl; // plain metadata edit: keep the current source untouched
  }
  return data;
};

module.exports = factory({
  Model: BusinessVideo,
  label: 'Video',
  fields: ['title', 'description', 'youtubeUrl'],
  fileMap: { video: 'videoPath', thumbnail: 'thumbnail' },
  searchFields: ['title', 'description'],
  filterFields: [],
  prepare,
  extraWhere: (req, where) => {
    if (['YOUTUBE', 'UPLOAD'].includes(req.query.type)) where.type = req.query.type;
  },
});
