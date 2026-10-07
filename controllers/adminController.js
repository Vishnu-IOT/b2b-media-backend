const { Op } = require('sequelize');
const {
  User, Business, ResourcePost, ResourceCategory, Question, Answer,
} = require('../models');
const { CONTENT_TYPES } = require('../services/moderationService');
const { applyStatus } = require('../services/statusService');
const { collectBusinessFiles } = require('../services/businessService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const { paginate, paged } = require('../utils/pagination');
const pick = require('../utils/pick');
const { removeFiles, collectFiles } = require('../utils/fileUtils');

// ---------- dashboard ----------

// GET /api/admin/stats
exports.stats = asyncHandler(async (req, res) => {
  const pendingEntries = await Promise.all(
    Object.entries(CONTENT_TYPES).map(async ([type, Model]) => [type, await Model.count({ where: { status: 'PENDING' } })])
  );
  const [users, businessAdmins, businesses, resourcePosts, resourceCategories, questions, answers] = await Promise.all([
    User.count(),
    User.count({ where: { role: 'BUSINESS_ADMIN' } }),
    Business.count(),
    ResourcePost.count(),
    ResourceCategory.count(),
    Question.count(),
    Answer.count(),
  ]);
  return ok(res, {
    totals: { users, businessAdmins, businesses, resourcePosts, resourceCategories, questions, answers },
    pendingApproval: Object.fromEntries(pendingEntries),
  });
});

// ---------- users ----------

exports.listUsers = asyncHandler(async (req, res) => {
  const pg = paginate(req.query);
  const where = {};
  if (req.query.role) where.role = req.query.role;
  if (req.query.q) where[Op.or] = ['name', 'email'].map((f) => ({ [f]: { [Op.like]: `%${req.query.q}%` } }));
  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: Business, as: 'business', attributes: ['id', 'companyName', 'slug', 'status'] }],
    order: [['createdAt', 'DESC']],
    limit: pg.limit,
    offset: pg.offset,
    distinct: true,
  });
  return ok(res, paged(rows, count, pg));
});

exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: [{ model: Business, as: 'business' }] });
  if (!user) throw new AppError('User not found', 404);
  return ok(res, user);
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  // Super Admin created this account directly, so it skips the OTP step and can log in right away.
  const user = await User.create({ name, email, password, role: role || 'BUSINESS_ADMIN', isEmailVerified: true });
  return created(res, user, 'User created');
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (req.body.role && req.body.role !== user.role && user.id === req.user.id) {
    throw new AppError('You cannot change your own role', 400);
  }
  user.set(pick(req.body, ['name', 'email', 'role']));
  if (req.body.password) user.password = req.body.password;
  await user.save();
  return ok(res, user, 'User updated');
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, { include: [{ model: Business, as: 'business' }] });
  if (!user) throw new AppError('User not found', 404);
  if (user.id === req.user.id) throw new AppError('You cannot delete your own account', 400);
  const files = user.business ? await collectBusinessFiles(user.business) : [];
  await user.destroy(); // business + content, questions, answers and notifications cascade
  removeFiles(files);
  return ok(res, null, 'User deleted');
});

// ---------- moderation (approve / reject) ----------

const modelFor = (type) => {
  const Model = CONTENT_TYPES[type];
  if (!Model) throw new AppError(`Unknown content type "${type}". Use one of: ${Object.keys(CONTENT_TYPES).join(', ')}`, 400);
  return Model;
};

// GET /api/admin/pending — how many items of each type are waiting for approval
exports.pending = asyncHandler(async (req, res) => {
  const entries = await Promise.all(
    Object.entries(CONTENT_TYPES).map(async ([type, Model]) => [type, await Model.count({ where: { status: 'PENDING' } })])
  );
  return ok(res, Object.fromEntries(entries));
});

// GET /api/admin/content/:type?status=PENDING — the approval queue (defaults to PENDING; status=all for everything)
exports.listContent = asyncHandler(async (req, res) => {
  const Model = modelFor(req.params.type);
  const pg = paginate(req.query);
  const where = {};
  const status = req.query.status || 'PENDING';
  if (status !== 'all') where.status = status;
  // ?businessId=<id> -> one business; ?businessId=none -> platform posts (no business)
  if (req.query.businessId && Model.rawAttributes.businessId) {
    where.businessId = req.query.businessId === 'none' ? null : req.query.businessId;
  }

  const include = [];
  if (Model.associations.business) include.push({ model: Business, as: 'business', attributes: ['id', 'companyName', 'slug'] });
  if (Model.associations.owner) include.push({ model: User, as: 'owner', attributes: ['id', 'name', 'email'] });
  if (Model.associations.user) include.push({ model: User, as: 'user', attributes: ['id', 'name', 'email'] });

  const { rows, count } = await Model.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'ASC']], // oldest first: review in submission order
    limit: pg.limit,
    offset: pg.offset,
    distinct: true,
  });
  return ok(res, paged(rows, count, pg));
});

// PATCH /api/admin/content/:type/:id/status  { "status": "PUBLISHED" | "REJECTED" | "PENDING" | "DRAFT" }
exports.setStatus = asyncHandler(async (req, res) => {
  const Model = modelFor(req.params.type);
  const item = await Model.findByPk(req.params.id);
  if (!item) throw new AppError('Content not found', 404);
  applyStatus(item, req.body.status);
  await item.save();
  return ok(res, item, `Status set to ${req.body.status}`);
});

// DELETE /api/admin/content/:type/:id
exports.deleteContent = asyncHandler(async (req, res) => {
  const Model = modelFor(req.params.type);
  const item = await Model.findByPk(req.params.id);
  if (!item) throw new AppError('Content not found', 404);
  const files = Model === Business ? await collectBusinessFiles(item) : collectFiles(item);
  await item.destroy();
  removeFiles(files);
  return ok(res, null, 'Content deleted');
});
