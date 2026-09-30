'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('products', {
      id,
      businessId: fk('businesses'),
      name: { type: T.STRING(255), allowNull: false },
      slug: { type: T.STRING(280), allowNull: false, unique: true },
      description: { type: T.TEXT },
      image: { type: T.STRING(500) },
      launchDate: { type: T.DATEONLY },
      status: status(),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('products'),
};
