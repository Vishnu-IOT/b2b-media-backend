// Used by both sequelize-cli (migrations/seeders) and the app (models/index.js)
require('dotenv').config({ quiet: true });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: 'mysql',
  logging: false,
  define: { underscored: false, freezeTableName: true },
};

module.exports = {
  development: { ...base },
  test: { ...base },
  production: { ...base, pool: { max: 10, min: 0, idle: 10000 } },
};
