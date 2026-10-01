const { Op } = require('sequelize');
const {
  Business, User, BusinessStory, BusinessStrategy, Achievement, Product, SupplierEnquiry, BusinessVideo,
} = require('../models');
const { ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { paginate, paged } = require('../utils/pagination');
const pick = require('../utils/pick');
const { uniqueSlug } = require('../utils/slug');
const { uploadedPaths, removeFiles } = require('../utils/fileUtils');
const { resolveStatus, applyStatus } = require('../services/statusService');
const { isSuperAdmin, isManager, assertCanManage, collectBusinessFiles } = require('../services/businessService');

const FIELDS = ['companyName', 'description', 'story', 'industry', 'location', 'website', 'phone', 'email', 'language'];
const FILE_FIELDS = ['logo', 'coverImage'];
const PUBLIC_EXCLUDE = ['userId', 'status'];

// GET /api/business — public directory of published businesses
exports.list = asyncHandler(async (req, res) => {
  const pg = paginate(req.query);
  const where = { status: 'PUBLISHED' };
  if (req.query.industry) where.industry = { [Op.like]: `%${req.query.industry}%` };
  if (req.query.location) where.location = { [Op.like]: `%${req.query.location}%` };
  if (req.query.q) {
    where[Op.or] = ['companyName', 'description', 'industry'].map((f) => ({ [f]: { [Op.like]: `%${req.query.q}%` } }));
  }
  const { rows, count } = await Business.findAndCountAll({
    where,
    attributes: { exclude: [...PUBLIC_EXCLUDE, 'story'] },
    order: [['companyName', 'ASC']],
    limit: pg.limit,
    offset: pg.offset,
  });
  return ok(res, paged(rows, count, pg));
});

// GET /api/business/me — the logged-in business admin's own profile (any status)
exports.getMine = asyncHandler(async (req, res) => {
  const business = await Business.findOne({ where: { userId: req.user.id } });
  if (!business) throw new AppError('You have not created a business profile yet', 404);
  return ok(res, business);
});

// GET /api/business/:idOrSlug — public profile + published content (owner / Super Admin see every status)
exports.getOne = asyncHandler(async (req, res) => {
  const p = req.params.idOrSlug;
  const business = await Business.findOne({ where: /^\d+$/.test(p) ? { id: p } : { slug: p } });
  if (!business) throw new AppError('Business not found', 404);

  const manager = isManager(req.user, business);
  if (business.status !== 'PUBLISHED' && !manager) throw new AppError('Business not found', 404);

  const where = { businessId: business.id, ...(manager ? {} : { status: 'PUBLISHED' }) };
  const query = (Model, order) => Model.findAll({ where, order, limit: 50 });
  const [stories, strategies, achievements, products, enquiries, videos] = await Promise.all([
    query(BusinessStory, [['publishedAt', 'DESC'], ['id', 'DESC']]),
    query(BusinessStrategy, [['publishedAt', 'DESC'], ['id', 'DESC']]),
    query(Achievement, [['awardDate', 'DESC'], ['id', 'DESC']]),
    query(Product, [['launchDate', 'DESC'], ['id', 'DESC']]),
    query(SupplierEnquiry, [['createdAt', 'DESC']]),
    query(BusinessVideo, [['createdAt', 'DESC']]),
  ]);

  const data = business.toJSON();
  if (!manager) PUBLIC_EXCLUDE.forEach((k) => delete data[k]);
  return ok(res, { ...data, stories, strategies, achievements, products, enquiries, videos });
});

// POST /api/business — BUSINESS_ADMIN creates their own profile; SUPER_ADMIN creates one for body.userId
exports.create = asyncHandler(async (req, res) => {
  let ownerId = req.user.id;
  if (isSuperAdmin(req.user)) {
    ownerId = req.body.userId;
    if (!ownerId) throw new AppError('userId is required', 400);
    const owner = await User.findByPk(ownerId);
    if (!owner) throw new AppError('User not found', 404);
    if (owner.role !== ROLES.BUSINESS_ADMIN) throw new AppError('Only BUSINESS_ADMIN users can own a business', 400);
  }
  if (await Business.count({ where: { userId: ownerId } })) {
    throw new AppError('This user already has a business profile', 409);
  }

  const data = { ...pick(req.body, FIELDS), ...pickFiles(req) };
  data.slug = await uniqueSlug(Business, data.companyName);

  const business = Business.build({ ...data, userId: ownerId });
  applyStatus(business, resolveStatus(req.user, req.body.status, null));
  await business.save();
  return created(res, business, 'Business profile created');
});

function pickFiles(req) {
  const files = uploadedPaths(req);
  return Object.fromEntries(FILE_FIELDS.filter((f) => files[f]).map((f) => [f, files[f]]));
}

const applyUpdate = async (req, res, business) => {
  const before = { logo: business.logo, coverImage: business.coverImage };
  business.set({ ...pick(req.body, FIELDS), ...pickFiles(req) });
  applyStatus(business, resolveStatus(req.user, req.body.status, business.status)); // owner edits go back to PENDING
  await business.save();
  removeFiles(FILE_FIELDS.filter((f) => before[f] && before[f] !== business[f]).map((f) => before[f]));
  return ok(res, business, 'Business profile updated');
};

// PUT /api/business/me
exports.updateMine = asyncHandler(async (req, res) => {
  const business = await Business.findOne({ where: { userId: req.user.id } });
  if (!business) throw new AppError('You have not created a business profile yet', 404);
  return applyUpdate(req, res, business);
});

// PUT /api/business/:id
exports.update = asyncHandler(async (req, res) => {
  const business = await Business.findByPk(req.params.id);
  if (!business) throw new AppError('Business not found', 404);
  await assertCanManage(req.user, business.id);
  return applyUpdate(req, res, business);
});

// DELETE /api/business/:id (Super Admin) — removes the business, all of its content and its files
exports.remove = asyncHandler(async (req, res) => {
  const business = await Business.findByPk(req.params.id);
  if (!business) throw new AppError('Business not found', 404);
  const files = await collectBusinessFiles(business);
  await business.destroy();
  removeFiles(files);
  return ok(res, null, 'Business deleted');
});
