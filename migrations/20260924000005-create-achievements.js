'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('achievements', {
      id,
      businessId: fk('businesses'),
      title: { type: T.STRING(255), allowNull: false },
      description: { type: T.TEXT },
      awardName: { type: T.STRING(255) },
      awardedBy: { type: T.STRING(255) },
      awardDate: { type: T.DATEONLY },
      image: { type: T.STRING(500) },
      status: status(),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('achievements'),
};
