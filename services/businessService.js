const { Business, BusinessStory, BusinessStrategy, Achievement, Product, BusinessVideo } = require('../models');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const { collectFiles } = require('../utils/fileUtils');

const isSuperAdmin = (user) => Boolean(user) && user.role === ROLES.SUPER_ADMIN;
// `business` is null for platform posts (no business) — only a Super Admin manages those.
const isManager = (user, business) =>
  isSuperAdmin(user) || (Boolean(user) && Boolean(business) && business.userId === user.id);

/**
 * Which business is a request acting on?
 * - BUSINESS_ADMIN: always their own business (a body/query businessId is ignored)
 * - SUPER_ADMIN: the business given in body.businessId / query.businessId.
 *   With `allowNone`, leaving it out means "no business" (a platform post) and null is returned.
 */
const resolveBusiness = async (req, { allowNone = false } = {}) => {
  if (isSuperAdmin(req.user)) {
    const businessId = req.body.businessId || req.query.businessId;
    if (!businessId) {
      if (allowNone) return null;
      throw new AppError('businessId is required', 400);
    }
    const business = await Business.findByPk(businessId);
    if (!business) throw new AppError('Business not found', 404);
    return business;
  }
  const business = await Business.findOne({ where: { userId: req.user.id } });
  if (!business) throw new AppError('Create your business profile first', 400);
  return business;
};

// Ownership guard for content rows: SUPER_ADMIN passes, BUSINESS_ADMIN must own the business
const assertCanManage = async (user, businessId) => {
  if (isSuperAdmin(user)) return;
  const own = await Business.findOne({ where: { id: businessId, userId: user.id }, attributes: ['id'] });
  if (!own) throw new AppError('You do not have permission to modify this resource', 403);
};

// All stored files of a business and its content (so they can be deleted from disk with the business)
const collectBusinessFiles = async (business) => {
  const files = collectFiles(business);
  for (const Model of [BusinessStory, BusinessStrategy, Achievement, Product, BusinessVideo]) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await Model.findAll({ where: { businessId: business.id } });
    rows.forEach((row) => files.push(...collectFiles(row)));
  }
  return files;
};

module.exports = { isSuperAdmin, isManager, resolveBusiness, assertCanManage, collectBusinessFiles };
