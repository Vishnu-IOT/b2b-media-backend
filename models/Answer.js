'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Answer',
    {
      id: idField(DataTypes),
      questionId: fkField(DataTypes),
      userId: fkField(DataTypes),
      answer: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
      status: statusField(DataTypes, 'PUBLISHED'),
    },
    { tableName: 'answers' }
  );
