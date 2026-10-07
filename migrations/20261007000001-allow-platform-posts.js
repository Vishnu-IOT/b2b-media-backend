'use strict';
const { DataTypes: T } = require('sequelize');

// Content tables a Super Admin can post to without attaching a business ("platform posts").
const TABLES = [
  'business_stories',
  'business_strategies',
  'achievements',
  'products',
  'supplier_enquiries',
  'business_videos',
];

const column = (allowNull) => ({ type: T.INTEGER.UNSIGNED, allowNull });

module.exports = {
  // Only NULL-ability changes. The foreign key (ON DELETE CASCADE) is left exactly as it was,
  // so deleting a business still deletes its content, while platform posts (businessId NULL) stay.
  up: async (qi) => {
    for (const table of TABLES) {
      // eslint-disable-next-line no-await-in-loop
      await qi.changeColumn(table, 'businessId', column(true));
    }
  },

  down: async (qi) => {
    for (const table of TABLES) {
      // eslint-disable-next-line no-await-in-loop
      const [[{ total }]] = await qi.sequelize.query(`SELECT COUNT(*) AS total FROM \`${table}\` WHERE businessId IS NULL`);
      if (Number(total) > 0) {
        throw new Error(
          `Cannot roll back: ${total} platform post(s) in "${table}" have no business. Delete them or assign a business first.`
        );
      }
    }
    for (const table of TABLES) {
      // eslint-disable-next-line no-await-in-loop
      await qi.changeColumn(table, 'businessId', column(false));
    }
  },
};
