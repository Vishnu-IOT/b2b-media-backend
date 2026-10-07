'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'SupplierEnquiry',
    {
      id: idField(DataTypes),
      businessId: fkField(DataTypes, true), // NULL = platform post (no business)
      title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      description: { type: DataTypes.TEXT, allowNull: false },
      category: DataTypes.STRING(120),
      location: DataTypes.STRING(180),
      contactInfo: DataTypes.STRING(500),
      status: statusField(DataTypes),
    },
    { tableName: 'supplier_enquiries' }
  );
