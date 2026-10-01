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
      isEmailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      otp: { type: DataTypes.STRING(255), allowNull: true }, // bcrypt hash of the current registration OTP
      otpExpiresAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'users',
      // password/otp are never selected by default; use User.unscoped() when you need them (login, change password, verify-otp)
      defaultScope: { attributes: { exclude: ['password', 'otp', 'otpExpiresAt'] } },
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

  User.prototype.setOtp = async function setOtp(plainOtp, expiresInMinutes) {
    this.otp = await bcrypt.hash(plainOtp, 10);
    this.otpExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  };

  User.prototype.verifyOtp = async function verifyOtp(plainOtp) {
    if (!this.otp || !this.otpExpiresAt) return false;
    if (this.otpExpiresAt.getTime() < Date.now()) return false;
    return bcrypt.compare(plainOtp, this.otp);
  };

  User.prototype.clearOtp = function clearOtp() {
    this.otp = null;
    this.otpExpiresAt = null;
  };

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.otp;
    delete values.otpExpiresAt;
    return values;
  };

  return User;
};
