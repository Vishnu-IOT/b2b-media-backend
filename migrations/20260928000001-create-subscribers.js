'use strict';
const { DataTypes: T } = require('sequelize');
const { id, timestamps } = require('../utils/migrationHelpers');

module.exports = {
  up: (qi) =>
    qi.createTable('subscribers', {
      id,
      email: { type: T.STRING(190), allowNull: false, unique: true },
      otp: { type: T.STRING(255) },
      otpExpiresAt: { type: T.DATE },
      isVerified: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
      verifiedAt: { type: T.DATE },
      isActive: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
      unsubscribeToken: { type: T.STRING(64), allowNull: false, unique: true },
      ...timestamps,
    }),
  down: (qi) => qi.dropTable('subscribers'),
};
