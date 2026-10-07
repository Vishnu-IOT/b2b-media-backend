const { Op } = require('sequelize');
const { Business } = require('../../models');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { ok, created } = require('../../utils/response');
const { paginate, paged } = require('../../utils/pagination');
const pick = require('../../utils/pick');
const { uniqueSlug } = require('../../utils/slug');
const { uploadedPaths, removeFiles, collectFiles } = require('../../utils/fileUtils');
const { resolveStatus, applyStatus } = require('../../services/statusService');
const { isSuperAdmin, isManager, resolveBusiness, assertCanManage } = require('../../services/businessService');

const BUSINESS_PUBLIC_ATTRS = ['id', 'companyName', 'slug', 'logo', 'industry', 'location'];

/**
 * Builds list / mine / getOne / create / update / remove handlers for content owned by a business
 * (stories, strategies, achievements, products, enquiries, videos).
 *
 * options:
 *  Model, label
 *  fields        body fields that may be written
 *  fileMap       multipart field -> column, e.g. { coverImage: 'coverImage', video: 'videoPath' }
 *  searchFields  columns searched by ?q=
 *  filterFields  columns filterable by ?<column>=
 *  slugFrom      column used to generate a slug (also enables GET by slug)
 *  order         default ORDER BY for the public list
 *  extraWhere    (req, where) => void   extra public-list filters
 *  prepare       async ({ req, data, files, existing }) => data   resource-specific rules (e.g. video)
 */
module.exports = ({
  Model, label, fields, fileMap = {}, searchFields = ['title'], filterFields = [], slugFrom = null,
  order = null, extraWhere = null, prepare = null,
}) => {
  const fileColumns = Object.values(fileMap);
  const hasPublishedAt = Boolean(Model.rawAttributes.publishedAt);
  const defaultOrder = order || [[hasPublishedAt ? 'publishedAt' : 'createdAt', 'DESC'], ['id', 'DESC']];

  const buildData = async (req, existing) => {
    const files = uploadedPaths(req);
    let data = pick(req.body, fields);
    Object.entries(fileMap).forEach(([field, column]) => {
      if (files[field]) data[column] = files[field];
    });
    if (prepare) data = (await prepare({ req, data, files, existing })) || data;
    return data;
  };

  // Delete files that were replaced or removed by an update
  const removeReplacedFiles = (before, item) =>
    removeFiles(fileColumns.filter((c) => before[c] && before[c] !== item[c]).map((c) => before[c]));

  const sanitize = (item) => {
    const json = item.toJSON();
    if (json.business) {
      delete json.business.userId;
      delete json.business.status;
    }
    return json;
  };

  const findOr404 = async (id) => {
    const item = await Model.findByPk(id);
    if (!item) throw new AppError(`${label} not found`, 404);
    return item;
  };

  // Super Admin only: move a post to another business, or detach it (businessId: '') to make it a platform post.
  const applyBusinessChange = async (req, item) => {
    if (!isSuperAdmin(req.user) || !('businessId' in req.body)) return;
    const raw = req.body.businessId;
    if (raw === '' || raw === null) {
      item.businessId = null;
      return;
    }
    const business = await Business.findByPk(raw);
    if (!business) throw new AppError('Business not found', 404);
    item.businessId = business.id;
  };

  // GET / — public: published items of published businesses, plus published platform posts (no business)
  const list = asyncHandler(async (req, res) => {
    const pg = paginate(req.query);
    const where = { status: 'PUBLISHED' };
    const and = [{ [Op.or]: [{ businessId: null }, { '$business.status$': 'PUBLISHED' }] }];
    if (req.query.businessId) where.businessId = req.query.businessId;
    filterFields.forEach((f) => {
      if (req.query[f]) where[f] = { [Op.like]: `%${req.query[f]}%` };
    });
    if (req.query.q) and.push({ [Op.or]: searchFields.map((f) => ({ [f]: { [Op.like]: `%${req.query.q}%` } })) });
    where[Op.and] = and;
    if (extraWhere) extraWhere(req, where);

    const { rows, count } = await Model.findAndCountAll({
      where,
      include: [{ model: Business, as: 'business', attributes: BUSINESS_PUBLIC_ATTRS, required: false }],
      order: defaultOrder,
      limit: pg.limit,
      offset: pg.offset,
      distinct: true,
    });
    return ok(res, paged(rows, count, pg));
  });

  // GET /mine — the caller's own items in every status (Super Admin: ?businessId=, or none for platform posts)
  const mine = asyncHandler(async (req, res) => {
    const pg = paginate(req.query);
    const business = await resolveBusiness(req, { allowNone: true });
    const where = { businessId: business ? business.id : null };
    if (req.query.status) where.status = req.query.status;
    const { rows, count } = await Model.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pg.limit,
      offset: pg.offset,
    });
    return ok(res, paged(rows, count, pg));
  });

  // GET /:id — public when published; owner / Super Admin can also see drafts, pending and rejected items
  const getOne = asyncHandler(async (req, res) => {
    const param = req.params.id;
    let where;
    if (/^\d+$/.test(param)) where = { id: param };
    else if (slugFrom) where = { slug: param };
    else throw new AppError('Invalid id', 400);

    const item = await Model.findOne({
      where,
      include: [{ model: Business, as: 'business', attributes: [...BUSINESS_PUBLIC_ATTRS, 'userId', 'status'] }],
    });
    if (!item) throw new AppError(`${label} not found`, 404);

    const visible = item.status === 'PUBLISHED' && (!item.business || item.business.status === 'PUBLISHED');
    if (!visible && !isManager(req.user, item.business)) throw new AppError(`${label} not found`, 404);
    return ok(res, sanitize(item));
  });

  const create = asyncHandler(async (req, res) => {
    // Super Admin may omit businessId to publish as the platform itself (no business attached)
    const business = await resolveBusiness(req, { allowNone: true });
    const data = await buildData(req, null);
    if (slugFrom) data.slug = await uniqueSlug(Model, data[slugFrom]);

    const item = Model.build({ ...data, businessId: business ? business.id : null });
    applyStatus(item, resolveStatus(req.user, req.body.status, null));
    await item.save();
    return created(res, item, `${label} created`);
  });

  const update = asyncHandler(async (req, res) => {
    const item = await findOr404(req.params.id);
    await assertCanManage(req.user, item.businessId);

    const before = Object.fromEntries(fileColumns.map((c) => [c, item[c]]));
    item.set(await buildData(req, item));
    await applyBusinessChange(req, item);
    applyStatus(item, resolveStatus(req.user, req.body.status, item.status));
    await item.save();

    removeReplacedFiles(before, item);
    return ok(res, item, `${label} updated`);
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await findOr404(req.params.id);
    await assertCanManage(req.user, item.businessId);
    const files = collectFiles(item);
    await item.destroy();
    removeFiles(files);
    return ok(res, null, `${label} deleted`);
  });

  return { list, mine, getOne, create, update, remove };
};
