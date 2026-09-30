'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('questions', {
      id,
      userId: fk('users'),
      title: { type: T.STRING(255), allowNull: false },
      description: { type: T.TEXT, allowNull: false },
      category: { type: T.STRING(120) },
      status: status('PUBLISHED'),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('questions'),
};
