'use strict';
const { DataTypes: T } = require('sequelize');
const { id, fk, status, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('businesses', {
      id,
      userId: fk('users', { unique: true }),
      companyName: { type: T.STRING(180), allowNull: false },
      slug: { type: T.STRING(220), allowNull: false, unique: true },
      description: { type: T.TEXT },
      story: { type: T.TEXT('long') },
      industry: { type: T.STRING(120) },
      location: { type: T.STRING(180) },
      website: { type: T.STRING(255) },
      phone: { type: T.STRING(30) },
      email: { type: T.STRING(190) },
      logo: { type: T.STRING(500) },
      coverImage: { type: T.STRING(500) },
      status: status(),
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('businesses'),
};
