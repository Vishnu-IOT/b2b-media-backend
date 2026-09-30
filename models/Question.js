'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Question',
    {
      id: idField(DataTypes),
      userId: fkField(DataTypes),
      title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      description: { type: DataTypes.TEXT, allowNull: false },
      category: DataTypes.STRING(120),
      status: statusField(DataTypes, 'PUBLISHED'),
    },
    { tableName: 'questions' }
  );
