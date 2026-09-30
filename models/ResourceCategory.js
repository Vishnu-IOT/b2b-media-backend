'use strict';
const { CATEGORY_STATUS_LIST } = require('../config/constants');
const { idField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'ResourceCategory',
    {
      id: idField(DataTypes),
      name: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { notEmpty: true } },
      slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      description: DataTypes.TEXT,
      status: { type: DataTypes.ENUM(...CATEGORY_STATUS_LIST), allowNull: false, defaultValue: 'ACTIVE' },
    },
    { tableName: 'resource_categories' }
  );
