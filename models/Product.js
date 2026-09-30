'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

// Latest / upcoming product posts (a future launchDate = upcoming). Not a store item: no price, stock or checkout.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Product',
    {
      id: idField(DataTypes),
      businessId: fkField(DataTypes),
      name: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
      description: DataTypes.TEXT,
      image: DataTypes.STRING(500),
      image2: DataTypes.STRING(500),
      launchDate: DataTypes.DATEONLY,
      status: statusField(DataTypes),
    },
    { tableName: 'products' }
  );
