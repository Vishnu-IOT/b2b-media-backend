'use strict';
const { DataTypes: T } = require('sequelize');
const { id, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('users', {
      id,
      name: { type: T.STRING(120), allowNull: false },
      email: { type: T.STRING(190), allowNull: false, unique: true },
      password: { type: T.STRING(255), allowNull: false },
      role: { type: T.ENUM('SUPER_ADMIN', 'BUSINESS_ADMIN'), allowNull: false, defaultValue: 'BUSINESS_ADMIN' },
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('users'),
};
