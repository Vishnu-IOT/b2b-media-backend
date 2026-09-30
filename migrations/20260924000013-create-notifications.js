'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('notifications', {
      id,
      userId: fk('users'),
      type: { type: T.STRING(50), allowNull: false },
      title: { type: T.STRING(255), allowNull: false },
      message: { type: T.TEXT },
      questionId: fk('questions', { allowNull: true }),
      answerId: fk('answers', { allowNull: true }),
      isRead: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('notifications'),
};
