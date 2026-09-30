const { Op } = require('sequelize');
const factory = require('./factories/businessContentFactory');
const { Product } = require('../models');

// ?upcoming=true -> launchDate in the future, ?upcoming=false -> already launched (latest products)
module.exports = factory({
  Model: Product,
  label: 'Product',
  fields: ['name', 'description', 'launchDate'],
  fileMap: { image: 'image', image2: 'image2' },
  searchFields: ['name', 'description'],
  slugFrom: 'name',
  order: [['launchDate', 'DESC'], ['id', 'DESC']],
  extraWhere: (req, where) => {
    const today = new Date().toISOString().slice(0, 10);
    if (req.query.upcoming === 'true') where.launchDate = { [Op.gt]: today };
    if (req.query.upcoming === 'false') where.launchDate = { [Op.lte]: today };
  },
});
