const factory = require('./factories/businessContentFactory');
const { BusinessStrategy } = require('../models');

module.exports = factory({
  Model: BusinessStrategy,
  label: 'Strategy',
  fields: ['title', 'content'],
  fileMap: { coverImage: 'coverImage', coverImage2: 'coverImage2' },
});
