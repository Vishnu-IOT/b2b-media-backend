const { CONTENT_STATUS_LIST } = require('../config/constants');

const idField = (DataTypes) => ({ type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true });
const fkField = (DataTypes, allowNull = false) => ({ type: DataTypes.INTEGER.UNSIGNED, allowNull });
const statusField = (DataTypes, defaultValue = 'DRAFT') => ({
  type: DataTypes.ENUM(...CONTENT_STATUS_LIST),
  allowNull: false,
  defaultValue,
});

module.exports = { idField, fkField, statusField };
