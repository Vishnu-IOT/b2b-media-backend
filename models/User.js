'use strict';
const bcrypt = require('bcrypt');
const { ROLES } = require('../config/constants');
const { idField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: idField(DataTypes),
      name: { type: DataTypes.STRING(120), allowNull: false, validate: { notEmpty: true } },
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', value == null ? value : String(value).trim().toLowerCase());
        },
      },
      password: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM(...Object.values(ROLES)), allowNull: false, defaultValue: ROLES.BUSINESS_ADMIN },
    },
    {
      tableName: 'users',
      // The password is never selected by default; use User.unscoped() when you need the hash (login, change password)
      defaultScope: { attributes: { exclude: ['password'] } },
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = function comparePassword(plain) {
    return bcrypt.compare(plain, this.password);
  };

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};
