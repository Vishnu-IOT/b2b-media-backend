'use strict';
const { idField, fkField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Notification',
    {
      id: idField(DataTypes),
      userId: fkField(DataTypes),
      type: { type: DataTypes.STRING(50), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      message: DataTypes.TEXT,
      questionId: fkField(DataTypes, true),
      answerId: fkField(DataTypes, true),
      isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'notifications' }
  );
