'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'BusinessStory',
    {
      id: idField(DataTypes),
      businessId: fkField(DataTypes, true), // NULL = platform post (no business)
      title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      content: { type: DataTypes.TEXT('long'), allowNull: false },
      coverImage: DataTypes.STRING(500),
      coverImage2: DataTypes.STRING(500),
      status: statusField(DataTypes),
      publishedAt: DataTypes.DATE,
    },
    { tableName: 'business_stories' }
  );
