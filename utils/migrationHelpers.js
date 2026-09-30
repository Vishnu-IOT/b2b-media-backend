// Kept independent of app constants on purpose: migrations should never change meaning after they ship.
const { DataTypes: T, Sequelize } = require('sequelize');

const CONTENT = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'];
const now = Sequelize.literal('CURRENT_TIMESTAMP');

const id = { type: T.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false };

const fk = (table, { allowNull = false, onDelete = 'CASCADE', unique = false } = {}) => ({
  type: T.INTEGER.UNSIGNED,
  allowNull,
  unique,
  references: { model: table, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete,
});

const status = (defaultValue = 'DRAFT') => ({ type: T.ENUM(...CONTENT), allowNull: false, defaultValue });

const timestamps = {
  createdAt: { type: T.DATE, allowNull: false, defaultValue: now },
  updatedAt: { type: T.DATE, allowNull: false, defaultValue: now },
};

module.exports = { id, fk, status, timestamps };
