const { Op } = require('sequelize');
const { ResourcePost, ResourceCategory } = require('../models');
const { isSuperAdmin } = require('../services/businessService');
const { applyStatus } = require('../services/statusService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { paginate, paged } = require('../utils/pagination');
const pick = require('../utils/pick');
const { uniqueSlug } = require('../utils/slug');
const { normalizeYoutubeUrl } = require('../utils/youtube');
const { uploadedPaths, removeFiles, collectFiles } = require('../utils/fileUtils');
const { notifyNewPost } = require('../services/newsletterService');

const FIELDS = ['categoryId', 'title', 'summary', 'content'];
const FILE_COLUMNS = ['coverImage', 'filePath', 'videoUrl'];
const CATEGORY_ATTRS = ['id', 'name', 'slug'];

// videoUrl holds a YouTube URL OR the path of an uploaded video (never both)
const applyVideo = (req, files, data) => {
  const raw = req.body.videoUrl;
  if (raw && files.video) throw new AppError('Provide either a YouTube videoUrl or an uploaded video, not both', 400);
  if (raw) {
    const url = normalizeYoutubeUrl(raw);
    if (!url) throw new AppError('videoUrl must be a valid YouTube URL', 400);
    data.videoUrl = url;
  } else if (files.video) {
    data.videoUrl = files.video;
  } else {
    delete data.videoUrl;
  }
};

const buildData = (req) => {
  const files = uploadedPaths(req);
  const data = pick(req.body, FIELDS);
  if (files.coverImage) data.coverImage = files.coverImage;
  if (files.file) data.filePath = files.file;
  applyVideo(req, files, data);
  return data;
};

// Fire-and-forget: never let a newsletter/email failure affect the API response
const notifyIfNewlyPublished = (post, category, wasPublished) => {
  if (post.status === 'PUBLISHED' && !wasPublished) {
    notifyNewPost(post, category).catch((err) => console.error('[newsletter] send failed:', err.message));
  }
};

// GET /api/resources?category=<slug>&categoryId=&q=&page=&limit=
// Public: published posts in active categories. Super Admin: everything (optionally ?status=).
exports.list = asyncHandler(async (req, res) => {
  const pg = paginate(req.query);
  const admin = isSuperAdmin(req.user);

  const where = {};
  if (admin) {
    if (req.query.status) where.status = req.query.status;
  } else {
    where.status = 'PUBLISHED';
  }
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  if (req.query.q) where[Op.or] = ['title', 'summary'].map((f) => ({ [f]: { [Op.like]: `%${req.query.q}%` } }));

  const categoryWhere = {};
  if (!admin) categoryWhere.status = 'ACTIVE';
  if (req.query.category) categoryWhere.slug = req.query.category;

  const { rows, count } = await ResourcePost.findAndCountAll({
    where,
    attributes: { exclude: ['content'] }, // full article only on the detail endpoint
    include: [
      {
        model: ResourceCategory,
        as: 'category',
        attributes: CATEGORY_ATTRS,
        where: Object.keys(categoryWhere).length ? categoryWhere : undefined,
        required: Object.keys(categoryWhere).length > 0,
      },
    ],
    order: [['publishedAt', 'DESC'], ['id', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
    distinct: true,
  });
  return ok(res, paged(rows, count, pg));
});

// GET /api/resources/:idOrSlug
exports.getOne = asyncHandler(async (req, res) => {
  const p = req.params.idOrSlug;
  const post = await ResourcePost.findOne({
    where: /^\d+$/.test(p) ? { id: p } : { slug: p },
    include: [{ model: ResourceCategory, as: 'category', attributes: [...CATEGORY_ATTRS, 'status'] }],
  });
  const visible = post && post.status === 'PUBLISHED' && post.category.status === 'ACTIVE';
  if (!post || (!visible && !isSuperAdmin(req.user))) throw new AppError('Resource not found', 404);
  return ok(res, post);
});

exports.create = asyncHandler(async (req, res) => {
  const data = buildData(req);
  const category = await ResourceCategory.findByPk(data.categoryId);
  if (!category) throw new AppError('Category not found', 404);

  data.slug = await uniqueSlug(ResourcePost, data.title);
  const post = ResourcePost.build({ ...data, createdBy: req.user.id });
  applyStatus(post, ['DRAFT', 'PUBLISHED'].includes(req.body.status) ? req.body.status : 'PUBLISHED');
  await post.save();

  notifyIfNewlyPublished(post, category, false); // brand new row, so it was never published before
  return created(res, post, 'Resource post created');
});

exports.update = asyncHandler(async (req, res) => {
  const post = await ResourcePost.findByPk(req.params.id);
  if (!post) throw new AppError('Resource post not found', 404);

  const data = buildData(req);
  if (data.categoryId && !(await ResourceCategory.findByPk(data.categoryId))) {
    throw new AppError('Category not found', 404);
  }

  const before = Object.fromEntries(FILE_COLUMNS.map((c) => [c, post[c]]));
  const wasPublished = post.status === 'PUBLISHED';
  post.set(data);
  if (['DRAFT', 'PUBLISHED'].includes(req.body.status)) applyStatus(post, req.body.status);
  await post.save();

  removeFiles(FILE_COLUMNS.filter((c) => before[c] && before[c] !== post[c]).map((c) => before[c]));

  if (post.status === 'PUBLISHED' && !wasPublished) {
    const category = await post.getCategory();
    notifyIfNewlyPublished(post, category, wasPublished);
  }
  return ok(res, post, 'Resource post updated');
});

exports.remove = asyncHandler(async (req, res) => {
  const post = await ResourcePost.findByPk(req.params.id);
  if (!post) throw new AppError('Resource post not found', 404);
  const files = collectFiles(post);
  await post.destroy();
  removeFiles(files);
  return ok(res, null, 'Resource post deleted');
});
