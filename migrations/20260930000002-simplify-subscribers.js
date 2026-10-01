'use strict';
const { DataTypes: T } = require('sequelize');

module.exports = {
  up: async (qi) => {
    // Newsletter subscribing no longer requires OTP verification — treat every existing row as active.
    await qi.sequelize.query('UPDATE subscribers SET isActive = TRUE WHERE isVerified = TRUE OR isVerified IS NULL');
    await qi.removeColumn('subscribers', 'otp');
    await qi.removeColumn('subscribers', 'otpExpiresAt');
    await qi.removeColumn('subscribers', 'isVerified');
    await qi.removeColumn('subscribers', 'verifiedAt');
  },
  down: async (qi) => {
    await qi.addColumn('subscribers', 'otp', { type: T.STRING(255) });
    await qi.addColumn('subscribers', 'otpExpiresAt', { type: T.DATE });
    await qi.addColumn('subscribers', 'isVerified', { type: T.BOOLEAN, allowNull: false, defaultValue: true });
    await qi.addColumn('subscribers', 'verifiedAt', { type: T.DATE });
  },
};
