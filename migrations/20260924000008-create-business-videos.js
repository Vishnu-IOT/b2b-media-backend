'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('business_videos', {
      id,
      businessId: fk('businesses'),
      title: { type: T.STRING(255), allowNull: false },
      description: { type: T.TEXT },
      youtubeUrl: { type: T.STRING(500) },
      videoPath: { type: T.STRING(500) },
      thumbnail: { type: T.STRING(500) },
      type: { type: T.ENUM('YOUTUBE', 'UPLOAD'), allowNull: false },
      status: status(),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('business_videos'),
};
