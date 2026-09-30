'use strict';
const { DataTypes: T } = require('sequelize');

// English, Tamil
const LANGUAGES = ['en', 'ta'];

module.exports = {
  up: (qi) =>
    qi.addColumn('businesses', 'language', {
      type: T.ENUM(...LANGUAGES),
      allowNull: false,
      defaultValue: 'en',
    }),
  down: (qi) => qi.removeColumn('businesses', 'language'),
};
