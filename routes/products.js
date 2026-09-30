const contentRouter = require('./contentRouter');

module.exports = contentRouter({
  controller: require('../controllers/productController'),
  files: ['image', 'image2'],
  rules: require('../middlewares/validators').product,
});
