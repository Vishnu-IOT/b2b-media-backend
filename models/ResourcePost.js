'use strict';
const { idField, fkField, statusField } = require('../utils/modelHelpers');

// A resource is a POST that belongs to a category (Marketing, GST, MSME ...), not a standalone entity.
// videoUrl holds either a YouTube URL or the path of an uploaded video.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'ResourcePost',
    {
      id: idField(DataTypes),
      categoryId: fkField(DataTypes),
      title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
      summary: DataTypes.TEXT,
      content: DataTypes.TEXT('long'),
      coverImage: DataTypes.STRING(500),
      videoUrl: DataTypes.STRING(500),
      filePath: DataTypes.STRING(500),
      status: statusField(DataTypes),
      publishedAt: DataTypes.DATE,
      createdBy: fkField(DataTypes, true),
    },
    { tableName: 'resource_posts' }
  );
