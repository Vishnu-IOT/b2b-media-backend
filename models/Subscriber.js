'use strict';
const { idField } = require('../utils/modelHelpers');

// A newsletter subscriber. No verification step: subscribing just adds the email.
// unsubscribeToken is the public link key used in every newsletter email's footer.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Subscriber',
    {
      id: idField(DataTypes),
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', value == null ? value : String(value).trim().toLowerCase());
        },
      },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, // false after unsubscribe
      unsubscribeToken: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    },
    { tableName: 'subscribers' }
  );
