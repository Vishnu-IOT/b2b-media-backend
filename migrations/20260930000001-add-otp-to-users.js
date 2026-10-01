'use strict';
const { DataTypes: T } = require('sequelize');

module.exports = {
  up: async (qi) => {
    await qi.addColumn('users', 'isEmailVerified', { type: T.BOOLEAN, allowNull: false, defaultValue: false });
    await qi.addColumn('users', 'otp', { type: T.STRING(255) });
    await qi.addColumn('users', 'otpExpiresAt', { type: T.DATE });
    // Existing users predate this feature — treat them as already verified so they aren't locked out.
    await qi.sequelize.query('UPDATE users SET isEmailVerified = TRUE');
  },
  down: async (qi) => {
    await qi.removeColumn('users', 'isEmailVerified');
    await qi.removeColumn('users', 'otp');
    await qi.removeColumn('users', 'otpExpiresAt');
  },
};
