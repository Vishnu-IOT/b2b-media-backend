'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('business_stories', {
      id,
      businessId: fk('businesses'),
      title: { type: T.STRING(255), allowNull: false },
      content: { type: T.TEXT('long'), allowNull: false },
      coverImage: { type: T.STRING(500) },
      status: status(),
      publishedAt: { type: T.DATE },
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('business_stories'),
};
