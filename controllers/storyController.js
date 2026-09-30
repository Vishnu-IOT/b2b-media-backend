const factory = require('./factories/businessContentFactory');
const { BusinessStory } = require('../models');

module.exports = factory({
  Model: BusinessStory,
  label: 'Story',
  fields: ['title', 'content'],
  fileMap: { coverImage: 'coverImage', coverImage2: 'coverImage2' },
});
