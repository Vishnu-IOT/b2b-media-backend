'use strict';
const { LANGUAGES } = require('../config/constants');
const { idField, fkField, statusField } = require('../utils/modelHelpers');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Business',
    {
      id: idField(DataTypes),
      userId: { ...fkField(DataTypes), unique: true },
      companyName: { type: DataTypes.STRING(180), allowNull: false, validate: { notEmpty: true } },
      slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
      description: DataTypes.TEXT,
      story: DataTypes.TEXT('long'),
      industry: DataTypes.STRING(120),
      location: DataTypes.STRING(180),
      website: DataTypes.STRING(255),
      phone: DataTypes.STRING(30),
      email: { type: DataTypes.STRING(190), validate: { isEmail: true } },
      logo: DataTypes.STRING(500),
      coverImage: DataTypes.STRING(500),
      language: { type: DataTypes.ENUM(...LANGUAGES), allowNull: false, defaultValue: 'en' },
      status: statusField(DataTypes),
    },
    { tableName: 'businesses' }
  );
