const contentRouter = require('./contentRouter');

module.exports = contentRouter({
  controller: require('../controllers/strategyController'),
  files: ['coverImage', 'coverImage2'],
  rules: require('../middlewares/validators').strategy,
});
