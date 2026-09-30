'use strict';
const { User } = require('../models');

const email = () => (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();

module.exports = {
  async up() {
    // The User model hashes the password with bcrypt on create
    await User.findOrCreate({
      where: { email: email() },
      defaults: { name: 'Super Admin', password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123', role: 'SUPER_ADMIN' },
    });
  },
  async down() {
    await User.destroy({ where: { email: email() } });
  },
};
