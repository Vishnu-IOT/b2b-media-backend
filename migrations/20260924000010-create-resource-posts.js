'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('resource_posts', {
      id,
      categoryId: fk('resource_categories', { onDelete: 'RESTRICT' }),
      title: { type: T.STRING(255), allowNull: false },
      slug: { type: T.STRING(280), allowNull: false, unique: true },
      summary: { type: T.TEXT },
      content: { type: T.TEXT('long') },
      coverImage: { type: T.STRING(500) },
      videoUrl: { type: T.STRING(500) },
      filePath: { type: T.STRING(500) },
      status: status(),
      publishedAt: { type: T.DATE },
      createdBy: fk('users', { allowNull: true, onDelete: 'SET NULL' }),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('resource_posts'),
};
