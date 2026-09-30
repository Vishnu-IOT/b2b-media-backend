'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('supplier_enquiries', {
      id,
      businessId: fk('businesses'),
      title: { type: T.STRING(255), allowNull: false },
      description: { type: T.TEXT, allowNull: false },
      category: { type: T.STRING(120) },
      location: { type: T.STRING(180) },
      contactInfo: { type: T.STRING(500) },
      status: status(),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('supplier_enquiries'),
};
