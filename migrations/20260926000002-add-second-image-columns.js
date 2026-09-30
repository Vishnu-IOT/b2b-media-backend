'use strict';
const { DataTypes: T } = require('sequelize');

module.exports = {
  up: async (qi) => {
    await qi.addColumn('business_stories', 'coverImage2', { type: T.STRING(500) });
    await qi.addColumn('business_strategies', 'coverImage2', { type: T.STRING(500) });
    await qi.addColumn('achievements', 'image2', { type: T.STRING(500) });
    await qi.addColumn('products', 'image2', { type: T.STRING(500) });
  },
  down: async (qi) => {
    await qi.removeColumn('business_stories', 'coverImage2');
    await qi.removeColumn('business_strategies', 'coverImage2');
    await qi.removeColumn('achievements', 'image2');
    await qi.removeColumn('products', 'image2');
  },
};
