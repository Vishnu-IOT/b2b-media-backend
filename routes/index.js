const router = require('express').Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } }));

router.use('/auth', require('./auth'));
router.use('/business', require('./business'));
router.use('/stories', require('./stories'));
router.use('/strategies', require('./strategies'));
router.use('/achievements', require('./achievements'));
router.use('/products', require('./products'));
router.use('/enquiries', require('./enquiries'));
router.use('/videos', require('./videos'));
router.use('/questions', require('./questions'));
router.use('/answers', require('./answers'));
router.use('/notifications', require('./notifications'));
router.use('/resource-categories', require('./resourceCategories'));
router.use('/resources', require('./resources'));
router.use('/admin', require('./admin'));
router.use('/newsletter', require('./newsletter'));

module.exports = router;
