const { literal } = require('sequelize');
const { ResourceCategory, ResourcePost } = require('../models');
const { isSuperAdmin } = require('../services/businessService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ok, created } = require('../utils/response');
const pick = require('../utils/pick');
const { uniqueSlug } = require('../utils/slug');

const FIELDS = ['name', 'description', 'status'];
const POST_COUNT = [
  literal(
    "(SELECT COUNT(*) FROM resource_posts AS rp WHERE rp.categoryId = `ResourceCategory`.`id` AND rp.status = 'PUBLISHED')"
  ),
  'postCount',
];

const findByIdOrSlug = (param) => ResourceCategory.findOne({ where: /^\d+$/.test(param) ? { id: param } : { slug: param } });

// GET /api/resource-categories — public sees ACTIVE ones; Super Admin sees all (optionally ?status=)
exports.list = asyncHandler(async (req, res) => {
  const where = isSuperAdmin(req.user) ? (req.query.status ? { status: req.query.status } : {}) : { status: 'ACTIVE' };
  const categories = await ResourceCategory.findAll({
    where,
    attributes: { include: [POST_COUNT] },
    order: [['name', 'ASC']],
  });
  return ok(res, categories);
});

exports.getOne = asyncHandler(async (req, res) => {
  const category = await findByIdOrSlug(req.params.idOrSlug);
  if (!category || (category.status !== 'ACTIVE' && !isSuperAdmin(req.user))) {
    throw new AppError('Category not found', 404);
  }
  return ok(res, category);
});

exports.create = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.slug = await uniqueSlug(ResourceCategory, data.name);
  const category = await ResourceCategory.create(data);
  return created(res, category, 'Category created');
});

exports.update = asyncHandler(async (req, res) => {
  const category = await ResourceCategory.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  category.set(pick(req.body, FIELDS));
  if (category.changed('name')) category.slug = await uniqueSlug(ResourceCategory, category.name, category.id);
  await category.save();
  return ok(res, category, 'Category updated');
});

exports.remove = asyncHandler(async (req, res) => {
  const category = await ResourceCategory.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const posts = await ResourcePost.count({ where: { categoryId: category.id } });
  if (posts) throw new AppError(`Cannot delete: category still has ${posts} post(s). Move or delete them first.`, 409);
  await category.destroy();
  return ok(res, null, 'Category deleted');
});
