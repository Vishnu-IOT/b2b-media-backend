'use strict';
const { Op } = require('sequelize');
const { ResourceCategory } = require('../models');
const { slugify } = require('../utils/slug');

const CATEGORIES = [
  ['Marketing', 'Marketing tips and playbooks for growing businesses'],
  ['Sales', 'Sales techniques, lead generation and customer conversations'],
  ['Business Strategy', 'Planning, positioning and long-term growth strategy'],
  ['GST', 'GST updates, filing guides and calculation help'],
  ['Tax', 'Income tax and other tax updates for businesses'],
  ['MSME', 'MSME registration, benefits and support'],
  ['Startup', 'Guides and news for early-stage founders'],
  ['Finance', 'Funding, cash flow and financial management'],
  ['Government Schemes', 'Central and state schemes available to businesses'],
];

module.exports = {
  async up() {
    for (const [name, description] of CATEGORIES) {
      // eslint-disable-next-line no-await-in-loop
      await ResourceCategory.findOrCreate({ where: { slug: slugify(name) }, defaults: { name, description, status: 'ACTIVE' } });
    }
  },
  async down() {
    await ResourceCategory.destroy({ where: { slug: { [Op.in]: CATEGORIES.map(([n]) => slugify(n)) } } });
  },
};
