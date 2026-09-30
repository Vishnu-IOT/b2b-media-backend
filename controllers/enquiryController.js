const factory = require('./factories/businessContentFactory');
const { SupplierEnquiry } = require('../models');

module.exports = factory({
  Model: SupplierEnquiry,
  label: 'Enquiry',
  fields: ['title', 'description', 'category', 'location', 'contactInfo'],
  searchFields: ['title', 'description'],
  filterFields: ['category', 'location'],
});
