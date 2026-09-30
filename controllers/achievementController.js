const factory = require('./factories/businessContentFactory');
const { Achievement } = require('../models');

module.exports = factory({
  Model: Achievement,
  label: 'Achievement',
  fields: ['title', 'description', 'awardName', 'awardedBy', 'awardDate'],
  fileMap: { image: 'image', image2: 'image2' },
  searchFields: ['title', 'awardName', 'awardedBy'],
  order: [['awardDate', 'DESC'], ['id', 'DESC']],
});
