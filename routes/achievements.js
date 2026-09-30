const contentRouter = require('./contentRouter');

module.exports = contentRouter({
  controller: require('../controllers/achievementController'),
  files: ['image', 'image2'],
  rules: require('../middlewares/validators').achievement,
});
