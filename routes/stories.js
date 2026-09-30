const contentRouter = require('./contentRouter');

module.exports = contentRouter({
  controller: require('../controllers/storyController'),
  files: ['coverImage', 'coverImage2'],
  rules: require('../middlewares/validators').story,
});
