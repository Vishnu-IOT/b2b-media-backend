'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('answers', {
      id,
      questionId: fk('questions'),
      userId: fk('users'),
      answer: { type: T.TEXT, allowNull: false },
      status: status('PUBLISHED'),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('answers'),
};
