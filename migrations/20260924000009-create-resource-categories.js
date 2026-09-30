'use strict';
const { DataTypes: T } = require('sequelize');
const { id, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('resource_categories', {
      id,
      name: { type: T.STRING(120), allowNull: false, unique: true },
      slug: { type: T.STRING(160), allowNull: false, unique: true },
      description: { type: T.TEXT },
      status: { type: T.ENUM('ACTIVE', 'INACTIVE'), allowNull: false, defaultValue: 'ACTIVE' },
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('resource_categories'),
};
