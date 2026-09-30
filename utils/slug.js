const { Op } = require('sequelize');

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150);

// Generates a slug that is unique within the model's table (adds -2, -3 ... on collision)
const uniqueSlug = async (Model, text, excludeId = null) => {
  const base = slugify(text) || `item-${Date.now().toString(36)}`;
  let slug = base;
  let n = 1;
  for (;;) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    // eslint-disable-next-line no-await-in-loop
    if (!(await Model.count({ where }))) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
};

module.exports = { slugify, uniqueSlug };
