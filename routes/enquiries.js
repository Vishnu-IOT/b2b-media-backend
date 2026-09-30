const contentRouter = require('./contentRouter');

module.exports = contentRouter({
  controller: require('../controllers/enquiryController'),
  rules: require('../middlewares/validators').enquiry,
});
