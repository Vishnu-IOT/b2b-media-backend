'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Achievement',
    {
      id: idField(DataTypes),
      businessId: fkField(DataTypes),
      title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      description: DataTypes.TEXT,
      awardName: DataTypes.STRING(255),
      awardedBy: DataTypes.STRING(255),
      awardDate: DataTypes.DATEONLY,
      image: DataTypes.STRING(500),
      image2: DataTypes.STRING(500),
      status: statusField(DataTypes),
    },
    { tableName: 'achievements' }
  );
