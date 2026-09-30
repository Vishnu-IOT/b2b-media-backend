'use strict';
const { VIDEO_TYPES } = require('../config/constants');
const { idField, fkField, statusField } = require('../utils/modelHelpers');

// A video is EITHER a YouTube link (type YOUTUBE, youtubeUrl) OR an uploaded file (type UPLOAD, videoPath)
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'BusinessVideo',
    {
      id: idField(DataTypes),
      businessId: fkField(DataTypes),
      title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
      description: DataTypes.TEXT,
      youtubeUrl: DataTypes.STRING(500),
      videoPath: DataTypes.STRING(500),
      thumbnail: DataTypes.STRING(500),
      type: { type: DataTypes.ENUM(...VIDEO_TYPES), allowNull: false },
      status: statusField(DataTypes),
    },
    {
      tableName: 'business_videos',
      validate: {
        eitherUrlOrFile() {
          if (Boolean(this.youtubeUrl) === Boolean(this.videoPath)) {
            throw new Error('A video needs either youtubeUrl or an uploaded video (not both)');
          }
        },
      },
    }
  );
