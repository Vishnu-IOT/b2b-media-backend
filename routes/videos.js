const contentRouter = require('./contentRouter');

module.exports = contentRouter({
  controller: require('../controllers/videoController'),
  files: ['video', 'thumbnail'],
  rules: require('../middlewares/validators').video,
});
